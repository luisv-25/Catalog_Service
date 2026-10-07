import { Check, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { TutorProfile } from "../../tutors/entities/tutor-profile.entity";

@Entity("ratings")
@Check(`"score" >= 1 AND "score" <= 5`)
// Una sola calificación por reserva (booking_id), igual que ratings.booking_id
// UNIQUE en Feedback Service del documento de arquitectura (sección 5.6).
@Index(["booking_id"], { unique: true, where: `"booking_id" IS NOT NULL` })
export class Rating {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => TutorProfile, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tutor_id" })
  tutorProfile: TutorProfile;

  // Referencia lógica a user_db.users.id (el estudiante que califica)
  @Index()
  @Column()
  student_id: string;

  // Referencia lógica a booking_db.bookings.id — opcional porque en esta
  // demo se permite calificar aunque no exista una reserva formal asociada.
  @Column({ nullable: true })
  booking_id: string;

  @Column({ type: "int" })
  score: number;

  @Column({ type: "text", nullable: true })
  comment: string;

  @CreateDateColumn()
  created_at: Date;
}
