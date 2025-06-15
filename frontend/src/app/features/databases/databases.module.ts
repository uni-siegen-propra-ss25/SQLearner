import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatabasesRoutingModule } from './databases-routing.module';
import { MaterialModule } from 'app/material.module';
import { DatabaseListComponent } from './components/database-list/database-list.component';
import { DatabaseDetailComponent } from './components/database-detail/database-detail.component';
import { DatabaseEditDialogComponent } from './dialogs/edit-database-dialog/database-edit-dialog.component';
import { DatabaseCreateDialogComponent } from './dialogs/create-database-dialog/database-create-dialog.component';
import { DatabaseUploadDialogComponent } from './dialogs/upload-database-dialog/database-upload-dialog.component';
import { ErDiagramComponent } from './components/er-diagram/er-diagram.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
    declarations: [
        DatabaseListComponent,
        DatabaseDetailComponent,
        DatabaseEditDialogComponent,
        DatabaseCreateDialogComponent,
        DatabaseUploadDialogComponent,
        ErDiagramComponent,
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
