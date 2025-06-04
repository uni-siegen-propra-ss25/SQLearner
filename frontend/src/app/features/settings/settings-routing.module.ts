import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RoleGuard } from 'app/core/guards/role.guard';
import { Role } from 'app/features/users/models/role.model';
import { SettingsPageComponent } from './components/settings-page.component';

const routes: Routes = [
  {
    path: '',
    component: SettingsPageComponent,
    canActivate: [RoleGuard],
    data: { allowedRoles: [Role.ADMIN] }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SettingsRoutingModule {}
