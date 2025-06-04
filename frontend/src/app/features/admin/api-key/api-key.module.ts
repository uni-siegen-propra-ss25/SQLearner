import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'app/material.module';
import { ApiKeyDialogComponent } from './api-key-dialog.component';
import { ApiKeyPageComponent } from './api-key-page.component';
import { RouterModule, Routes } from '@angular/router';
import { RoleGuard } from 'app/core/guards/role.guard';
import { Role } from 'app/features/users/models/role.model';

const routes: Routes = [
  {
    path: '',
    component: ApiKeyPageComponent,
    canActivate: [RoleGuard],
    data: { allowedRoles: [Role.ADMIN] }
  }
];

@NgModule({
  declarations: [ApiKeyDialogComponent, ApiKeyPageComponent],
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, RouterModule.forChild(routes)],
  exports: [ApiKeyDialogComponent, ApiKeyPageComponent]
})
export class ApiKeyModule {}
