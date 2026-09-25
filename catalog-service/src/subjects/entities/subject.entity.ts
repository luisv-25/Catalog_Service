import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("subjects")
export class Subject {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  area: string;

  @Column()
  level: string;
}
