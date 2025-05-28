import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { WelcomeComponent } from './welcome.component';
import { AufgabeComponent } from './aufgaben/aufgaben.component';

const routes: Routes = [
  { path: '', component: WelcomeComponent },          
  { path: 'aufgaben', component: AufgabeComponent }   
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WelcomeRoutingModule {}
