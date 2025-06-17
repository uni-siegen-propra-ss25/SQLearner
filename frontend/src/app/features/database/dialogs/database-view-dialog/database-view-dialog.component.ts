import { Component, Inject, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup } from '@angular/forms';
import { DatabaseService, QueryResult } from '../../services/database.service';
import { Database } from '../../models/database.model';
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
    private databaseService: DatabaseService
  ) {
    this.queryForm = this.fb.group({
      query: ['']
    });
  }

  ngOnInit(): void {
    // Extract table name from schema and set initial query
    const tableName = this.extractTableName(this.data.database.schemaSql);
    const initialQuery = tableName ? `SELECT * FROM "${tableName}";` : 'SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\' AND table_type = \'BASE TABLE\';';
    
    this.queryForm.patchValue({ query: initialQuery });
  }

  private extractTableName(schemaSql: string): string | null {
    // Extract table name from CREATE TABLE statement
    const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["']?([^"'\s(]+)["']?/i;
    const match = schemaSql.match(createTableRegex);
    return match ? match[1] : null;
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

  close(): void {
    if (this.editor) {
      this.editor.dispose();
    }
    this.dialogRef.close();
  }
}