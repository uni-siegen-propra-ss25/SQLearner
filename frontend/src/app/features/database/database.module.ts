import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { MaterialModule } from '../../material.module';
import { ReactiveFormsModule } from '@angular/forms';
import { DatabaseListComponent } from './components/database-list/database-list.component';
import { CreateDatabaseDialogComponent } from './dialogs/create-database-dialog/create-database-dialog.component';
import { EditDatabaseDialogComponent } from './dialogs/edit-database-dialog/edit-database-dialog.component';
import { UploadDatabaseDialogComponent } from './dialogs/upload-database-dialog/upload-database-dialog.component';

const routes: Routes = [
    { path: '', component: DatabaseListComponent }
];

@NgModule({
    declarations: [
        DatabaseListComponent,
        UploadDatabaseDialogComponent,
        CreateDatabaseDialogComponent,
        EditDatabaseDialogComponent
    ],
    imports: [
        CommonModule,
        MaterialModule,
        ReactiveFormsModule,
        RouterModule.forChild(routes)
    ]
})
export class DatabaseModule { }
