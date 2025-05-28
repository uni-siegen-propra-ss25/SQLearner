import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';  // <-- hier importieren
import { AufgabeComponent } from './aufgaben/aufgaben.component';
import { WelcomeComponent } from './welcome.component';
import { MaterialModule } from 'app/material.module';
import { WelcomeRoutingModule } from './welcome-routing.module';

@NgModule({
  declarations: [
    WelcomeComponent,
    AufgabeComponent  // <-- sicherstellen, dass die Komponente hier drin ist
  ],
  imports: [
    CommonModule,
    FormsModule,  // <-- hier sicher einfügen!
    MaterialModule,
    WelcomeRoutingModule,
  ],
})
export class WelcomeModule {}
