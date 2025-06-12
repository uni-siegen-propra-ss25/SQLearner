import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

/**
 * Todo entity represents a task assigned to a user role.
 */
@Entity()
export class Todo {
  @PrimaryGeneratedColumn()
  id: number;

  /** Description of the task */
  @Column()
  text: string;

  /** Whether the task is completed */
  @Column({ default: false })
  done: boolean;

  /** Role of the user the task is assigned to */
  @Column()
  role: 'TUTOR' | 'STUDENT';

  /** Custom user field (not stored in database) */
  user: any;
}
