import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-aufgaben',
  templateUrl: './aufgaben.component.html',
  styleUrls: ['./aufgaben.component.scss']
})
export class AufgabeComponent {
  titel = '';
  kategorie = '';
  typ = '';
  schwierigkeit = '';
  beschreibung = '';
  notiz = '';
  selectedFile: File | null = null;

  hochgeladeneAufgabe: any = null;

  options = [
    { text: '', correct: false },
    { text: '', correct: false },
    { text: '', correct: false },
    { text: '', correct: false },
    { text: '', correct: false }
  ];

  constructor(private http: HttpClient) {}

  onTypChange() {
    if (this.typ === 'Single Choice' || this.typ === 'Multiple Choice') {
      this.options = [
        { text: '', correct: false },
        { text: '', correct: false },
        { text: '', correct: false },
        { text: '', correct: false },
        { text: '', correct: false }
      ];
      this.beschreibung = '';
    } else {
      this.options = [];
    }
  }

  onFileDropped(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  hochladen() {
    if (!this.titel || !this.kategorie || !this.typ || !this.schwierigkeit) {
      alert('Bitte alle Pflichtfelder ausfüllen.');
      return;
    }

    if ((this.typ === 'SQL Query' && !this.beschreibung.trim()) ||
        ((this.typ === 'Single Choice' || this.typ === 'Multiple Choice') &&
         this.options.every(opt => !opt.text.trim()))) {
      alert('Bitte die Aufgabenstellung oder Optionen ausfüllen.');
      return;
    }

    const formData = new FormData();
    formData.append('titel', this.titel);
    formData.append('kategorie', this.kategorie);
    formData.append('typ', this.typ);
    formData.append('schwierigkeit', this.schwierigkeit);
    formData.append('beschreibung', this.beschreibung);
    formData.append('notiz', this.notiz || '');

    if (this.typ === 'Single Choice' || this.typ === 'Multiple Choice') {
      formData.append('options', JSON.stringify(this.options));
    }

    if (this.selectedFile) {
      formData.append('file', this.selectedFile, this.selectedFile.name);
    }

    this.http.post<any>('http://localhost:3000/aufgaben', formData).subscribe({
      next: (res) => {
        alert('Aufgabe erfolgreich hochgeladen!');
        this.hochgeladeneAufgabe = {
          titel: this.titel,
          kategorie: this.kategorie,
          typ: this.typ,
          schwierigkeit: this.schwierigkeit,
          beschreibung: this.beschreibung,
          notiz: this.notiz,
          options: this.options,
          dateiName: this.selectedFile?.name,
          dateiUrl: res.fileUrl
        };

        this.titel = '';
        this.kategorie = '';
        this.typ = '';
        this.schwierigkeit = '';
        this.beschreibung = '';
        this.notiz = '';
        this.options = [];
        this.selectedFile = null;
      },
      error: (err) => {
        console.error(err);
        alert('Fehler beim Hochladen');
      }
    });
  }
}
