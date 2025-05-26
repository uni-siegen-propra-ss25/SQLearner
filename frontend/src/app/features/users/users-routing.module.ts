import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from 'app/features/users/tutor/dashboard/dashboard.component.';
import { AufgabeComponent } from './tutor/aufgaben/aufgaben.component';
import { FortschrittComponent } from './tutor/fortschritt/fortschritt.component';
import { FragenComponent } from './tutor/fragen/fragen.component';
import { ProfilComponent } from './tutor/profil/profil.component';
import { KursmitgliederComponent } from './tutor/profil/kursmitglieder/kursmitglieder.component';

const routes: Routes = [
  { path: 'dashboard', component: DashboardComponent },
  { path: 'aufgaben', component: AufgabeComponent },
  { path: 'fortschritt', component: FortschrittComponent },
  { path: 'fragen', component: FragenComponent },
  { path: 'profil', component: ProfilComponent },
  { path: 'kursmitglieder', component: KursmitgliederComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UsersRoutingModule {}
