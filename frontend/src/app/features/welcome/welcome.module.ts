import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { WelcomeComponent } from './welcome.component';
import { MaterialModule } from 'app/material.module';

@NgModule({
    declarations: [WelcomeComponent],
    imports: [
        CommonModule,
        FormsModule,
        MaterialModule
    ],
})
export class WelcomeModule {}
