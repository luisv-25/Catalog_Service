import { Injectable, NotFoundException } from "@nestjs/common";
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

  // Permiso de admin: eliminar una materia del catálogo. tutor_subjects
  // tiene onDelete: "CASCADE" hacia Subject (ver tutor-subject.entity.ts),
  // así que borrar la materia también quita automáticamente la relación
  // de cualquier tutor que la ofreciera -- no hace falta borrarla a mano
  // aparte. booking_db.bookings.subject_id es una referencia LÓGICA
  // (sección 5.10, bases distintas, sin FK física), así que una reserva ya
  // hecha con esta materia no se borra ni se bloquea: simplemente queda
  // apuntando a un id que ya no existe en el catálogo, igual que pasa hoy
  // si se elimina un tutor o un estudiante.
  async remove(id: string) {
    const subject = await this.subjectsRepo.findOne({ where: { id } });
    if (!subject) throw new NotFoundException(`Materia ${id} no encontrada`);
    await this.subjectsRepo.remove(subject);
    return { deleted: true, subjectId: id };
  }
}
