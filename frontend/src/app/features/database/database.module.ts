import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { DatabaseRoutingModule } from './database-routing.module';

import { DatabaseListComponent } from './components/database-list/database-list.component';
import { DatabaseEditDialogComponent } from './dialogs/database-edit-dialog/database-edit-dialog.component';
import { DatabaseCreateDialogComponent } from './dialogs/database-create-dialog/database-create-dialog.component';
import { DatabaseUploadDialogComponent } from './dialogs/database-upload-dialog/database-upload-dialog.component';
import { ErDiagramComponent } from './components/er-diagram/er-diagram.component';

@NgModule({
    declarations: [
        DatabaseListComponent,
        DatabaseEditDialogComponent,
        DatabaseCreateDialogComponent,
        DatabaseUploadDialogComponent,
        ErDiagramComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatTableModule,
        MatSnackBarModule,
        MatButtonToggleModule,
        MatIconModule,
        MatCardModule,
        DatabaseRoutingModule
    ],
    exports: [
        DatabaseListComponent
    ]
})
export class DatabaseModule { }
