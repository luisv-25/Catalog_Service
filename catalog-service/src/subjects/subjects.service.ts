import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Subject } from "./entities/subject.entity";

@Injectable()
export class SubjectsService {
  constructor(
    @InjectRepository(Subject) private readonly subjectsRepo: Repository<Subject>,
  ) {}

  findAll() {
    return this.subjectsRepo.find();
  }

  create(data: Partial<Subject>) {
    return this.subjectsRepo.save(this.subjectsRepo.create(data));
  }
}
