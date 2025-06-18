import { Component, Inject, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { FormBuilder, FormGroup } from '@angular/forms';
import { DatabaseService, QueryResult } from '../../services/database.service';
import { Database } from '../../models/database.model';
import { CreateTableDialogComponent } from '../create-table-dialog/create-table-dialog.component';
import * as monaco from 'monaco-editor';

interface DialogData {
  database: Database;
  tableName?: string;
}

@Component({
  selector: 'app-database-view-dialog',
  templateUrl: './database-view-dialog.component.html',
  styleUrls: ['./database-view-dialog.component.scss']
})
export class DatabaseViewDialogComponent implements OnInit, AfterViewInit {
  @ViewChild('editorContainer') editorContainer!: ElementRef;
  
  queryForm: FormGroup;
  queryResult: QueryResult | null = null;
  error: string | null = null;
  displayedColumns: string[] = [];
  isLoading = false;
  editor: monaco.editor.IStandaloneCodeEditor | null = null;

  editorOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
    theme: 'vs-dark',
    language: 'sql',
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    fontSize: 14,
    lineNumbers: 'on',
    roundedSelection: false,
    scrollbar: {
      vertical: 'visible',
      horizontal: 'visible',
      useShadows: false,
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10
    },
    automaticLayout: true
  };

  constructor(
    private dialogRef: MatDialogRef<DatabaseViewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private fb: FormBuilder,
    private databaseService: DatabaseService,
    private dialog: MatDialog
  ) {
    this.queryForm = this.fb.group({
      query: ['']
    });
  }

  ngOnInit(): void {
    // Set initial query to show all tables in the database
    const initialQuery = 'SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\' AND table_type = \'BASE TABLE\' ORDER BY table_name;';
    
    this.queryForm.patchValue({ query: initialQuery });
  }

  ngAfterViewInit(): void {
    // Initialize Monaco Editor
    this.editor = monaco.editor.create(this.editorContainer.nativeElement, {
      ...this.editorOptions,
      value: this.queryForm.get('query')?.value
    });

    // Update form when editor content changes
    this.editor.onDidChangeModelContent(() => {
      this.queryForm.patchValue({
        query: this.editor?.getValue()
      });
    });

    // Execute initial query after editor is ready
    setTimeout(() => this.executeQuery(), 100);
  }

  executeQuery(): void {
    const query = this.queryForm.get('query')?.value;
    if (!query) return;

    this.isLoading = true;
    this.error = null;
    this.queryResult = null;
    this.displayedColumns = []; // Reset columns

    console.log('Executing query:', query);

    this.databaseService.runQuery(this.data.database.id, query).subscribe({
      next: (result: QueryResult) => {
        console.log('Query result:', result);
        this.queryResult = result;
        
        // Set displayed columns from result
        if (result.columns && result.columns.length > 0) {
          this.displayedColumns = [...result.columns];
          console.log('Displayed columns set to:', this.displayedColumns);
        } else {
          console.warn('No columns found in result');
        }
        
        if (result.error) {
          this.error = result.error;
        }
        this.isLoading = false;
      },
      error: (err: { error?: { message?: string } }) => {
        console.error('Query error:', err);
        this.error = err.error?.message || 'An error occurred while executing the query';
        this.isLoading = false;
      }
    });
  }

  clearQuery(): void {
    if (this.editor) {
      this.editor.setValue('');
    }
    this.queryForm.patchValue({ query: '' });
    this.queryResult = null;
    this.error = null;
  }

  createTable(): void {
    const dialogRef = this.dialog.open(CreateTableDialogComponent, {
      width: '800px',
      maxHeight: '90vh'
    });

    dialogRef.afterClosed().subscribe((result: { sql: string, formData: any } | undefined) => {
      if (result && result.sql) {
        // Set the generated SQL in the editor
        if (this.editor) {
          this.editor.setValue(result.sql);
        }
        this.queryForm.patchValue({ query: result.sql });
        
        // Execute the query to create the table
        this.executeQuery();
      }
    });
  }

  showTables(): void {
    const showTablesQuery = `SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
ORDER BY table_name, ordinal_position;`;
    
    if (this.editor) {
      this.editor.setValue(showTablesQuery);
    }
    this.queryForm.patchValue({ query: showTablesQuery });
    this.executeQuery();
  }

  close(): void {
    if (this.editor) {
      this.editor.dispose();
    }
    this.dialogRef.close();
  }

  formatDate(date: Date): string {
    if (!date) return '';
    return new Date(date).toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
}