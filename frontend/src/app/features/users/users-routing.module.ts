import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserListComponent } from './components/user-list/user-list.component';
import { RoleGuard } from '../../core/guards/role.guard';
import { Role } from './models/role.model';

const routes: Routes = [
  { path: '', redirectTo: 'list', pathMatch: 'full' },
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
