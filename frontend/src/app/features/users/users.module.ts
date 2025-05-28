import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersRoutingModule } from './users-routing.module';
import { MaterialModule } from 'app/material.module';
import { ReactiveFormsModule } from '@angular/forms';
import { UserCreateDialogComponent } from './dialogs/user-create-dialog/user-create-dialog.component';
import { UserUpdateDialogComponent } from './dialogs/user-update-dialog/user-update-dialog.component';
import { UserListComponent } from './components/user-list/user-list.component';
import { ProfileComponent } from './components/profile/profile.component';

@NgModule({
    declarations: [
        UserCreateDialogComponent,
        UserUpdateDialogComponent,
        UserListComponent,
        ProfileComponent,
    ],
    imports: [CommonModule, UsersRoutingModule, MaterialModule, ReactiveFormsModule],
    exports: [ProfileComponent],
})
export class UsersModule {}
