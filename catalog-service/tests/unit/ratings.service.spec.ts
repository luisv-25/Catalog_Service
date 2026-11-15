import { NotFoundException } from "@nestjs/common";
import { RatingsService } from "../../src/ratings/ratings.service";

// Prueba UNITARIA: el promedio del tutor se recalcula (y redondea a 2 decimales) tras cada calificación.
describe("RatingsService (unitaria, con mocks)", () => {
  const profile: any = { id: "tp1", avg_rating: 0 };
  const queryBuilder: any = { select: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis(), getRawOne: jest.fn() };
  const ratingsRepo = {
    create: jest.fn((x) => x),
    save: jest.fn(async (x) => ({ id: "r1", ...x })),
    createQueryBuilder: jest.fn(() => queryBuilder),
  };
  const tutorProfileRepo = { findOne: jest.fn(), save: jest.fn(async (p) => p) };
  const service = new RatingsService(ratingsRepo as any, tutorProfileRepo as any);

  it("Unitaria 3 (extra): recalcula avg_rating con 2 decimales y rechaza tutores inexistentes", async () => {
    tutorProfileRepo.findOne.mockResolvedValueOnce(null);
    await expect(service.rateTutor("x", "s1", { bookingId: "b1", score: 5 } as any)).rejects.toBeInstanceOf(NotFoundException);

    tutorProfileRepo.findOne.mockResolvedValueOnce(profile);
    queryBuilder.getRawOne.mockResolvedValue({ avg: "4.33333333" });
    const result = await service.rateTutor("tp1", "s1", { bookingId: "b1", score: 4, comment: "bien" } as any);

    expect(result.avgRating).toBe(4.33);
    expect(tutorProfileRepo.save).toHaveBeenCalledWith(expect.objectContaining({ avg_rating: 4.33 }));
  });
});
