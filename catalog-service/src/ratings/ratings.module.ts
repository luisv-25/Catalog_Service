import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Rating } from "./entities/rating.entity";
import { TutorProfile } from "../tutors/entities/tutor-profile.entity";
import { RatingsService } from "./ratings.service";
import { RatingsController } from "./ratings.controller";
import { JwtConfigModule } from "../common/jwt-config.module";

@Module({
  imports: [TypeOrmModule.forFeature([Rating, TutorProfile]), JwtConfigModule],
  providers: [RatingsService],
  controllers: [RatingsController],
})
export class RatingsModule {}
