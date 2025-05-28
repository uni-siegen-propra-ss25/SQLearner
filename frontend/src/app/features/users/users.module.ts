import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersRoutingModule } from './users-routing.module';
import { DashboardComponent } from 'app/features/users/tutor/dashboard/dashboard.component.';
import { FragenComponent } from './tutor/fragen/fragen.component';
import { ProfilComponent } from './tutor/profil/profil.component';
import { KursmitgliederComponent } from './tutor/profil/kursmitglieder/kursmitglieder.component';
import { MaterialModule } from 'app/material.module';

@NgModule({
  declarations: [
    DashboardComponent,
    FragenComponent,
    ProfilComponent,
    KursmitgliederComponent,
    ProfilComponent,
    KursmitgliederComponent
  ],
  imports: [
    CommonModule,
    UsersRoutingModule,
    MaterialModule
  ]
})
export class UsersModule {}
