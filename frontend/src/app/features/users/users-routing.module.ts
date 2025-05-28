import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from 'app/features/users/tutor/dashboard/dashboard.component.';
import { FragenComponent } from './tutor/fragen/fragen.component';
import { ProfilComponent } from './tutor/profil/profil.component';
import { UserListComponent } from './components/user-list/user-list.component';
import { RoleGuard } from '../../core/guards/role.guard';
import { Role } from './models/role.model';

const routes: Routes = [
  { path: '', redirectTo: 'list', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'fragen', component: FragenComponent },
  { path: 'profil', component: ProfilComponent },
  { 
    path: 'list', 
    component: UserListComponent,
    canActivate: [RoleGuard],
    data: { allowedRoles: [Role.TUTOR, Role.ADMIN] }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UsersRoutingModule {}
