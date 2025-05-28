import { Component } from '@angular/core';

@Component({
  selector: 'app-profil',
  templateUrl: './profil.component.html',
  styleUrls: ['./profil.component.scss']
})
export class ProfilComponent {
  // Profilfelder
  
  name: string = 'Max Mustermann';
  title: string = 'Dr. Prof.';
  fach: string = 'Informatik';
  fakultaet: string = 'Fakultät 4';
  email: string = 'maxmustermann@...';
  password: string = '*****';

  // Sichtbarkeit
  settingsVisible: boolean = false;
  editMode: boolean = false;

  toggleSettings(): void {
    this.settingsVisible = !this.settingsVisible;
  }

  toggleEdit(): void {
    this.editMode = !this.editMode;
  }

  saveProfile(): void {
    this.editMode = false;
  }
}
