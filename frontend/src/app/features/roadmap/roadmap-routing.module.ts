import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RoadmapViewComponent } from './components/roadmap-view/roadmap-view.component';
import { Role } from '../../features/users/models/role.model';
import { RoleGuard } from '../../core/guards/role.guard';

const routes: Routes = [
  {
    path: '',
    component: RoadmapViewComponent,
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
export class RoadmapRoutingModule { } 