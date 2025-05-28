import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Role } from '../../models/role.model';
import { RoleGuard } from '../../../../core/guards/role.guard';
import { MatFormField, MatInput, MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';
import { MatOption, MatOptionModule } from '@angular/material/core';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';


@Component({
  standalone: true,
  imports: [
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatToolbarModule
  ],
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
