import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-fragen',
  templateUrl: './fragen.component.html',
  styleUrls: ['./fragen.component.scss'],
})
export class FragenComponent implements OnInit {
  fragen = [
    {
      id: 1,
      student: 'Max M.',
      datum: '30.05.2025',
      uhrzeit: '12:17:53',
      frageText: 'Ich verstehe NATURAL JOIN nicht ganz...',
    },
    {
      id: 2,
      student: 'Lisa S.',
      datum: '29.05.2025',
      uhrzeit: '10:05:12',
      frageText: 'Könnte man ein Beispiel zu Aggregatfunktionen machen?',
    },
    {
      id: 3,
      student: 'Jonas T.',
      datum: '28.05.2025',
      uhrzeit: '15:45:33',
      frageText: 'Wie genau funktioniert Relationale Division?',
    },
  ];

  angepinnt: any[] = [];
  ausgewaehlteFrage: any = null;
  antwortText: string = '';
  anhangName: string = '';

  get ungeleseneNachrichten(): number {
    return this.fragen.length;
  }

  ngOnInit() {
    this.ladeAngepinnt();
  }

  ladeAngepinnt() {
    const gespeicherte = localStorage.getItem('angeheftet');
    this.angepinnt = gespeicherte ? JSON.parse(gespeicherte) : [];
  }

  speichern() {
    localStorage.setItem('angeheftet', JSON.stringify(this.angepinnt));
  }

  beantworten(frage: any, event: Event) {
    event.preventDefault();
    this.ausgewaehlteFrage = frage;
    this.antwortText = '';
    this.anhangName = '';
  }

  antwortAbbrechen() {
    this.ausgewaehlteFrage = null;
    this.antwortText = '';
    this.anhangName = '';
  }

  anhangHinzufuegen(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.anhangName = file.name;
    }
  }

  antwortAbschicken() {
    if (!this.ausgewaehlteFrage) return;

    const antwort = {
      frageId: this.ausgewaehlteFrage.id,
      frageText: this.ausgewaehlteFrage.frageText,
      student: this.ausgewaehlteFrage.student,
      antwort: this.antwortText,
      datei: this.anhangName,
      uhrzeit: new Date().toLocaleTimeString(),
      datum: new Date().toLocaleDateString(),
    };

    const beantwortet = JSON.parse(localStorage.getItem('beantworteteFragen') || '[]');
    const index = beantwortet.findIndex((a: any) => a.frageId === antwort.frageId);

    if (index === -1) {
      beantwortet.push(antwort);
    } else {
      beantwortet[index] = antwort;
    }

    localStorage.setItem('beantworteteFragen', JSON.stringify(beantwortet));
    this.fragen = this.fragen.filter((f) => f.id !== this.ausgewaehlteFrage.id);
    this.antwortAbbrechen();
  }

  anpinnen(frage: any, event: Event) {
    event.preventDefault();

    if (!this.angepinnt.find((f) => f.id === frage.id)) {
      this.angepinnt.push(frage);
      this.speichern();
    }

    this.fragen = this.fragen.filter((f) => f.id !== frage.id);
  }

  archivieren(frage: any, event: Event) {
    event.preventDefault();

    const beantwortet = JSON.parse(localStorage.getItem('beantworteteFragen') || '[]');
    const archiv = JSON.parse(localStorage.getItem('archivFragen') || '[]');
    const gespeicherteAntwort = beantwortet.find((f: any) => f.frageId === frage.id);

    if (gespeicherteAntwort) {
      if (!archiv.find((f: any) => f.frageId === frage.id)) {
        archiv.push(gespeicherteAntwort);
      }
    } else {
      const neueFrage = {
        frageId: frage.id,
        frageText: frage.frageText,
        student: frage.student,
        antwort: '',
        datum: frage.datum,
        uhrzeit: frage.uhrzeit,
      };
      archiv.push(neueFrage);
    }

    localStorage.setItem('archivFragen', JSON.stringify(archiv));
    this.fragen = this.fragen.filter((f) => f.id !== frage.id);
  }

  loeschen(frage: any, event: Event) {
    event.preventDefault();

    const papierkorb = JSON.parse(localStorage.getItem('papierkorbFragen') || '[]');

    const geloeschteFrage = {
      frageId: frage.id,
      frageText: frage.frageText,
      student: frage.student,
      antwort: '',
      datum: frage.datum,
      uhrzeit: frage.uhrzeit,
    };

    papierkorb.push(geloeschteFrage);
    localStorage.setItem('papierkorbFragen', JSON.stringify(papierkorb));

    this.fragen = this.fragen.filter((f) => f.id !== frage.id);
  }

  entferneAngepinnt(frage: any, event: Event) {
    event.preventDefault();
    this.angepinnt = this.angepinnt.filter((f) => f.id !== frage.id);
    this.speichern();
  }
}

