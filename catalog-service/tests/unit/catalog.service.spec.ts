import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { RatingsService } from "../../src/ratings/ratings.service";
import { TutorsService } from "../../src/tutors/tutors.service";

// Pruebas UNITARIAS: repositorios (BD) y cliente de User Service reemplazados por mocks.
describe("Catálogo (unitarias, con mocks)", () => {
  it("Unitaria 1: calificar a un tutor guarda la nota y recalcula el promedio a 2 decimales; tutor inexistente lanza NotFoundException", async () => {
    const perfil: any = { id: "t1", avg_rating: 0 };
    const tutorProfileRepo = { findOne: jest.fn(), save: jest.fn(async (p) => p) };
    const consulta = { select: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis(), getRawOne: jest.fn() };
    const ratingsRepo = {
      create: jest.fn((d) => d),
      save: jest.fn(async (r) => ({ id: "r1", ...r })),
      createQueryBuilder: jest.fn(() => consulta),
    };
    const service = new RatingsService(ratingsRepo as any, tutorProfileRepo as any);

    // Tutor inexistente: no se guarda nada
    tutorProfileRepo.findOne.mockResolvedValueOnce(null);
    await expect(service.rateTutor("nope", "s1", { score: 5 } as any)).rejects.toBeInstanceOf(NotFoundException);
    expect(ratingsRepo.save).not.toHaveBeenCalled();

    // Promedio de la BD "4.3333333" -> 4.33
    tutorProfileRepo.findOne.mockResolvedValueOnce(perfil);
    consulta.getRawOne.mockResolvedValue({ avg: "4.3333333" });
    const res = await service.rateTutor("t1", "s1", { score: 4, comment: "Muy claro" } as any);

    expect(ratingsRepo.create).toHaveBeenCalledWith(expect.objectContaining({ student_id: "s1", score: 4 }));
    expect(res.avgRating).toBe(4.33);
    expect(tutorProfileRepo.save).toHaveBeenCalledWith(expect.objectContaining({ avg_rating: 4.33 }));
  });

  it("Unitaria 2: solo el admin o el tutor dueño editan el perfil; y el perfil se completa con datos de User Service", async () => {
    const perfil: any = { id: "t1", user_id: "u-tutor", bio: "", hourly_rate: 0, avg_rating: 4.5, verification_status: "approved", tutorSubjects: [] };
    const tutorProfileRepo = { findOne: jest.fn().mockResolvedValue(perfil), save: jest.fn(async (p) => p) };
    const userClient = { getUserProfile: jest.fn().mockResolvedValue({ id: "u-tutor", email: "t@x.com", role: "tutor" }) };
    const service = new TutorsService(tutorProfileRepo as any, {} as any, userClient as any);

    // Otro tutor y un estudiante: 403 y no se guarda
    await expect(service.updateProfile("t1", { bio: "hack" }, { id: "otro", role: "tutor" })).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.updateProfile("t1", { bio: "hack" }, { id: "u-tutor", role: "student" })).rejects.toBeInstanceOf(ForbiddenException);
    expect(tutorProfileRepo.save).not.toHaveBeenCalled();

    // Dueño y admin sí pueden
    await service.updateProfile("t1", { bio: "Hola", hourlyRate: 30000 }, { id: "u-tutor", role: "tutor" });
    expect(tutorProfileRepo.save).toHaveBeenCalledWith(expect.objectContaining({ bio: "Hola", hourly_rate: 30000 }));
    await expect(service.updateProfile("t1", { bio: "Admin" }, { id: "adm", role: "admin" })).resolves.toBeDefined();

    // getProfile llama a User Service con el user_id del perfil
    const completo = await service.getProfile("t1");
    expect(userClient.getUserProfile).toHaveBeenCalledWith("u-tutor");
    expect(completo.user).toEqual({ id: "u-tutor", email: "t@x.com", role: "tutor" });
    expect(completo.avgRating).toBe(4.5);
  });
});
