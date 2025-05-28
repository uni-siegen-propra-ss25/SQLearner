import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss']
})
export class WelcomeComponent {
  newHinweis: string = '';
  hinweise: string[] = [];

  constructor(private router: Router, private route: ActivatedRoute) {}

  goToAufgaben() {
    this.router.navigate(['aufgaben'], { relativeTo: this.route });
  }

  goToFragen() {
    this.router.navigate(['fragen'], { relativeTo: this.route });
  }

  addHinweis() {
    if (this.newHinweis.trim()) {
      this.hinweise.push(this.newHinweis.trim());
      this.newHinweis = '';
    }
  }

  removeHinweis(index: number) {
    this.hinweise.splice(index, 1);
  }
}


