import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'app/material.module';
import { DatabaseListComponent } from './components/database-list/database-list.component';
import { DatabaseTableViewerComponent } from './components/database-table-viewer/database-table-viewer.component';
import { DatabaseEditDialogComponent } from './dialogs/database-edit-dialog/database-edit-dialog.component';
import { DatabaseCreateDialogComponent } from './dialogs/database-create-dialog/database-create-dialog.component';

@NgModule({
    declarations: [
        DatabaseListComponent,
        DatabaseCreateDialogComponent,
        DatabaseEditDialogComponent,
    ],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MaterialModule
    ]
})
export class DatabaseModule { }
