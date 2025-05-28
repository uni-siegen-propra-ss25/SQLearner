import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersRoutingModule } from './users-routing.module';
import { DashboardComponent } from 'app/features/users/tutor/dashboard/dashboard.component.';
import { AufgabeComponent } from '../welcome/aufgaben/aufgaben.component';
import { FortschrittComponent } from './tutor/fortschritt/fortschritt.component';
import { FragenComponent } from '../welcome/fragen/fragen.component';
import { ProfilComponent } from '../profil/profil.component';
import { KursmitgliederComponent } from '../profil/kursmitglieder/kursmitglieder.component';

@NgModule({
  declarations: [
    DashboardComponent,
    AufgabeComponent,
    FortschrittComponent,
    FragenComponent,
    ProfilComponent,
    KursmitgliederComponent
  ],
  imports: [
    CommonModule,
    UsersRoutingModule
  ]
})
export class UsersModule {}
