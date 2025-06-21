import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DatabaseTable } from '../../models/database.model';
import { SqlDataType, ColumnMetadata } from '../../models/sql.model';

interface TableColumn {
  name: string;
  type: SqlDataType;
  nullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  defaultValue?: string;
  autoIncrement?: boolean;
  referencesTable?: string;
  referencesColumn?: string;
  metadata?: {
    maxLength?: number;
    precision?: number;
    scale?: number;
  };
}

@Component({
  selector: 'app-create-table-dialog',
  templateUrl: './table-create-dialog.component.html',
  styleUrls: ['../shared/table-dialog.scss']
})
export class TableCreateDialogComponent {
  tableForm: FormGroup;
  sqlTypes = Object.values(SqlDataType);

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<TableCreateDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private data: { databaseId: number },
    private snackBar: MatSnackBar
  ) {
    this.tableForm = this.fb.group({
      name: ['', [
        Validators.required,
        Validators.minLength(1),
        Validators.maxLength(63),
        Validators.pattern('^[a-zA-Z][a-zA-Z0-9_]*$')
      ]],
      description: [''],
      columns: this.fb.array([], [Validators.required, Validators.minLength(1)])
    });

    this.addColumn();
  }

  get columns() {
    return this.tableForm.get('columns') as FormArray;
  }

  getColumnAsFormGroup(index: number): FormGroup {
    return this.columns.at(index) as FormGroup;
  }

  createColumn() {
    return this.fb.group({
      name: ['', [
        Validators.required,
        Validators.minLength(1),
        Validators.maxLength(63),
        Validators.pattern('^[a-zA-Z][a-zA-Z0-9_]*$')
      ]],
      type: ['INT', [Validators.required, this.sqlTypeValidator()]],
      nullable: [true],
      isPrimaryKey: [false],
      isForeignKey: [false],
      defaultValue: [''],
      autoIncrement: [false],
      referencesTable: [''],
      referencesColumn: [''],
      metadata: this.fb.group({
        maxLength: [null],
        precision: [null],
        scale: [null]
      })
    }, { validators: [this.columnValidators()] });
  }

  addColumn() {
    this.columns.push(this.createColumn());
  }

  removeColumn(index: number) {
    if (this.columns.length > 1) {
      this.columns.removeAt(index);
    }
  }

  needsMetadata(type: SqlDataType): { maxLength?: boolean; precision?: boolean; scale?: boolean } {
    switch (type) {
      case SqlDataType.VARCHAR:
      case SqlDataType.TEXT:
        return { maxLength: true };
      case SqlDataType.DECIMAL:
        return { precision: true, scale: true };
      default:
        return {};
    }
  }

  showMetadataFields(column: FormGroup): boolean {
    const type = column.get('type')?.value;
    const metadataNeeded = this.needsMetadata(type);
    return Object.keys(metadataNeeded).length > 0;
  }

  canBeAutoIncrement(type: SqlDataType): boolean {
    return type === SqlDataType.INT;
  }

  private columnValidators(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const type = control.get('type')?.value;
      const isForeignKey = control.get('isForeignKey')?.value;
      const metadata = control.get('metadata')?.value;
      const errors: ValidationErrors = {};

      // Validate foreign key references
      if (isForeignKey) {
        const referencesTable = control.get('referencesTable')?.value;
        const referencesColumn = control.get('referencesColumn')?.value;
        
        if (!referencesTable) {
          errors['referencesTableRequired'] = true;
        }
        if (!referencesColumn) {
          errors['referencesColumnRequired'] = true;
        }
      }

      // Validate metadata based on type
      const metadataNeeded = this.needsMetadata(type);
      if (metadataNeeded.maxLength) {
        const maxLength = metadata?.maxLength;
        if (!maxLength || maxLength < 1 || maxLength > 65535) {
          errors['invalidMaxLength'] = true;
        }
      }
      
      if (metadataNeeded.precision) {
        const precision = metadata?.precision;
        const scale = metadata?.scale;
        
        if (!precision || precision < 1 || precision > 65) {
          errors['invalidPrecision'] = true;
        }
        if (scale === undefined || scale < 0 || scale > 30) {
          errors['invalidScale'] = true;
        }
        if (precision && scale && scale > precision) {
          errors['scaleExceedsPrecision'] = true;
        }
      }

      return Object.keys(errors).length > 0 ? errors : null;
    };
  }

  private sqlTypeValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const validTypes = Object.values(SqlDataType);
      return validTypes.includes(control.value as SqlDataType) 
        ? null 
        : { invalidSqlType: { value: control.value } };
    };
  }

  onSubmit() {
    if (this.tableForm.valid) {
      // Transform form value to match backend DTO
      const formValue = this.tableForm.value;
      const columns: TableColumn[] = formValue.columns.map((col: any) => {
        // Start with basic column properties
        const column: TableColumn = {
          name: col.name,
          type: col.type,
          nullable: col.nullable,
          isPrimaryKey: col.isPrimaryKey,
          isForeignKey: col.isForeignKey
        };

        // Only add optional properties if they have values
        if (col.defaultValue) {
          column.defaultValue = col.defaultValue;
        }

        // Only enable autoincrement for INTEGER types
        if (col.type === SqlDataType.INT) {
          if (col.autoIncrement) {
            column.autoIncrement = true;
          }
        }

        if (col.isForeignKey) {
          column.referencesTable = col.referencesTable;
          column.referencesColumn = col.referencesColumn;
        }

        // Only include metadata if it's needed for the type
        const metadataNeeded = this.needsMetadata(col.type);
        if (Object.keys(metadataNeeded).length > 0) {
          const metadata: Record<string, number> = {};
          let hasMetadata = false;

          if (metadataNeeded.maxLength && col.metadata?.['maxLength']) {
            metadata['maxLength'] = Number(col.metadata['maxLength']);
            hasMetadata = true;
          }
          if (metadataNeeded.precision && col.metadata?.['precision']) {
            metadata['precision'] = Number(col.metadata['precision']);
            hasMetadata = true;
          }
          if (metadataNeeded.scale && col.metadata?.['scale']) {
            metadata['scale'] = Number(col.metadata['scale']);
            hasMetadata = true;
          }

          if (hasMetadata) {
            column.metadata = metadata;
          }
        }

        return column;
      });

      const createTableDto = {
        name: formValue.name,
        description: formValue.description || undefined,
        columns
      };

      // Here you would typically call a service to create the table
    }
  }

  cancel() {
    this.dialogRef.close();
  }
}
