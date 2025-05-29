import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { MaterialModule } from '../../material.module';
import { ReactiveFormsModule } from '@angular/forms';
import { DatabaseComponent } from './components/database.component';
import { UploadDatabaseDialogComponent } from './components/upload-database-dialog/upload-database-dialog.component';
import { CreateDatabaseDialogComponent } from './components/create-database-dialog/create-database-dialog.component';
import { EditDatabaseDialogComponent } from './components/edit-database-dialog/edit-database-dialog.component';

const routes: Routes = [
    { path: '', component: DatabaseComponent }
];

@NgModule({
    declarations: [
        DatabaseComponent,
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
