import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Subject } from "./entities/subject.entity";
import { SubjectsService } from "./subjects.service";
import { SubjectsController } from "./subjects.controller";
import { JwtConfigModule } from "../common/jwt-config.module";

@Module({
  imports: [TypeOrmModule.forFeature([Subject]), JwtConfigModule],
  providers: [SubjectsService],
  controllers: [SubjectsController],
  exports: [SubjectsService],
})
export class SubjectsModule {}
