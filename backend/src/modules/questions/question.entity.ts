import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('fragen') // Gibt den Tabellennamen in der Datenbank an („fragen“ statt automatisch generiertem Namen)
export class Question {
  @PrimaryGeneratedColumn() // Automatisch generierter Primärschlüssel
  id: number;

  @Column() // Name des/der Studierenden
  student_name: string;

  @Column() // Die gestellte Frage
  frage: string;

  @Column({ nullable: true }) // Antwort kann optional sein (z. B. zu Beginn leer)
  antwort: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }) // Automatisches Erstellungsdatum
  erstellt_am: Date;

  @Column({ default: false }) // Gibt an, ob die Frage archiviert wurde
  ist_archiviert: boolean;

  @Column({ default: false }) // Gibt an, ob die Frage angepinnt wurde (für Priorisierung)
  ist_angepinnt: boolean;

  @Column({ default: false }) // Gibt an, ob die Frage gelöscht ist (Soft Delete)
  ist_geloescht: boolean;

  @Column({ default: false }) // Gibt an, ob eine Antwort vorhanden ist
  ist_beantwortet: boolean;
}
