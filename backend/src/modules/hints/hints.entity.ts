// Entity-Dekoratoren von TypeORM
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

// Definiert die Tabelle "Hint" in der Datenbank
@Entity()
export class Hint {
  // Primärschlüssel, wird automatisch generiert
  @PrimaryGeneratedColumn()
  id: number;

  // Spalte für den Hinweistext
  @Column()
  text: string;
}
