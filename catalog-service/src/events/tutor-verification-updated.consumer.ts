import { Controller, Logger } from "@nestjs/common";
import { Ctx, EventPattern, Payload, RmqContext } from "@nestjs/microservices";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TutorProfile, TutorVerificationStatus } from "../tutors/entities/tutor-profile.entity";

interface TutorVerificationUpdatedEvent {
  eventName: string;
  occurredAt: string;
  data: { userId: string; status: string };
}

@Controller()
export class TutorVerificationUpdatedConsumer {
  private readonly logger = new Logger(TutorVerificationUpdatedConsumer.name);

  constructor(
    @InjectRepository(TutorProfile)
    private readonly tutorProfileRepo: Repository<TutorProfile>,
  ) {}

  // Comunicación ASÍNCRONA: User Service publica esto al aprobar/rechazar
  // una credencial (documento primario, sección 2: "flujo de aprobación
  // manual antes de su publicación en el catálogo"). Catalog guarda su
  // propia copia de verification_status para poder filtrar /tutors sin
  // depender de una llamada síncrona a User en cada listado.
  @EventPattern("tutor.verification.updated")
  async handleTutorVerificationUpdated(
    @Payload() event: TutorVerificationUpdatedEvent,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    try {
      const status = event?.data?.status as TutorVerificationStatus;
      const validStatuses = Object.values(TutorVerificationStatus);
      if (!event?.data?.userId || !validStatuses.includes(status)) {
        this.logger.warn(`tutor.verification.updated con payload inesperado: ${JSON.stringify(event)}`);
        channel.ack(originalMsg);
        return;
      }

      const profile = await this.tutorProfileRepo.findOne({ where: { user_id: event.data.userId } });
      if (profile) {
        profile.verification_status = status;
        await this.tutorProfileRepo.save(profile);
        this.logger.log(`tutor_profile de user ${event.data.userId} -> verification_status=${status}`);
      } else {
        // El tutor_profile se crea al procesar user.created; si este evento
        // llega antes (orden no garantizado entre colas), no hay nada que
        // actualizar todavía — no es un error, solo se ignora.
        this.logger.warn(`No hay tutor_profile para user ${event.data.userId} todavía`);
      }
      channel.ack(originalMsg);
    } catch (err) {
      this.logger.error("Error procesando tutor.verification.updated", err as Error);
      channel.nack(originalMsg, false, true);
    }
  }
}
