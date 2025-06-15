import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatabasesRoutingModule } from './databases-routing.module';
import { MaterialModule } from 'app/material.module';
import { DatabaseListComponent } from './components/database-list/database-list.component';
import { DatabaseDetailComponent } from './components/database-detail/database-detail.component';
import { ErDiagramComponent } from './components/er-diagram/er-diagram.component';
import { DatabaseTableViewerComponent } from './components/database-table-viewer/database-table-viewer.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DatabaseEditDialogComponent } from './dialogs/database-edit-dialog/database-edit-dialog.component';
import { DatabaseCreateDialogComponent } from './dialogs/database-create-dialog/database-create-dialog.component';
import { DatabaseUploadDialogComponent } from './dialogs/database-upload-dialog/database-upload-dialog.component';

@NgModule({
    declarations: [
        DatabaseListComponent,
        DatabaseDetailComponent,
        DatabaseCreateDialogComponent,
        DatabaseEditDialogComponent,
        DatabaseUploadDialogComponent,
        ErDiagramComponent,
        DatabaseTableViewerComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MaterialModule,
        DatabasesRoutingModule
    ]
})
export class DatabasesModule { }
