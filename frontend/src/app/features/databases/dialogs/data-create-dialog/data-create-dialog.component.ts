import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DatabaseTable, TableColumn, TableDataDto } from '../../models/database.model';
import { TableService } from '../../services/table.service';
import { SqlDataType } from '../../models/sql.model';

@Component({
  selector: 'app-data-create-dialog',
  templateUrl: './data-create-dialog.component.html',
  styleUrls: ['../shared/table-dialog.scss']
})
export class DataCreateDialogComponent {
  dataForm: FormGroup;
  SqlDataType = SqlDataType;
  
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<DataCreateDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { databaseId: number; table: DatabaseTable },
    private tableService: TableService,
    private snackBar: MatSnackBar
  ) {
    this.dataForm = this.createForm();
  }

  private createForm(): FormGroup {
    const group: { [key: string]: any[] } = {};
    
    this.data.table.columns.forEach(column => {
      const validators = [
        ...(!column.nullable ? [Validators.required] : []),
        ...(this.getTypeValidators(column))
      ];
      
      group[column.name] = [this.getDefaultValue(column), validators];
    });

    return this.fb.group(group);
  }

  private getDefaultValue(column: TableColumn): any {
    if (!column.nullable) return '';
    
    switch (column.type) {
      case SqlDataType.INT:
      case SqlDataType.DECIMAL:
      case SqlDataType.FLOAT:
        return null;
      case SqlDataType.DATE:
      case SqlDataType.TIMESTAMP:
        return null;
      case SqlDataType.BOOLEAN:
        return null;
      default:
        return null;
    }
  }

  private getTypeValidators(column: TableColumn) {
    const validators = [];
    
    switch (column.type) {
      case SqlDataType.VARCHAR:
      case SqlDataType.TEXT:
        validators.push(Validators.maxLength(255));
        break;

      case SqlDataType.INT:
        validators.push(Validators.pattern('^-?\\d+$'));
        validators.push(Validators.min(-2147483648));
        validators.push(Validators.max(2147483647));
        break;

      case SqlDataType.DECIMAL:
      case SqlDataType.FLOAT:
        validators.push(Validators.pattern('^-?\\d*\\.?\\d+(?:[eE][-+]?\\d+)?$'));
        break;

      case SqlDataType.DATE:
        validators.push(Validators.pattern('^\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])$'));
        break;

      case SqlDataType.TIMESTAMP:
        validators.push(Validators.pattern('^\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])[T ](?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z|[-+]\\d{2}:?\\d{2})?$'));
        break;

      case SqlDataType.BOOLEAN:
        // Will be handled by mat-select in template
        break;
    }

    return validators;
  }

  onSubmit() {
    if (this.dataForm.valid) {
      // Transform form values to handle nulls, empty strings, and dates
      const values = this.data.table.columns.map(col => {
        let value = this.dataForm.get(col.name)?.value;

        // Handle empty strings and null values
        if (value === '' || value === undefined) {
          return col.nullable ? null : '';
        }

        // Don't convert null values
        if (value === null) {
          return null;
        }

        // Type-specific conversions
        switch (col.type) {
          case SqlDataType.INT:
            return value !== null ? parseInt(value, 10) : null;
            
          case SqlDataType.DECIMAL:
          case SqlDataType.FLOAT:
            return value !== null ? parseFloat(value) : null;
            
          case SqlDataType.DATE:
            if (value) {
              // Ensure date is in YYYY-MM-DD format
              if (value instanceof Date) {
                value = value.toISOString().split('T')[0];
              }
              // Validate date format
              if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                throw new Error(`Invalid date format for column ${col.name}`);
              }
            }
            return value;
            
          case SqlDataType.TIMESTAMP:
            if (value) {
              // Normalize timestamp format
              value = value.replace('T', ' ');
              // Remove milliseconds and timezone if present
              value = value.split('.')[0];
            }
            return value;
            
          case SqlDataType.BOOLEAN:
            return value === 'true' || value === true;
            
          default:
            return value;
        }
      });

      // Ensure all values are properly formed
      const processedValues = values.map(value => {
        // Convert undefined to null
        if (value === undefined) return null;
        // Ensure arrays and objects are stringified
        if (typeof value === 'object' && value !== null) return JSON.stringify(value);
        return value;
      });

      // The backend expects all column values for a single row as one array
      // Create a new TableDataDto instance to ensure proper transformation
      const tableData = new TableDataDto({
        tableName: this.data.table.name,
        columns: this.data.table.columns.map(col => col.name),
        values: [[...processedValues]]  // Wrap processed values in two arrays for proper nesting
      });

      console.log('Sending table data:', JSON.stringify(tableData, null, 2));
      this.tableService.insertTableData(
        this.data.databaseId,
        this.data.table.id,
        tableData
      ).subscribe({
        next: () => {
          this.snackBar.open('Datensatz erfolgreich erstellt', 'OK', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (error: Error) => {
          console.error('Error creating data:', error);
          this.snackBar.open('Fehler beim Erstellen des Datensatzes: ' + error.message, 'OK', { duration: 5000 });
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  getErrorMessage(columnName: string): string {
    const control = this.dataForm.get(columnName);
    if (!control || !control.errors) return '';

    if (control.errors['required']) {
      return 'Dieses Feld ist erforderlich';
    }
    if (control.errors['maxlength']) {
      return `Text ist zu lang (maximal ${control.errors['maxlength'].requiredLength} Zeichen)`;
    }
    if (control.errors['pattern']) {
      return 'Ungültiges Format';
    }
    if (control.errors['min'] || control.errors['max']) {
      return 'Wert außerhalb des gültigen Bereichs';
    }

    return 'Ungültige Eingabe';
  }

  isNumericType(type: string): boolean {
    return [SqlDataType.INT, SqlDataType.DECIMAL, SqlDataType.FLOAT].includes(type as SqlDataType);
  }
}
