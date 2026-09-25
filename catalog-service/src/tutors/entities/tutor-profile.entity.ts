import { Check, Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { TutorSubject } from "./tutor-subject.entity";

@Entity("tutor_profiles")
// >= 0 (no > 0): el UserCreatedConsumer crea el perfil con hourly_rate: 0
// como valor inicial, antes de que el tutor configure su tarifa real.
@Check(`"hourly_rate" >= 0`)
@Check(`"avg_rating" >= 0 AND "avg_rating" <= 5`)
export class TutorProfile {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  // Referencia LÓGICA a user_db.users.id — sin FK física entre bases distintas,
  // tal como se definió en la sección 5.10 del documento de arquitectura.
  @Index({ unique: true })
  @Column()
  user_id: string;

  @Column({ nullable: true })
  full_name: string;

  @Column({ type: "text", nullable: true })
  bio: string;

  @Column({ type: "numeric", precision: 10, scale: 2, default: 0 })
  hourly_rate: number;

  @Index()
  @Column({ type: "numeric", precision: 3, scale: 2, default: 0 })
  avg_rating: number;

  @OneToMany(() => TutorSubject, (ts) => ts.tutorProfile)
  tutorSubjects: TutorSubject[];
}
