import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HinweisService } from 'app/features/welcome/services/hinweis.service'; 

@Component({
  selector: 'app-welcome-tutor',
  templateUrl: './welcome-tutor.component.html',
  styleUrls: ['./welcome-tutor.component.scss'],
})
export class WelcomeTutorComponent implements OnInit {
  newHinweis: string = '';
  hinweise: string[] = [];

  fragen = [
    { name: 'Max M.', datum: '12.05', text: 'Könnte man ein Beispiel zu Aggregatfunktionen machen?' },
    { name: 'Lisa S.', datum: '11.05', text: 'Ist der NATURAL JOIN prüfungsrelevant?' },
    { name: 'Jonas T.', datum: '10.05', text: 'Wie genau funktioniert Relationale Division?' },
  ];

  displayedColumns: string[] = ['titel', 'typ', 'kategorie', 'datum'];
  aufgaben = [
    { titel: 'GartenCenter', typ: 'SQL-Abfrage', kategorie: 'SQL', datum: '2025-05-01' },
    { titel: 'XML Basics', typ: 'Einzel-Abfrage ', kategorie: 'XML', datum: '2025-05-05' },
    { titel: 'KinoBesuch', typ: 'SQL-Abfrage', kategorie: 'SQL', datum: '2025-05-10' },
  ];

  constructor(private router: Router, private hinweisService: HinweisService) {}

  ngOnInit() {
    this.hinweise = this.hinweisService.getHinweise();
  }

  addHinweis() {
    if (this.newHinweis.trim()) {
      this.hinweisService.addHinweis(this.newHinweis.trim());
      this.newHinweis = '';
      this.hinweise = this.hinweisService.getHinweise(); // Aktualisiere lokale Liste
    }
  }

  removeHinweis(index: number) {
    this.hinweisService.removeHinweis(index);
    this.hinweise = this.hinweisService.getHinweise(); // Aktualisiere lokale Liste
  }

  goToAufgaben() {
    this.router.navigate(['welcome/tutor/aufgaben']);
  }

  goToFragen() {
    this.router.navigate(['welcome/tutor/fragen']);
  }
}
