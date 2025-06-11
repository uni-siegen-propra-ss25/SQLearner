import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

/**
 * Question entity represents a student's question in the system.
 */
@Entity('fragen')
export class Question {
  @PrimaryGeneratedColumn()
  id: number;

  /** Name of the student */
  @Column()
  student_name: string;

  /** The question asked */
  @Column()
  frage: string;

  /** The answer to the question (optional) */
  @Column({ nullable: true })
  antwort: string;

  /** Timestamp when the question was created */
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  erstellt_am: Date;

  /** Whether the question has been archived */
  @Column({ default: false })
  ist_archiviert: boolean;

  /** Whether the question is pinned */
  @Column({ default: false })
  ist_angepinnt: boolean;

  /** Whether the question is soft deleted */
  @Column({ default: false })
  ist_geloescht: boolean;

  /** Whether the question has been answered */
  @Column({ default: false })
  ist_beantwortet: boolean;
}
