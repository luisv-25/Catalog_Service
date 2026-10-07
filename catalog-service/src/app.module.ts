import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SubjectsModule } from "./subjects/subjects.module";
import { TutorsModule } from "./tutors/tutors.module";
import { RatingsModule } from "./ratings/ratings.module";
import { EventsModule } from "./events/events.module";
import { Subject } from "./subjects/entities/subject.entity";
import { TutorProfile } from "./tutors/entities/tutor-profile.entity";
import { TutorSubject } from "./tutors/entities/tutor-subject.entity";
import { Rating } from "./ratings/entities/rating.entity";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 5434,
      username: process.env.DB_USER || "catalog_svc",
      password: process.env.DB_PASSWORD || "catalog_svc_pw",
      database: process.env.DB_NAME || "catalog_db",
      ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
      entities: [Subject, TutorProfile, TutorSubject, Rating],
      synchronize: process.env.DB_SYNCHRONIZE !== "false", // igual que en user-service: válido para esta entrega local
    }),
    SubjectsModule,
    TutorsModule,
    RatingsModule,
    EventsModule,
  ],
})
export class AppModule {}
