import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

export interface ColumnDefinition {
  name: string;
  dataType: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  isUnique: boolean;
  defaultValue: string;
  length: number;
}

export interface CreateTableData {
  tableName: string;
  columns: ColumnDefinition[];
}

@Component({
  selector: 'app-create-table-dialog',
  templateUrl: './create-table-dialog.component.html',
  styleUrls: ['./create-table-dialog.component.scss']
})
export class CreateTableDialogComponent {
  form: FormGroup;
  dataTypes = [
    'INTEGER', 'BIGINT', 'SMALLINT', 'SERIAL', 'BIGSERIAL', 'SMALLSERIAL',
    'VARCHAR', 'CHAR', 'TEXT',
    'DECIMAL', 'NUMERIC', 'REAL', 'DOUBLE PRECISION',
    'BOOLEAN',
    'DATE', 'TIME', 'TIMESTAMP', 'TIMESTAMPTZ',
    'UUID', 'JSON', 'JSONB'
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateTableDialogComponent>
  ) {
    this.form = this.fb.group({
      tableName: ['', [Validators.required, Validators.pattern(/^[a-zA-Z_][a-zA-Z0-9_]*$/)]],
      columns: this.fb.array([])
    });

    // Add initial column
    this.addColumn();
  }

  get columns() {
    return this.form.get('columns') as FormArray;
  }

  addColumn() {
    const columnGroup = this.fb.group({
      name: ['', [Validators.required, Validators.pattern(/^[a-zA-Z_][a-zA-Z0-9_]*$/)]],
      dataType: ['VARCHAR', Validators.required],
      isNullable: [true],
      isPrimaryKey: [false],
      isUnique: [false],
      defaultValue: [''],
      length: [255]
    });

    this.columns.push(columnGroup);
  }

  removeColumn(index: number) {
    if (this.columns.length > 1) {
      this.columns.removeAt(index);
    }
  }

  generateSQL(): string {
    const tableName = this.form.get('tableName')?.value;
    const columns = this.form.get('columns')?.value;

    if (!tableName || !columns || columns.length === 0) {
      return '';
    }

    let sql = `CREATE TABLE "${tableName}" (\n`;
    const columnDefinitions: string[] = [];
    const constraints: string[] = [];

    columns.forEach((column: ColumnDefinition, index: number) => {
      let columnDef = `  "${column.name}" ${column.dataType}`;
      
      // Add length for VARCHAR/CHAR
      if ((column.dataType === 'VARCHAR' || column.dataType === 'CHAR') && column.length) {
        columnDef += `(${column.length})`;
      }

      if (!column.isNullable) {
        columnDef += ' NOT NULL';
      }

      if (column.defaultValue) {
        columnDef += ` DEFAULT ${column.defaultValue}`;
      }

      if (column.isPrimaryKey) {
        columnDef += ' PRIMARY KEY';
      }

      if (column.isUnique && !column.isPrimaryKey) {
        columnDef += ' UNIQUE';
      }

      columnDefinitions.push(columnDef);
    });

    sql += columnDefinitions.join(',\n');
    sql += '\n);';

    return sql;
  }

  onSubmit() {
    if (this.form.valid) {
      const sql = this.generateSQL();
      this.dialogRef.close({ sql, formData: this.form.value });
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  onDataTypeChange(columnIndex: number, dataType: string) {
    const column = this.columns.at(columnIndex);
    if (dataType === 'SERIAL' || dataType === 'BIGSERIAL' || dataType === 'SMALLSERIAL') {
      column.patchValue({
        isPrimaryKey: true,
        isNullable: false,
        defaultValue: ''
      });
    }
  }
} 