import { Component, OnInit } from '@angular/core';
import { QuestionService, Question } from 'app/features/welcome/services/question.service';

@Component({
  selector: 'app-fragen-chat',
  templateUrl: './fragen-chat.component.html',
  styleUrls: ['./fragen-chat.component.scss']
})
export class FragenChatComponent implements OnInit {

  newMessage: string = '';

  questions: Question[] = [];

  constructor(private questionService: QuestionService) {}

  ngOnInit() {
    this.loadQuestions(); // Lade alle relevanten Fragen aus dem Backend
  }

  /**
   * Lädt alle Fragen vom Server, filtert archivierte oder gelöschte raus
   * und sortiert sie nach Erstellungsdatum (älteste zuerst).
   */
  loadQuestions() {
    this.questionService.getAll().subscribe(data => {
      this.questions = data
        .filter(q => !q.ist_archiviert && !q.ist_geloescht)
        .sort((a, b) => new Date(a.erstellt_am).getTime() - new Date(b.erstellt_am).getTime());
    });
  }

  /**
   * Sendet eine neue Nachricht (Frage) des Studenten.
   * Wenn die Nachricht leer ist (nur Leerzeichen), passiert nichts.
   */
  sendMessage() {
    const trimmed = this.newMessage.trim();
    if (!trimmed) return;

    // Erstelle neue Frage über den QuestionService
    this.questionService.create({
      student_name: 'Student',
      frage: trimmed
    }).subscribe(() => {
      // Nach erfolgreichem Senden: Eingabefeld leeren & Nachrichten neu laden
      this.newMessage = '';
      this.loadQuestions();
    });
  }

  /**
   * Löscht eine Nachricht (Frage) anhand ihrer ID.
   * Wird im UI über das Papierkorb-Icon ausgelöst.
   */
  deleteMessage(question: Question) {
    this.questionService.löschen(question.id).subscribe(() => {
      this.loadQuestions(); // Liste neu laden nach erfolgreichem Löschen
    });
  }

  /**
   * Wenn ein Nutzer eine Datei hochlädt, wird der Dateiname als Nachricht gesendet.
   * (Die Datei selbst wird NICHT hochgeladen – nur der Name wird als Text gespeichert)
   */
  handleFileUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const fileMessage = `📎 Datei angehängt: ${file.name}`;

      // Nachricht mit Dateinamen als Text erstellen
      this.questionService.create({
        student_name: 'Student',
        frage: fileMessage
      }).subscribe(() => {
        this.loadQuestions(); // Nachricht anzeigen
      });
    }
  }
}
