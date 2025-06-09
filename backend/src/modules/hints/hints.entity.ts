import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Hint {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  text: string;
}
