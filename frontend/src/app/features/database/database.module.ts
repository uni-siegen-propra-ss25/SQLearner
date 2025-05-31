import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { MaterialModule } from '../../material.module';
import { ReactiveFormsModule } from '@angular/forms';
import { DatabaseListComponent } from './components/database-list/database-list.component';
import { DatabaseCreateDialogComponent } from './dialogs/database-create-dialog/database-create-dialog.component';
import { DatabaseEditDialogComponent } from './dialogs/database-edit-dialog/database-edit-dialog.component';
import { DatabaseUploadDialogComponent } from './dialogs/database-upload-dialog/database-upload-dialog.component';

const routes: Routes = [{ path: '', component: DatabaseListComponent }];

@NgModule({
    declarations: [
        DatabaseListComponent,
        DatabaseCreateDialogComponent,
        DatabaseEditDialogComponent,
        DatabaseUploadDialogComponent,
    ],
    imports: [CommonModule, MaterialModule, ReactiveFormsModule, RouterModule.forChild(routes)],
})
export class DatabaseModule {}
