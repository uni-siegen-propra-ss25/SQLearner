import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DatabaseTable, TableColumn } from '../../models/database.model';

@Component({
  selector: 'app-edit-table-dialog',
  templateUrl: './table-edit-dialog.component.html',
  styleUrls: ['../shared/table-dialog.scss']
})
export class TableEditDialogComponent {
  tableForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<TableEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { table: DatabaseTable }
  ) {
    this.tableForm = this.fb.group({
      name: [data.table.name, [Validators.required, Validators.pattern('[a-zA-Z_][a-zA-Z0-9_]*')]],
      columns: this.fb.array([])
    });

    // Initialize columns from existing table
    data.table.columns.forEach(column => {
      this.columns.push(this.createColumn(column));
    });
  }

  get columns() {
    return this.tableForm.get('columns') as FormArray;
  }

  createColumn(column?: TableColumn) {
    return this.fb.group({
      name: [column?.name || '', [Validators.required, Validators.pattern('[a-zA-Z_][a-zA-Z0-9_]*')]],
      type: [column?.type || 'TEXT', Validators.required],
      isPrimaryKey: [{value: column?.isPrimaryKey || false, disabled: column?.isPrimaryKey}],
      isNullable: [column?.nullable ?? true],
      isForeignKey: [column?.isForeignKey || false]
    });
  }

  addColumn() {
    this.columns.push(this.createColumn());
  }

  removeColumn(index: number) {
    if (this.columns.length > 1) {
      const column = this.columns.at(index);
      if (!column.get('isPrimaryKey')?.value) {
        this.columns.removeAt(index);
      }
    }
  }

  onSubmit() {
    if (this.tableForm.valid) {
      const result = {
        ...this.tableForm.value,
        id: this.data.table.id
      };
      this.dialogRef.close(result);
    }
  }

  cancel() {
    this.dialogRef.close();
  }
}
