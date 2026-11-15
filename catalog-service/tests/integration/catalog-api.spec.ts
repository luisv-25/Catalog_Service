import { INestApplication } from "@nestjs/common";
import { getRepositoryToken } from "@nestjs/typeorm";
import request from "supertest";
import { AppModule } from "../../src/app.module";
import { UserServiceClient } from "../../src/tutors/user-service.client";
import { UserCreatedConsumer } from "../../src/events/user-created.consumer";
import { TutorProfile } from "../../src/tutors/entities/tutor-profile.entity";
import { createTestApp, tokenFor } from "../helpers/test-app";

// Prueba de INTEGRACIÓN: endpoints -> servicios -> PostgreSQL real. Solo User Service (HTTP) se simula.
describe("Integración: catálogo de materias y tutores", () => {
  let app: INestApplication;
  const userClient = { getUserProfile: jest.fn(async (id: string) => ({ id, email: "tutor@educonecta.test", role: "tutor", fullName: "Tutor Demo" })) };
  const admin = tokenFor("admin-1", "admin");

  beforeAll(async () => {
    app = await createTestApp([AppModule], [{ provide: UserServiceClient, useValue: userClient }]);
  });
  afterAll(async () => app.close());

  it("Integración: el admin crea una materia, un tutor se asocia y edita su perfil, y al eliminar la materia se limpia la relación", async () => {
    const http = request(app.getHttpServer());

    // CREAR materia: solo admin (RBAC)
    await http.post("/api/v1/subjects").set("Authorization", `Bearer ${tokenFor("t1", "tutor")}`).send({ name: "Cálculo I", area: "Matemáticas", level: "universidad" }).expect(403);
    const subject = await http.post("/api/v1/subjects").set("Authorization", `Bearer ${admin}`).send({ name: "Cálculo I", area: "Matemáticas", level: "universidad" }).expect(201);
    const listed = await http.get("/api/v1/subjects").expect(200);
    expect(listed.body.map((s: any) => s.name)).toContain("Cálculo I");

    // Comunicación por EVENTO: user.created (rol tutor) crea el tutor_profile en el catálogo
    const ack = jest.fn();
    await app.get(UserCreatedConsumer).handleUserCreated(
      { eventName: "user.created", occurredAt: new Date().toISOString(), data: { userId: "user-tutor-1", email: "t@x.com", role: "tutor", fullName: "Tutor Demo" } },
      { getChannelRef: () => ({ ack, nack: jest.fn() }), getMessage: () => ({}) } as any,
    );
    expect(ack).toHaveBeenCalled();
    const tutors = await http.get("/api/v1/tutors?userId=user-tutor-1").expect(200);
    expect(tutors.body).toHaveLength(1);
    const tutorId = tutors.body[0].id;

    // ACTUALIZAR: otro tutor no puede (403); el dueño sí
    await http.patch(`/api/v1/tutors/${tutorId}/profile`).set("Authorization", `Bearer ${tokenFor("otro", "tutor")}`).send({ bio: "x" }).expect(403);
    const owner = tokenFor("user-tutor-1", "tutor");
    await http.patch(`/api/v1/tutors/${tutorId}/profile`).set("Authorization", `Bearer ${owner}`).send({ bio: "Tutor de cálculo", hourlyRate: 30000 }).expect(200);

    // ASOCIAR materia y CONSULTAR el perfil (mezcla BD + datos de User Service simulado)
    await http.post(`/api/v1/tutors/${tutorId}/subjects`).set("Authorization", `Bearer ${owner}`).send({ subjectId: subject.body.id, yearsExperience: 3 }).expect(201);
    const profile = await http.get(`/api/v1/tutors/${tutorId}/profile`).expect(200);
    expect(profile.body).toMatchObject({ bio: "Tutor de cálculo", user: { fullName: "Tutor Demo" } });
    expect(profile.body.subjects[0].name).toBe("Cálculo I");
    const bySubject = await http.get(`/api/v1/tutors?subjectId=${subject.body.id}`).expect(200);
    expect(bySubject.body.map((t: any) => t.id)).toContain(tutorId);

    // ELIMINAR materia (admin): desaparece y se limpia la relación con el tutor (ON DELETE CASCADE)
    await http.delete(`/api/v1/subjects/${subject.body.id}`).set("Authorization", `Bearer ${admin}`).expect(200);
    await http.delete(`/api/v1/subjects/${subject.body.id}`).set("Authorization", `Bearer ${admin}`).expect(404);
    const after = await http.get(`/api/v1/tutors/${tutorId}/profile`).expect(200);
    expect(after.body.subjects).toHaveLength(0);
    const stored = await app.get(getRepositoryToken(TutorProfile)).findOne({ where: { id: tutorId } });
    expect(stored?.bio).toBe("Tutor de cálculo");
  });
});
