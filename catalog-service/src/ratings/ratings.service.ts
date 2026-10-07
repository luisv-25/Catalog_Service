import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Rating } from "./entities/rating.entity";
import { TutorProfile } from "../tutors/entities/tutor-profile.entity";
import { CreateRatingDto } from "./dto/create-rating.dto";

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(Rating) private readonly ratingsRepo: Repository<Rating>,
    @InjectRepository(TutorProfile)
    private readonly tutorProfileRepo: Repository<TutorProfile>,
  ) {}

  async rateTutor(tutorId: string, studentId: string, dto: CreateRatingDto) {
    const profile = await this.tutorProfileRepo.findOne({ where: { id: tutorId } });
    if (!profile) throw new NotFoundException(`Tutor ${tutorId} no encontrado`);

    const rating = await this.ratingsRepo.save(
      this.ratingsRepo.create({
        tutorProfile: profile,
        student_id: studentId,
        booking_id: dto.bookingId,
        score: dto.score,
        comment: dto.comment,
      }),
    );

    // Recalcula avg_rating a partir de todas las calificaciones del tutor
    // (feedback.rating.updated en el documento de arquitectura, sección 4.2).
    const { avg } = await this.ratingsRepo
      .createQueryBuilder("r")
      .select("AVG(r.score)", "avg")
      .where("r.tutorProfile = :tutorId", { tutorId })
      .getRawOne();

    profile.avg_rating = Number(Number(avg).toFixed(2));
    await this.tutorProfileRepo.save(profile);

    return { rating, avgRating: profile.avg_rating };
  }

  listForTutor(tutorId: string) {
    return this.ratingsRepo.find({
      where: { tutorProfile: { id: tutorId } },
      order: { created_at: "DESC" },
    });
  }
}
