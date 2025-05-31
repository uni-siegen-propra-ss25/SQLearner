import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { DatabaseService } from '../../services/database.service';
import { Database } from '../../models/database.model';

@Component({
    selector: 'app-create-database-dialog',
    templateUrl: './create-database-dialog.component.html',
    styleUrls: ['./create-database-dialog.component.scss']
})
export class CreateDatabaseDialogComponent {
    form: FormGroup;

    constructor(
        private fb: FormBuilder,
        private dialogRef: MatDialogRef<CreateDatabaseDialogComponent>,
        private databaseService: DatabaseService
    ) {
        this.form = this.fb.group({
            name: ['', Validators.required],
            description: [''],
            schemaSql: ['', Validators.required]
        });
    }

    onSubmit() {
        if (this.form.valid) {
            const formData = this.form.value;
            console.log('Sending data to server:', formData);
            
            this.databaseService.createDatabase(formData).subscribe({
                next: (database: Database) => {
                    console.log('Database created successfully:', database);
                    this.dialogRef.close(database);
                },
                error: (error: any) => {
                    console.error('Error creating database:', error);
                    console.error('Error details:', error.error);
                }
            });
        }
    }

    onCancel() {
        this.dialogRef.close();
    }
} 