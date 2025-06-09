import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-fragen',
  templateUrl: './fragen.component.html',
  styleUrls: ['./fragen.component.scss'],
})
export class FragenComponent implements OnInit {
  fragen: any[] = []; // Keine Testdaten mehr
  angepinnt: any[] = [];
  ausgewaehlteFrage: any = null;
  antwortText: string = '';
  anhangName: string = '';

  get ungeleseneNachrichten(): number {
    return this.fragen.length;
  }

  ngOnInit() {
    // Hier später: HTTP-Call zum Laden der Fragen
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

    // Hier später: HTTP-POST zum Speichern der Antwort
    this.fragen = this.fragen.filter((f) => f.id !== this.ausgewaehlteFrage.id);
    this.antwortAbbrechen();
  }

  anpinnen(frage: any, event: Event) {
    event.preventDefault();

    if (!this.angepinnt.find((f) => f.id === frage.id)) {
      this.angepinnt.push(frage);
      // Hier später: optional DB-Speicherung der Markierung
    }

    this.fragen = this.fragen.filter((f) => f.id !== frage.id);
  }

  archivieren(frage: any, event: Event) {
    event.preventDefault();
    // Hier später: HTTP-Call zum Archivieren
    this.fragen = this.fragen.filter((f) => f.id !== frage.id);
  }

  loeschen(frage: any, event: Event) {
    event.preventDefault();
    // Hier später: HTTP-Call zum Löschen / in Papierkorb verschieben
    this.fragen = this.fragen.filter((f) => f.id !== frage.id);
  }

  entferneAngepinnt(frage: any, event: Event) {
    event.preventDefault();
    this.angepinnt = this.angepinnt.filter((f) => f.id !== frage.id);
    // Hier später: optional DB-Aktualisierung
  }
}

