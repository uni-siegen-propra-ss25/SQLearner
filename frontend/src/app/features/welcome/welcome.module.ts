import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // <-- Hier importieren

import { WelcomeRoutingModule } from './welcome-routing.module';
import { WelcomeComponent } from './welcome.component';
import { AufgabeComponent } from './aufgaben/aufgaben.component';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input'; // falls du ein <input> verwendest

@NgModule({
    declarations: [WelcomeComponent, AufgabeComponent],
    imports: [
        CommonModule,
        FormsModule, // <-- Hier hinzufügen
        WelcomeRoutingModule,
        CommonModule,
        MatCardModule,
        MatFormFieldModule,
        MatSelectModule,
        MatOptionModule,
        MatIconModule,
        MatInputModule,
    ],
})
export class WelcomeModule {}
