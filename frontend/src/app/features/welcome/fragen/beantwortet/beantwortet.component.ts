import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-beantwortet',
  templateUrl: './beantwortet.component.html',
  styleUrls: ['./beantwortet.component.scss']
})
export class BeantwortetComponent implements OnInit {
  beantworteteFragen: any[] = [];

  ngOnInit(): void {
    this.ladeBeantworteteFragen();
  }

  ladeBeantworteteFragen(): void {
    const gespeicherte = localStorage.getItem('beantworteteFragen');
    this.beantworteteFragen = gespeicherte ? JSON.parse(gespeicherte) : [];
  }

  insArchivVerschieben(eintrag: any): void {
    const archiv = JSON.parse(localStorage.getItem('archivFragen') || '[]');

    if (!archiv.find((f: any) => f.frageId === eintrag.frageId)) {
      archiv.push(eintrag);
      localStorage.setItem('archivFragen', JSON.stringify(archiv));
    }

    this.entfernen(eintrag);
  }

  inPapierkorbVerschieben(eintrag: any): void {
    const papierkorb = JSON.parse(localStorage.getItem('papierkorbFragen') || '[]');

    if (!papierkorb.find((f: any) => f.frageId === eintrag.frageId)) {
      papierkorb.push(eintrag);
      localStorage.setItem('papierkorbFragen', JSON.stringify(papierkorb));
    }

    this.entfernen(eintrag);
  }

  markieren(eintrag: any): void {
    const markierte = JSON.parse(localStorage.getItem('angepinnt') || '[]');

    if (!markierte.find((f: any) => f.frageId === eintrag.frageId)) {
      markierte.push(eintrag);
      localStorage.setItem('angepinnt', JSON.stringify(markierte));
    }

    this.entfernen(eintrag);
  }

  private entfernen(eintrag: any): void {
    this.beantworteteFragen = this.beantworteteFragen.filter(e => e.frageId !== eintrag.frageId);
    localStorage.setItem('beantworteteFragen', JSON.stringify(this.beantworteteFragen));
  }
}
