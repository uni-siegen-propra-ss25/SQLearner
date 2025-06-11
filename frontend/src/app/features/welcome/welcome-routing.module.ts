import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WelcomeTutorComponent } from './components/welcome-tutor/welcome-tutor.component';
import { WelcomeStudentComponent } from './components/welcome-student/welcome-student.component';
import { Role } from '../../features/users/models/role.model';
import { RoleGuard } from '../../core/guards/role.guard';
import { WelcomeRedirectComponent } from './components/welcome-redirect/welcome-redirect.component';
import { WelcomeComponent } from 'app/features/welcome/welcome.component';

import { QuestionComponent } from './components/welcome-tutor/questions/question.component';
import { PapierkorbComponent } from './components/welcome-tutor/questions/papierkorb/papierkorb.component';
import { ArchivComponent } from './components/welcome-tutor/questions/archiv/archiv.component';
import { BeantwortetComponent } from './components/welcome-tutor/questions/beantwortet/beantwortet.component';

import { FragenChatComponent } from './components/welcome-student/fragen-chat/fragen-chat.component';

const routes: Routes = [
  {
    path: '',
    component: WelcomeRedirectComponent,
  },
    {
    path: 'default',
    component: WelcomeComponent, 
  },
  {
    path: 'student',
    component: WelcomeStudentComponent,
    canActivate: [RoleGuard],
    data: { allowedRoles: [Role.STUDENT] }
  },
  {
    path: 'tutor',
    component: WelcomeTutorComponent,
    canActivate: [RoleGuard],
    data: { allowedRoles: [Role.TUTOR] },
  },
  {
    path: 'tutor/questions',
    component: QuestionComponent,
    canActivate: [RoleGuard],
    data: { allowedRoles: [Role.TUTOR] },
  },
  {
    path: 'tutor/papierkorb',
    component: PapierkorbComponent,
    canActivate: [RoleGuard],
    data: { allowedRoles: [Role.TUTOR] },
  },
  {
    path: 'tutor/archiv',
    component: ArchivComponent,
    canActivate: [RoleGuard],
    data: { allowedRoles: [Role.TUTOR] },
  },
  {
    path: 'tutor/beantwortet',
    component: BeantwortetComponent,
    canActivate: [RoleGuard],
    data: { allowedRoles: [Role.TUTOR] },
  },
  {
  path: 'student/questions',
  component: FragenChatComponent,  
  canActivate: [RoleGuard],
  data: { allowedRoles: [Role.STUDENT] },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WelcomeRoutingModule {}
