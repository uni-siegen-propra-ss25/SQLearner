import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LandingRoutingModule } from './landing-routing.module';
import { MaterialModule } from 'app/material.module';
import { FormsModule } from '@angular/forms';
import { WelcomeComponent } from 'app/features/landing/components/welcome/welcome.component';
import { HttpClientModule } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
    declarations: [
        WelcomeComponent,
    ],
    imports: [
        CommonModule,
        RouterModule,
        LandingRoutingModule,
        FormsModule,
        MaterialModule,
        HttpClientModule,
        TranslateModule,
        SharedModule,
    ],
})
export class LandingModule {}
