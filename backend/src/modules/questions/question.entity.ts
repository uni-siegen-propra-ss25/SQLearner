import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('fragen') // Name der Tabelle in der DB (Deutsch!)
export class Question {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  student_name: string;

  @Column()
  frage: string;

  @Column({ nullable: true })
  antwort: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  erstellt_am: Date;

  @Column({ default: false })
  ist_archiviert: boolean;

  @Column({ default: false })
  ist_angepinnt: boolean;

  @Column({ default: false })
  ist_geloescht: boolean;

  @Column({ default: false })
  ist_beantwortet: boolean;
}
