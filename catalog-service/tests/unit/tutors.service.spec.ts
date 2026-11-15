import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { TutorsService } from "../../src/tutors/tutors.service";

// Pruebas UNITARIAS de TutorsService (regla de permisos): repositorios y cliente de User Service con mocks.
describe("TutorsService (unitaria, con mocks)", () => {
  const profile = { id: "tp1", user_id: "user-tutor-1", bio: "vieja", hourly_rate: 10000 };
  const tutorProfileRepo = { findOne: jest.fn(), save: jest.fn(async (p) => p) };
  const service = new TutorsService(tutorProfileRepo as any, {} as any, {} as any);

  beforeEach(() => {
    jest.clearAllMocks();
    tutorProfileRepo.findOne.mockResolvedValue({ ...profile });
  });

  it("Unitaria 1: un tutor NO puede editar el perfil de otro tutor (ForbiddenException) pero el dueño y el admin sí", async () => {
    await expect(
      service.updateProfile("tp1", { bio: "hackeado" }, { id: "otro-tutor", role: "tutor" }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(tutorProfileRepo.save).not.toHaveBeenCalled();

    const propio = await service.updateProfile("tp1", { bio: "nueva bio", hourlyRate: 25000 }, { id: "user-tutor-1", role: "tutor" });
    expect(propio).toMatchObject({ bio: "nueva bio", hourly_rate: 25000 });

    const admin = await service.updateProfile("tp1", { bio: "por admin" }, { id: "admin-1", role: "admin" });
    expect(admin.bio).toBe("por admin");
  });

  it("Unitaria 2: editar o agregar materia a un tutor inexistente lanza NotFoundException", async () => {
    tutorProfileRepo.findOne.mockResolvedValue(null);
    await expect(service.updateProfile("no-existe", { bio: "x" }, { id: "a", role: "admin" })).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.addSubject("no-existe", "s1", { id: "a", role: "admin" })).rejects.toBeInstanceOf(NotFoundException);
  });
});
