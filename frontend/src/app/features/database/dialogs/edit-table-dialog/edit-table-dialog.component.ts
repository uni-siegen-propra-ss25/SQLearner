import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DatabaseService } from '../../services/database.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DatabaseColumn } from '../../models/table.model';

export interface ColumnDefinition {
    name: string;
    dataType: string;
    isNullable: boolean;
    isPrimaryKey: boolean;
    isUnique: boolean;
    defaultValue: string;
    length: number;
    originalName?: string; // For tracking original column name
}

export interface EditTableData {
    tableName: string;
    columns: ColumnDefinition[];
}

export interface EditTableDialogData {
    databaseId: number;
    databaseName: string;
    tableName: string;
    columns: DatabaseColumn[];
}

@Component({
    selector: 'app-edit-table-dialog',
    templateUrl: './edit-table-dialog.component.html',
    styleUrls: ['./edit-table-dialog.component.scss'],
})
export class EditTableDialogComponent implements OnInit {
    form: FormGroup;
    dataTypes = [
        'INTEGER',
        'BIGINT',
        'SMALLINT',
        'SERIAL',
        'BIGSERIAL',
        'SMALLSERIAL',
        'VARCHAR',
        'CHAR',
        'TEXT',
        'DECIMAL',
        'NUMERIC',
        'REAL',
        'DOUBLE PRECISION',
        'BOOLEAN',
        'DATE',
        'TIME',
        'TIMESTAMP',
        'TIMESTAMPTZ',
        'UUID',
        'JSON',
        'JSONB',
    ];
    originalTableName: string;
    isLoading = false;

    constructor(
        private fb: FormBuilder,
        private dialogRef: MatDialogRef<EditTableDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: EditTableDialogData,
        private databaseService: DatabaseService,
        private snackBar: MatSnackBar,
    ) {
        this.originalTableName = data.tableName;
        this.form = this.fb.group({
            tableName: ['', [Validators.required, Validators.pattern(/^[a-zA-Z_][a-zA-Z0-9_]*$/)]],
            columns: this.fb.array([]),
        });
    }

    ngOnInit(): void {
        this.initializeForm();
    }

    private initializeForm(): void {
        // Set table name
        this.form.patchValue({
            tableName: this.data.tableName,
        });

        // Initialize columns
        const columnsArray = this.form.get('columns') as FormArray;
        columnsArray.clear();

        this.data.columns.forEach((column) => {
            const columnGroup = this.fb.group({
                name: [
                    column.name,
                    [Validators.required, Validators.pattern(/^[a-zA-Z_][a-zA-Z0-9_]*$/)],
                ],
                dataType: [this.mapColumnType(column.type), Validators.required],
                isNullable: [column.isNullable],
                isPrimaryKey: [column.isPrimaryKey],
                isUnique: [false], // We'll need to detect this from constraints
                defaultValue: [column.defaultValue || ''],
                length: [this.extractLength(column.type) || 255],
                originalName: [column.name], // Track original name for ALTER statements
            });

            columnsArray.push(columnGroup);
        });
    }

    private mapColumnType(dbType: string): string {
        const typeMapping: { [key: string]: string } = {
            integer: 'INTEGER',
            bigint: 'BIGINT',
            smallint: 'SMALLINT',
            serial: 'SERIAL',
            bigserial: 'BIGSERIAL',
            smallserial: 'SMALLSERIAL',
            varchar: 'VARCHAR',
            char: 'CHAR',
            text: 'TEXT',
            decimal: 'DECIMAL',
            numeric: 'NUMERIC',
            real: 'REAL',
            'double precision': 'DOUBLE PRECISION',
            boolean: 'BOOLEAN',
            date: 'DATE',
            time: 'TIME',
            timestamp: 'TIMESTAMP',
            timestamptz: 'TIMESTAMPTZ',
            uuid: 'UUID',
            json: 'JSON',
            jsonb: 'JSONB',
        };

        return typeMapping[dbType.toLowerCase()] || dbType.toUpperCase();
    }

    private extractLength(type: string): number | null {
        const match = type.match(/\((\d+)\)/);
        return match ? parseInt(match[1]) : null;
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
            length: [255],
            originalName: [''], // New columns don't have original name
        });

        this.columns.push(columnGroup);
    }

    removeColumn(index: number) {
        if (this.columns.length > 1) {
            this.columns.removeAt(index);
        }
    }

    generateAlterSQL(): string {
        const newTableName = this.form.get('tableName')?.value;
        const columns = this.form.get('columns')?.value;
        const originalTableName = this.originalTableName;

        if (!newTableName || !columns || columns.length === 0) {
            return '';
        }

        const statements: string[] = [];

        // Rename table if needed
        if (newTableName !== originalTableName) {
            statements.push(`ALTER TABLE "${originalTableName}" RENAME TO "${newTableName}";`);
        }

        // Handle column changes
        columns.forEach((column: ColumnDefinition) => {
            const originalName = column.originalName;

            if (!originalName) {
                // New column
                let columnDef = `ADD COLUMN "${column.name}" ${column.dataType}`;

                if (
                    (column.dataType === 'VARCHAR' || column.dataType === 'CHAR') &&
                    column.length
                ) {
                    columnDef += `(${column.length})`;
                }

                if (!column.isNullable) {
                    columnDef += ' NOT NULL';
                }

                if (column.defaultValue) {
                    columnDef += ` DEFAULT ${column.defaultValue}`;
                }

                statements.push(`ALTER TABLE "${newTableName}" ${columnDef};`);
            } else if (originalName !== column.name) {
                // Renamed column
                statements.push(
                    `ALTER TABLE "${newTableName}" RENAME COLUMN "${originalName}" TO "${column.name}";`,
                );
            }
        });

        return statements.join('\n');
    }

    onSubmit() {
        if (this.form.valid) {
            this.isLoading = true;
            const alterSQL = this.generateAlterSQL();

            if (!alterSQL.trim()) {
                this.snackBar.open('Keine Änderungen erkannt.', 'OK', { duration: 3000 });
                this.dialogRef.close({ success: false });
                return;
            }

            // Execute ALTER statements
            this.databaseService.runQuery(this.data.databaseId, alterSQL).subscribe({
                next: (result) => {
                    this.snackBar.open('Tabelle erfolgreich bearbeitet!', 'OK', { duration: 3000 });
                    this.dialogRef.close({
                        success: true,
                        sql: alterSQL,
                        formData: this.form.value,
                        result,
                    });
                },
                error: (error) => {
                    console.error('Error editing table:', error);
                    this.snackBar.open(
                        `Fehler beim Bearbeiten der Tabelle: ${error.error?.message || error.message || 'Unbekannter Fehler'}`,
                        'OK',
                        { duration: 5000 },
                    );
                },
                complete: () => {
                    this.isLoading = false;
                },
            });
        }
    }

    onCancel() {
        this.dialogRef.close({ success: false });
    }

    onDataTypeChange(columnIndex: number, dataType: string) {
        const column = this.columns.at(columnIndex);
        if (dataType === 'SERIAL' || dataType === 'BIGSERIAL' || dataType === 'SMALLSERIAL') {
            column.patchValue({
                isPrimaryKey: true,
                isNullable: false,
                defaultValue: '',
            });
        }
    }

    hasChanges(): boolean {
        const newTableName = this.form.get('tableName')?.value;
        const columns = this.form.get('columns')?.value;

        // Check if table name changed
        if (newTableName !== this.originalTableName) {
            return true;
        }

        // Check if columns changed
        if (columns.length !== this.data.columns.length) {
            return true;
        }

        // Check individual column changes
        for (let i = 0; i < columns.length; i++) {
            const newColumn = columns[i];
            const originalColumn = this.data.columns[i];

            if (
                !originalColumn ||
                newColumn.name !== originalColumn.name ||
                newColumn.dataType !== this.mapColumnType(originalColumn.type) ||
                newColumn.isNullable !== originalColumn.isNullable ||
                newColumn.isPrimaryKey !== originalColumn.isPrimaryKey
            ) {
                return true;
            }
        }

        return false;
    }
}
