import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'app/material.module';
import { SharedModule } from '../../shared/shared.module';
import { DatabaseRoutingModule } from './database-routing.module';
import { DatabaseListComponent } from './components/database-list/database-list.component';
import { DatabaseTableViewerComponent } from './components/database-table-viewer/database-table-viewer.component';
import { DatabaseEditDialogComponent } from './dialogs/database-edit-dialog/database-edit-dialog.component';
import { DatabaseCreateDialogComponent } from './dialogs/database-create-dialog/database-create-dialog.component';
import { DatabaseUploadDialogComponent } from './dialogs/database-upload-dialog/database-upload-dialog.component';
import { DatabaseViewDialogComponent } from './dialogs/database-view-dialog/database-view-dialog.component';
import { ConfirmDialogComponent } from './dialogs/confirm-dialog/confirm-dialog.component';
import { CreateTableDialogComponent } from './dialogs/create-table-dialog/create-table-dialog.component';
import { DataEditDialogComponent } from './dialogs/data-edit-dialog/data-edit-dialog.component';
import { EditTableDialogComponent } from './dialogs/edit-table-dialog/edit-table-dialog.component';

@NgModule({
    declarations: [
        DatabaseListComponent,
        DatabaseTableViewerComponent,
        DatabaseCreateDialogComponent,
        DatabaseEditDialogComponent,
        DatabaseUploadDialogComponent,
        DatabaseViewDialogComponent,
        ConfirmDialogComponent,
        CreateTableDialogComponent,
        DataEditDialogComponent,
        EditTableDialogComponent,
    ],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MaterialModule,
        SharedModule,
        DatabaseRoutingModule,
    ],
})
export class DatabaseModule {}
