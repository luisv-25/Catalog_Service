import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { TutorProfile } from "./tutor-profile.entity";
import { Subject } from "../../subjects/entities/subject.entity";

@Entity("tutor_subjects")
@Unique(["tutorProfile", "subject"])
@Index(["subject", "tutorProfile"])
export class TutorSubject {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => TutorProfile, (tp) => tp.tutorSubjects, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tutor_id" })
  tutorProfile: TutorProfile;

  @ManyToOne(() => Subject, { onDelete: "CASCADE" })
  @JoinColumn({ name: "subject_id" })
  subject: Subject;

  @Column({ default: 0 })
  years_experience: number;
}
