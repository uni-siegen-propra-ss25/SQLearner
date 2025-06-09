import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WelcomeRoutingModule } from './welcome-routing.module';
import { WelcomeTutorComponent } from './components/welcome-tutor/welcome-tutor.component';
import { WelcomeStudentComponent } from './components/welcome-student/welcome-student.component';
import { WelcomeRedirectComponent } from './components/welcome-redirect/welcome-redirect.component';
import { MaterialModule } from 'app/material.module'; 
import { FormsModule } from '@angular/forms'; 
import { WelcomeComponent } from 'app/features/welcome/welcome.component';
import { HttpClientModule } from '@angular/common/http';

import { QuestionComponent } from 'app/features/welcome/components/welcome-tutor/questions/question.component';
import { PapierkorbComponent } from './components/welcome-tutor/questions/papierkorb/papierkorb.component';
import { ArchivComponent } from './components/welcome-tutor/questions/archiv/archiv.component';
import { BeantwortetComponent } from './components/welcome-tutor/questions/beantwortet/beantwortet.component';

import { FragenChatComponent } from './components/welcome-student/fragen-chat/fragen-chat.component';

@NgModule({
  declarations: [
    WelcomeTutorComponent,
    WelcomeStudentComponent,
    WelcomeRedirectComponent,
    WelcomeComponent,
    QuestionComponent,   
    PapierkorbComponent,
    ArchivComponent,
    BeantwortetComponent,
    FragenChatComponent,
  ],
  imports: [
    CommonModule,
    WelcomeRoutingModule,
    FormsModule,
    MaterialModule,
    HttpClientModule,
  ],
})
export class WelcomeModule {}