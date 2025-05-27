import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DynamicExerciseComponent } from './components/dynamic-exercise.component';
import { ExerciseResolver } from './resolvers/exercise.resolver';
import { Role } from '../users/models/role.model';
import { RoleGuard } from '../../core/guards/role.guard';

const routes: Routes = [
  {
    path: 'topics/:topicId/exercises/:exerciseId',
    component: DynamicExerciseComponent,
    resolve: { exercise: ExerciseResolver },
    canActivate: [RoleGuard],
    data: {
      allowedRoles: [Role.STUDENT, Role.TUTOR, Role.ADMIN]
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ExercisesRoutingModule { }
