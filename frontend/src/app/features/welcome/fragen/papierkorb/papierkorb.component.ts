import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-papierkorb',
  templateUrl: './papierkorb.component.html',
  styleUrls: ['./papierkorb.component.scss']
})
export class PapierkorbComponent implements OnInit {
  fragen: any[] = [];

  ngOnInit(): void {
    const gespeicherte = localStorage.getItem('papierkorbFragen');
    this.fragen = gespeicherte ? JSON.parse(gespeicherte) : [];
  }

  wiederherstellen(frage: any): void {
    // Wieder in die Fragen-Liste einfügen (optional, z. B. über localStorage 'fragen')
    const fragen = JSON.parse(localStorage.getItem('fragen') || '[]');
    fragen.push(frage);
    localStorage.setItem('fragen', JSON.stringify(fragen));

    this.entferneAusPapierkorb(frage);
  }

  endgueltigLoeschen(frage: any): void {
    if (confirm('Diese Frage endgültig löschen?')) {
      this.entferneAusPapierkorb(frage);
    }
  }

  private entferneAusPapierkorb(frage: any): void {
    this.fragen = this.fragen.filter(f => f !== frage);
    localStorage.setItem('papierkorbFragen', JSON.stringify(this.fragen));
  }
}

