import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DatabaseColumn } from '../../models/table.model';

export interface DataEditDialogData {
  mode: 'add' | 'edit';
  tableName: string;
  columns: DatabaseColumn[];
  rowData?: any;
  databaseId: number;
}

@Component({
  selector: 'app-data-edit-dialog',
  templateUrl: './data-edit-dialog.component.html',
  styleUrls: ['./data-edit-dialog.component.scss']
})
export class DataEditDialogComponent implements OnInit {
  form: FormGroup;
  columns: DatabaseColumn[];
  mode: 'add' | 'edit';
  tableName: string;
  databaseId: number;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<DataEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DataEditDialogData
  ) {
    this.mode = data.mode;
    this.columns = data.columns;
    this.tableName = data.tableName;
    this.databaseId = data.databaseId;
    this.form = this.fb.group({});
  }

  ngOnInit(): void {
    this.buildForm();
  }

  private buildForm(): void {
    const formControls: { [key: string]: any } = {};

    this.columns.forEach(column => {
      let validators = [];
      
      // Add validators depending on the column type
      if (!column.isNullable) {
        validators.push(Validators.required);
      }

      // Special validators for different data types
      if (column.type.includes('int') || column.type.includes('numeric')) {
        validators.push(Validators.pattern(/^-?\d*\.?\d*$/));
      }

      if (column.type.includes('varchar') || column.type.includes('text')) {
        validators.push(Validators.maxLength(255));
      }

      // Default value
      let defaultValue = null;
      if (this.mode === 'edit' && this.data.rowData) {
        defaultValue = this.data.rowData[column.name];
      } else if (column.defaultValue) {
        defaultValue = column.defaultValue;
      }

      // For autoincremental fields we do readonly
      if (column.isPrimaryKey && column.type.includes('SERIAL')) {
        defaultValue = null;
        validators = []; // Remove validators for autoincrement fields
      }

      formControls[column.name] = [defaultValue, validators];
    });

    this.form = this.fb.group(formControls);
  }

  getFieldType(column: DatabaseColumn): string {
    if (column.type.includes('int') || column.type.includes('numeric')) {
      return 'number';
    }
    if (column.type.includes('date') || column.type.includes('timestamp')) {
      return 'datetime-local';
    }
    if (column.type.includes('bool')) {
      return 'checkbox';
    }
    return 'text';
  }

  getPlaceholder(column: DatabaseColumn): string {
    if (column.type.includes('int') || column.type.includes('numeric')) {
      return 'Zahl eingeben';
    }
    if (column.type.includes('date') || column.type.includes('timestamp')) {
      return 'Datum und Zeit auswählen';
    }
    if (column.type.includes('varchar')) {
      return 'Text eingeben';
    }
    if (column.type.includes('text')) {
      return 'Langer Text eingeben';
    }
    if (column.type.includes('bool')) {
      return '';
    }
    return 'Wert eingeben';
  }

  isFieldDisabled(column: DatabaseColumn): boolean {
    // Disable fields only for autoincremental primary keys
    return this.mode === 'edit' && column.isPrimaryKey && column.type.includes('SERIAL');
  }

  isFieldRequired(column: DatabaseColumn): boolean {
    return !column.isNullable;
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.isLoading = true;
      const formData = this.form.value;
      
      // Remove null values for optional fields
      Object.keys(formData).forEach(key => {
        if (formData[key] === null || formData[key] === '') {
          delete formData[key];
        }
      });

      this.dialogRef.close({
        success: true,
        data: formData
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close({ success: false });
  }

  getErrorMessage(columnName: string): string {
    const control = this.form.get(columnName);
    if (control?.hasError('required')) {
      return 'Dieses Feld ist erforderlich';
    }
    if (control?.hasError('pattern')) {
      return 'Ungültiges Format';
    }
    if (control?.hasError('maxlength')) {
      return 'Maximale Länge überschritten';
    }
    return '';
  }
} 