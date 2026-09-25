import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HttpModule } from "@nestjs/axios";
import { TutorProfile } from "./entities/tutor-profile.entity";
import { TutorSubject } from "./entities/tutor-subject.entity";
import { TutorsService } from "./tutors.service";
import { TutorsController } from "./tutors.controller";
import { UserServiceClient } from "./user-service.client";
import { JwtConfigModule } from "../common/jwt-config.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([TutorProfile, TutorSubject]),
    HttpModule,
    JwtConfigModule,
  ],
  providers: [TutorsService, UserServiceClient],
  controllers: [TutorsController],
  exports: [TutorsService],
})
export class TutorsModule {}
