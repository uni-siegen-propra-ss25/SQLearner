import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'app/material.module';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DatabaseRoutingModule } from './database-routing.module';
import { DatabaseListComponent } from './components/database-list/database-list.component';
import { DatabaseTableViewerComponent } from './components/database-table-viewer/database-table-viewer.component';
import { DatabaseEditDialogComponent } from './dialogs/database-edit-dialog/database-edit-dialog.component';
import { DatabaseCreateDialogComponent } from './dialogs/database-create-dialog/database-create-dialog.component';
import { DatabaseUploadDialogComponent } from './dialogs/database-upload-dialog/database-upload-dialog.component';
import { ConfirmDialogComponent } from './dialogs/confirm-dialog/confirm-dialog.component';
import { CreateTableDialogComponent } from './dialogs/create-table-dialog/create-table-dialog.component';

@NgModule({
    declarations: [
        DatabaseListComponent,
        DatabaseCreateDialogComponent,
        DatabaseEditDialogComponent,
        DatabaseUploadDialogComponent,
        ConfirmDialogComponent,
        DatabaseTableViewerComponent,
        CreateTableDialogComponent,
    ],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MaterialModule,
        MatIconModule,
        MatMenuModule,
        MatPaginatorModule,
        MatFormFieldModule,
        MatInputModule,
        MatDividerModule,
        MatProgressBarModule,
        MatProgressSpinnerModule,
        MatDialogModule,
        MatButtonModule,
        MatSelectModule,
        MatCheckboxModule,
        MatTooltipModule,
        DatabaseRoutingModule
    ]
})
export class DatabaseModule { }
