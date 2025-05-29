import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-fragen',
  templateUrl: './fragen.component.html',
  styleUrls: ['./fragen.component.scss']
})
export class FragenComponent implements OnInit {
  fragen = [
    { name: 'Max M.', datum: '12.05', text: 'Ich verstehe NATURAL JOIN nicht ganz...' },
    { name: 'Lisa S.', datum: '11.05', text: 'Könnte man ein Beispiel zu Aggregatfunktionen machen?' },
    { name: 'Jonas T.', datum: '10.05', text: 'Wie genau funktioniert Relationale Division?' }
  ];

  angepinnt: any[] = [];

  get ungeleseneNachrichten(): number {
    return this.fragen.length;
  }

  ngOnInit() {
    this.ladeAngepinnt();
  }

  beantworten(frage: any, event: Event) {
    event.preventDefault();
    console.log('Beantworte:', frage);
    // Option: grün entfernen
  }

  anpinnen(frage: any, event: Event) {
    event.preventDefault();
    this.angepinnt.push(frage);
    this.fragen = this.fragen.filter(f => f !== frage);
    this.speichern();
  }

  archivieren(frage: any, event: Event) {
  event.preventDefault();
  const archiv = JSON.parse(localStorage.getItem('archivFragen') || '[]');
  archiv.push(frage);
  localStorage.setItem('archivFragen', JSON.stringify(archiv));
  this.fragen = this.fragen.filter(f => f !== frage);
}


  loeschen(frage: any, event: Event): void {
  event.preventDefault();

  // In den Papierkorb verschieben
  const papierkorb = JSON.parse(localStorage.getItem('papierkorbFragen') || '[]');
  papierkorb.push(frage);
  localStorage.setItem('papierkorbFragen', JSON.stringify(papierkorb));

  // Aus der Liste "fragen" entfernen
  this.fragen = this.fragen.filter(f => f !== frage);
}


  entferneAngepinnt(frage: any, event: Event) {
    event.preventDefault();
    this.angepinnt = this.angepinnt.filter(f => f !== frage);
    this.speichern();
  }

  speichern() {
    // Optional: lokale Speicherung
    localStorage.setItem('angepinnt', JSON.stringify(this.angepinnt));
  }

  ladeAngepinnt() {
    const gespeicherte = localStorage.getItem('angepinnt');
    if (gespeicherte) {
      this.angepinnt = JSON.parse(gespeicherte);
    }
  }
}

