import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity() // Markiert die Klasse als Datenbanktabelle (Tabellenname wird automatisch zu „todo“)
export class Todo {
  @PrimaryGeneratedColumn() // Automatisch generierter Primärschlüssel
  id: number;

  @Column() // Text der ToDo-Aufgabe
  text: string;

  @Column({ default: false }) // Status: Ist die Aufgabe erledigt? Standard = false
  done: boolean;

  @Column() // Rolle, für wen die Aufgabe gedacht ist (TUTOR oder STUDENT)
  role: 'TUTOR' | 'STUDENT';

  user: any; // Zusatzfeld (nicht in der Datenbank gespeichert, da ohne @Column), evtl. für spätere Erweiterung
}

