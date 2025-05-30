import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { WelcomeComponent } from './welcome.component';
import { AufgabeComponent } from './aufgaben/aufgaben.component';
import { FragenComponent } from './fragen/fragen.component';
import { PapierkorbComponent } from './fragen/papierkorb/papierkorb.component';
import { ArchivComponent } from './fragen/archiv/archiv.component';

const routes: Routes = [
  { path: '', component: WelcomeComponent },          
  { path: 'aufgaben', component: AufgabeComponent },  
  { path: 'fragen', component: FragenComponent },   
  { path: 'papierkorb', component: PapierkorbComponent },
  { path: 'archiv', component: ArchivComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WelcomeRoutingModule {}
