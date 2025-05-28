import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
  newHinweis: string = '';
  hinweise: string[] = [];
  

  constructor(private router: Router) {}

addHinweis() {
  try {
    if (!this.newHinweis?.trim()) return;
    this.hinweise.push(this.newHinweis);
    this.newHinweis = '';
  } catch (e) {
    console.error('Fehler beim Hinzufügen des Hinweises:', e);
  }
}


  removeHinweis(index: number) {
    this.hinweise.splice(index, 1);
  }

  goToFragen() {
    this.router.navigate(['/fragen']);
  }

  goToAufgaben() {
    this.router.navigate(['/aufgaben']);
  }
}
