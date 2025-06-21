import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatabasesRoutingModule } from './database-routing.module';
import { MaterialModule } from 'app/material.module';
import { DatabaseListComponent } from './components/database-list/database-list.component';
import { DatabaseDetailComponent } from '../databases/components/database-detail/database-detail.component';
import { ErDiagramComponent } from '../databases/components/er-diagram/er-diagram.component';
import { DatabaseTableViewerComponent } from './components/database-table-viewer/database-table-viewer.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DatabaseEditDialogComponent } from './dialogs/database-edit-dialog/database-edit-dialog.component';
import { DatabaseCreateDialogComponent } from './dialogs/database-create-dialog/database-create-dialog.component';
import { DatabaseUploadDialogComponent } from './dialogs/database-upload-dialog/database-upload-dialog.component';
import { ConfirmDialogComponent } from './dialogs/confirm-dialog/confirm-dialog.component';
import { TableCreateDialogComponent } from './dialogs/table-create-dialog/table-create-dialog.component';
import { TableEditDialogComponent } from './dialogs/table-edit-dialog/table-edit-dialog.component';
import { DataCreateDialogComponent } from './dialogs/data-create-dialog/data-create-dialog.component';
import { DataEditDialogComponent } from './dialogs/data-edit-dialog/data-edit-dialog.component';

@NgModule({
    declarations: [
        DatabaseListComponent,
        DatabaseDetailComponent,
        DatabaseCreateDialogComponent,
        DatabaseEditDialogComponent,
        DatabaseUploadDialogComponent,
        ErDiagramComponent,
        DatabaseTableViewerComponent,
        TableCreateDialogComponent,
        TableEditDialogComponent,
        ConfirmDialogComponent,
        DataCreateDialogComponent,
        DataEditDialogComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MaterialModule,
        DatabasesRoutingModule
    ]
})
export class DatabaseModule { }
