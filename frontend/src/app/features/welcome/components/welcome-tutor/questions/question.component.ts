import { Component, OnInit } from '@angular/core';
import { QuestionService } from 'app/features/welcome/services/question.service';

// Component decorator with selector, template and style files
@Component({
  selector: 'app-questions',
  templateUrl: './question.component.html',
  styleUrls: ['./question.component.scss'],
})
export class QuestionComponent implements OnInit {
  // Variables for storing questions
  questions: any[] = [];            // All questions that are not archived or deleted
  angepinnt: any[] = [];            // Pinned (marked) questions
  ausgewaehlteQuestion: any = null; // Currently selected question for answering
  antwortText: string = '';         // Text entered as answer in the modal/dialog
  anhangName: string = '';          // Name of the attached file

  // Dynamically calculates the number of unread questions
  get ungeleseneNachrichten(): number {
    return this.questions.length;
  }

  constructor(private questionService: QuestionService) {}

  // On component initialization, load and sort all questions
ngOnInit() {
  this.questionService.getAll().subscribe((data) => {
    const ungefiltert = data.filter(q =>
      !q.ist_archiviert &&
      !q.ist_geloescht &&
      !q.ist_beantwortet
    );
    this.angepinnt = ungefiltert.filter(q => q.ist_angepinnt);
    this.questions = ungefiltert.filter(q => !q.ist_angepinnt);
  });
}


  // Select a question to answer
  beantworten(frage: any, event: Event) {
    event.preventDefault();
    this.ausgewaehlteQuestion = frage;
    this.antwortText = '';
    this.anhangName = '';
  }

  // Cancel the answering process
  antwortAbbrechen() {
    this.ausgewaehlteQuestion = null;
    this.antwortText = '';
    this.anhangName = '';
  }

  // Add an attachment file
  anhangHinzufuegen(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.anhangName = file.name;
    }
  }

  // Submit the answer and remove the question from the list
antwortAbschicken() {
  if (!this.ausgewaehlteQuestion) return;

  this.questionService.antworten(this.ausgewaehlteQuestion.id, this.antwortText).subscribe(() => {
    this.questions = this.questions.filter((f) => f.id !== this.ausgewaehlteQuestion.id);
    this.angepinnt = this.angepinnt.filter((f) => f.id !== this.ausgewaehlteQuestion.id);
    
    this.antwortAbbrechen();
  });
}


  // Pin (mark) a question
  anpinnen(frage: any, event: Event) {
    event.preventDefault();

    if (!this.angepinnt.find((f) => f.id === frage.id)) {
      this.questionService.pin(frage.id, true).subscribe(() => {
        // Add question to pinned list
        this.angepinnt.push(frage);
        // Remove question from normal questions list
        this.questions = this.questions.filter((f) => f.id !== frage.id);
      });
    }
  }

  // Archive a question
  archivieren(frage: any, event: Event) {
    event.preventDefault();
    this.questionService.archivieren(frage.id, true).subscribe(() => {
      // Remove archived question from current list
      this.questions = this.questions.filter((f) => f.id !== frage.id);
    });
  }

  // Delete a question (soft delete - mark as deleted)
  loeschen(frage: any, event: Event) {
    event.preventDefault();
    this.questionService.löschen(frage.id).subscribe(() => {
      // Log the deletion for confirmation
      console.log(`Question ${frage.id} was moved to trash.`);

      // Remove question from the current list
      this.questions = this.questions.filter((f) => f.id !== frage.id);

      // Also remove from pinned list if it was pinned
      this.angepinnt = this.angepinnt.filter((f) => f.id !== frage.id);
    });
  }

  // Unpin a previously pinned question
  entferneAngepinnt(frage: any, event: Event) {
    event.preventDefault();
    this.questionService.pin(frage.id, false).subscribe(() => {
      // Remove question from pinned list
      this.angepinnt = this.angepinnt.filter((f) => f.id !== frage.id);
    });
  }
}
