import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TutorProfile } from "./entities/tutor-profile.entity";
import { TutorSubject } from "./entities/tutor-subject.entity";
import { UserServiceClient } from "./user-service.client";

interface Requester {
  id: string;
  role: string;
}

@Injectable()
export class TutorsService {
  constructor(
    @InjectRepository(TutorProfile)
    private readonly tutorProfileRepo: Repository<TutorProfile>,
    @InjectRepository(TutorSubject)
    private readonly tutorSubjectRepo: Repository<TutorSubject>,
    private readonly userServiceClient: UserServiceClient,
  ) {}

  async search(subjectId?: string, level?: string, userId?: string, onlyApproved?: boolean) {
    const qb = this.tutorProfileRepo
      .createQueryBuilder("tp")
      .leftJoinAndSelect("tp.tutorSubjects", "ts")
      .leftJoinAndSelect("ts.subject", "s");

    if (subjectId) qb.andWhere("s.id = :subjectId", { subjectId });
    if (level) qb.andWhere("s.level = :level", { level });
    // Permite que el frontend resuelva el tutor_profile propio de un tutor
    // autenticado a partir de su user_id (referencia lógica, sección 5.10).
    if (userId) qb.andWhere("tp.user_id = :userId", { userId });
    // Filtro opcional para no listar tutores sin verificar (documento
    // primario: "antes de su publicación en el catálogo"). Queda detrás de
    // un query param, no por defecto, para no romper las vistas de
    // admin/tutor que necesitan ver el listado completo.
    if (onlyApproved) qb.andWhere("tp.verification_status = :vs", { vs: "approved" });

    return qb.orderBy("tp.avg_rating", "DESC").getMany();
  }

  async getProfile(tutorId: string) {
    const profile = await this.tutorProfileRepo.findOne({
      where: { id: tutorId },
      relations: ["tutorSubjects", "tutorSubjects.subject"],
    });
    if (!profile) throw new NotFoundException(`Tutor ${tutorId} no encontrado`);

    // Llamada SÍNCRONA a User Service: el dato "vivo" de identidad
    // (email, nombre) no se duplica de forma autoritativa en Catalog.
    const userProfile = await this.userServiceClient.getUserProfile(profile.user_id);

    return {
      id: profile.id,
      bio: profile.bio,
      hourlyRate: profile.hourly_rate,
      avgRating: profile.avg_rating,
      verificationStatus: profile.verification_status,
      subjects: profile.tutorSubjects.map((ts) => ({
        subjectId: ts.subject.id,
        name: ts.subject.name,
        yearsExperience: ts.years_experience,
      })),
      user: userProfile,
    };
  }

  // admin siempre puede; un tutor solo sobre su propio perfil.
  private async assertOwnerOrAdmin(profile: TutorProfile, requester: Requester) {
    if (requester.role === "admin") return;
    if (requester.role === "tutor" && requester.id === profile.user_id) return;
    throw new ForbiddenException("No tienes permiso sobre este perfil de tutor");
  }

  async updateProfile(
    tutorId: string,
    data: { bio?: string; hourlyRate?: number },
    requester: Requester,
  ) {
    const profile = await this.tutorProfileRepo.findOne({ where: { id: tutorId } });
    if (!profile) throw new NotFoundException(`Tutor ${tutorId} no encontrado`);
    await this.assertOwnerOrAdmin(profile, requester);

    if (data.bio !== undefined) profile.bio = data.bio;
    if (data.hourlyRate !== undefined) profile.hourly_rate = data.hourlyRate;

    return this.tutorProfileRepo.save(profile);
  }

  async addSubject(tutorId: string, subjectId: string, requester: Requester, yearsExperience = 0) {
    const profile = await this.tutorProfileRepo.findOne({ where: { id: tutorId } });
    if (!profile) throw new NotFoundException(`Tutor ${tutorId} no encontrado`);
    await this.assertOwnerOrAdmin(profile, requester);

    const link = this.tutorSubjectRepo.create({
      tutorProfile: profile,
      subject: { id: subjectId } as any,
      years_experience: yearsExperience,
    });
    return this.tutorSubjectRepo.save(link);
  }

  // Usado por el admin para "reasignar": quita al tutor de una materia
  // (normalmente seguido de un POST :id/subjects a la nueva materia).
  async removeSubject(tutorId: string, subjectId: string, requester: Requester) {
    const profile = await this.tutorProfileRepo.findOne({ where: { id: tutorId } });
    if (!profile) throw new NotFoundException(`Tutor ${tutorId} no encontrado`);
    await this.assertOwnerOrAdmin(profile, requester);

    const link = await this.tutorSubjectRepo.findOne({
      where: { tutorProfile: { id: tutorId }, subject: { id: subjectId } },
    });
    if (!link) throw new NotFoundException("El tutor no está asociado a esa materia");
    await this.tutorSubjectRepo.remove(link);
    return { removed: true };
  }
}
