import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

/**
 * Hint entity represents a simple hint message in the database.
 */
@Entity()
export class Hint {
  /** Primary key (auto-incremented ID) */
  @PrimaryGeneratedColumn()
  id: number;

  /** The content of the hint */
  @Column()
  text: string;
}
