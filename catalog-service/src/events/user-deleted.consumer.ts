import { Controller, Logger } from "@nestjs/common";
import { Ctx, EventPattern, Payload, RmqContext } from "@nestjs/microservices";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TutorProfile } from "../tutors/entities/tutor-profile.entity";

interface UserDeletedEvent {
  eventName: string;
  occurredAt: string;
  data: { userId: string; role: string };
}

@Controller()
export class UserDeletedConsumer {
  private readonly logger = new Logger(UserDeletedConsumer.name);

  constructor(
    @InjectRepository(TutorProfile)
    private readonly tutorProfileRepo: Repository<TutorProfile>,
  ) {}

  // Permiso de admin en User Service: al eliminar una cuenta de tutor,
  // Catalog limpia su tutor_profile (y, por CASCADE, sus tutor_subjects y
  // ratings) para no dejar perfiles huérfanos en el directorio.
  @EventPattern("user.deleted")
  async handleUserDeleted(@Payload() event: UserDeletedEvent, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    try {
      if (event?.data?.role === "tutor") {
        const profile = await this.tutorProfileRepo.findOne({
          where: { user_id: event.data.userId },
        });
        if (profile) {
          await this.tutorProfileRepo.remove(profile);
          this.logger.log(`tutor_profile eliminado para user ${event.data.userId}`);
        }
      }
      channel.ack(originalMsg);
    } catch (err) {
      this.logger.error("Error procesando user.deleted", err as Error);
      channel.nack(originalMsg, false, true);
    }
  }
}
