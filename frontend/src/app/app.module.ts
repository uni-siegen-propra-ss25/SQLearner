import { NgModule } from '@angular/core';
import { BrowserModule, DomSanitizer } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { JwtInterceptor } from './core/interceptors/jwt.interceptor';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MaterialModule } from './material.module';
import { SharedModule } from './shared/shared.module';
import { MatIconRegistry } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { RoadmapModule } from './features/roadmap/roadmap.module';
import { ExercisesModule } from './features/exercises/exercises.module';
import { ChatModule } from './features/chat/chat.module';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@NgModule({
    declarations: [AppComponent],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        MaterialModule,
        SharedModule,
        AppRoutingModule,
        ReactiveFormsModule,
        HttpClientModule,
        RouterModule,
        DragDropModule,
        RoadmapModule,
        ExercisesModule,
        ChatModule,
        FormsModule,
        CommonModule,
    ],
    providers: [
        { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
        provideAnimationsAsync(),
    ],
    bootstrap: [AppComponent],
})
export class AppModule {
    constructor(
        private iconRegistry: MatIconRegistry,
        private sanitizer: DomSanitizer,
    ) {
        this.iconRegistry.addSvgIcon(
            'logo_SQLearner',
            this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/logo_SQLearner.svg'),
        );
    }
}
