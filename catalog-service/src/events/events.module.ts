import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TutorProfile } from "../tutors/entities/tutor-profile.entity";
import { UserCreatedConsumer } from "./user-created.consumer";
import { UserDeletedConsumer } from "./user-deleted.consumer";
import { TutorVerificationUpdatedConsumer } from "./tutor-verification-updated.consumer";
import { FeedbackRatingUpdatedConsumer } from "./feedback-rating-updated.consumer";

@Module({
  imports: [TypeOrmModule.forFeature([TutorProfile])],
  controllers: [
    UserCreatedConsumer,
    UserDeletedConsumer,
    TutorVerificationUpdatedConsumer,
    FeedbackRatingUpdatedConsumer,
  ],
})
export class EventsModule {}
