import { Controller, Logger } from "@nestjs/common";
import { Ctx, EventPattern, Payload, RmqContext } from "@nestjs/microservices";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TutorProfile } from "../tutors/entities/tutor-profile.entity";

interface FeedbackRatingUpdatedEvent {
  eventName: string;
  occurredAt: string;
  data: { tutorId: string; avgRating: number; ratingCount: number };
}

@Controller()
export class FeedbackRatingUpdatedConsumer {
  private readonly logger = new Logger(FeedbackRatingUpdatedConsumer.name);

  constructor(
    @InjectRepository(TutorProfile)
    private readonly tutorProfileRepo: Repository<TutorProfile>,
  ) {}

  // Comunicación ASÍNCRONA (sección 5.11 del documento: "feedback.rating.updated
  // | Feedback Service | Catalog Service, Analytics Service"). Feedback ya
  // manda el promedio recalculado, así que Catalog solo lo guarda -- no
  // vuelve a calcularlo.
  //
  // NOTA: tutor_profiles.avg_rating también puede actualizarse hoy vía
  // POST /tutors/:id/ratings (el sistema de calificación propio de Catalog
  // que ya estaba en producción antes de que existiera Feedback Service).
  // Mientras el frontend siga usando ese endpoint en vez de POST /feedback,
  // ambos caminos escriben el mismo campo y "gana" el que llegó último.
  // Migrar el botón "Calificar" del frontend para que llame a
  // POST /feedback (y así Feedback quede como única fuente de verdad) es
  // el paso natural que falta -- no se hizo aquí porque no se pidió tocar
  // el frontend en esta entrega.
  @EventPattern("feedback.rating.updated")
  async handleFeedbackRatingUpdated(
    @Payload() event: FeedbackRatingUpdatedEvent,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    try {
      const profile = await this.tutorProfileRepo.findOne({ where: { id: event.data.tutorId } });
      if (profile) {
        profile.avg_rating = event.data.avgRating;
        await this.tutorProfileRepo.save(profile);
        this.logger.log(`tutor_profile ${event.data.tutorId} -> avg_rating=${event.data.avgRating}`);
      } else {
        this.logger.warn(`No hay tutor_profile con id ${event.data.tutorId}`);
      }
      channel.ack(originalMsg);
    } catch (err) {
      this.logger.error("Error procesando feedback.rating.updated", err as Error);
      channel.nack(originalMsg, false, true);
    }
  }
}
