import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DatabaseTable, TableColumn } from '../../models/database.model';
import { TableService } from '../../services/table.service';
import { SqlDataType } from '../../models/sql.model';

@Component({
  selector: 'app-data-edit-dialog',
  templateUrl: './data-edit-dialog.component.html',
  styleUrls: ['../shared/table-dialog.scss']
})
export class DataEditDialogComponent {
  dataForm: FormGroup;
SqlDataType: any;
  
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<DataEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { 
      databaseId: number; 
      table: DatabaseTable;
      rowData: any;
    },
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
      
      group[column.name] = [this.data.rowData[column.name], validators];
    });

    return this.fb.group(group);
  }

  private getTypeValidators(column: TableColumn) {
    const validators = [];
    
    switch (column.type) {
      case SqlDataType.VARCHAR:
      case SqlDataType.TEXT:
        // Use default max length of 255 for VARCHAR
        validators.push(Validators.maxLength(255));
        break;
      case SqlDataType.INT:
        validators.push(Validators.pattern('^-?\\d+$'));
        // Add reasonable limits for INT
        validators.push(Validators.min(-2147483648));
        validators.push(Validators.max(2147483647));
        break;
      case SqlDataType.DECIMAL:
      case SqlDataType.FLOAT:
        // Allow scientific notation and ensure single decimal point
        validators.push(Validators.pattern('^-?\\d*\\.?\\d+(?:[eE][-+]?\\d+)?$'));
        // Use default precision of 10,2 for decimals
        const maxValue = Math.pow(10, 8) - 0.01; // 10-2 for scale
        validators.push(Validators.min(-maxValue));
        validators.push(Validators.max(maxValue));
        break;
      case SqlDataType.DATE:
        // ISO date format YYYY-MM-DD
        validators.push(Validators.pattern('^\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])$'));
        break;
      case SqlDataType.TIMESTAMP:
        // ISO datetime format
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
      // Find the primary key column and value for WHERE clause
      const pkColumn = this.data.table.columns.find(col => col.isPrimaryKey);
      if (!pkColumn) {
        this.snackBar.open('Keine Primärschlüsselspalte gefunden', 'OK', { duration: 3000 });
        return;
      }

      const pkValue = this.data.rowData[pkColumn.name];
      const updateData = {
        ...this.dataForm.value,
        [pkColumn.name]: pkValue // ensure PK is included
      };

      this.tableService.updateTableRow(
        this.data.databaseId,
        this.data.table.id,
        pkColumn.name,
        pkValue,
        updateData
      ).subscribe({
        next: () => {
          this.snackBar.open('Datensatz erfolgreich aktualisiert', 'OK', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error('Error updating data:', error);
          this.snackBar.open('Fehler beim Aktualisieren des Datensatzes', 'OK', { duration: 3000 });
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

    return 'Ungültige Eingabe';
  }

  isNumericType(type: SqlDataType): boolean {
    return [SqlDataType.INT, SqlDataType.DECIMAL, SqlDataType.FLOAT].includes(type);
  }

  isPrimaryKey(columnName: string): boolean {
    return this.data.table.columns.some(col => col.name === columnName && col.isPrimaryKey);
  }
}
