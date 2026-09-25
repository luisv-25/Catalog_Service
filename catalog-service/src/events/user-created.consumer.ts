import { Controller, Logger } from "@nestjs/common";
import { Ctx, EventPattern, Payload, RmqContext } from "@nestjs/microservices";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TutorProfile } from "../tutors/entities/tutor-profile.entity";

interface UserCreatedEvent {
  eventName: string;
  occurredAt: string;
  data: {
    userId: string;
    email: string;
    role: string;
    fullName?: string;
  };
}

@Controller()
export class UserCreatedConsumer {
  private readonly logger = new Logger(UserCreatedConsumer.name);

  constructor(
    @InjectRepository(TutorProfile)
    private readonly tutorProfileRepo: Repository<TutorProfile>,
  ) {}

  // Comunicación ASÍNCRONA (RabbitMQ): Catalog reacciona a user.created
  // creando el registro base de tutor_profile, tal como especifica la
  // sección 4.2 del documento de arquitectura.
  @EventPattern("user.created")
  async handleUserCreated(
    @Payload() event: UserCreatedEvent,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      if (event?.data?.role !== "tutor") {
        this.logger.log(
          `user.created ignorado (role=${event?.data?.role}), no requiere tutor_profile`,
        );
        channel.ack(originalMsg);
        return;
      }

      const exists = await this.tutorProfileRepo.findOne({
        where: { user_id: event.data.userId },
      });
      if (!exists) {
        await this.tutorProfileRepo.save(
          this.tutorProfileRepo.create({
            user_id: event.data.userId,
            full_name: event.data.fullName,
            bio: "",
            hourly_rate: 0,
            avg_rating: 0,
          }),
        );
        this.logger.log(`tutor_profile creado para user ${event.data.userId}`);
      }

      channel.ack(originalMsg);
    } catch (err) {
      this.logger.error("Error procesando user.created", err as Error);
      // no se hace ack -> RabbitMQ reencola el mensaje según la política de reintentos
      channel.nack(originalMsg, false, true);
    }
  }
}
