import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AufgabeComponent } from './aufgaben/aufgaben.component';
import { WelcomeComponent } from './welcome.component';
import { MaterialModule } from 'app/material.module';
import { WelcomeRoutingModule } from './welcome-routing.module';
import { FragenComponent } from './fragen/fragen.component';
import { PapierkorbComponent } from './fragen/papierkorb/papierkorb.component';
import { ArchivComponent } from './fragen/archiv/archiv.component';
import { BeantwortetComponent } from './fragen/beantwortet/beantwortet.component';

@NgModule({
    declarations: [
        WelcomeComponent,
        AufgabeComponent,
        FragenComponent,
        PapierkorbComponent,
        ArchivComponent,
        BeantwortetComponent,
    ],
    imports: [CommonModule, FormsModule, MaterialModule, WelcomeRoutingModule],
})
export class WelcomeModule {}
