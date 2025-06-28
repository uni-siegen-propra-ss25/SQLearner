import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { DatabaseService } from '../../services/database.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MonacoEditorService } from '../../../../shared/services/monaco-editor.service';
import * as monaco from 'monaco-editor';

@Component({
    selector: 'app-database-create-dialog',
    templateUrl: './database-create-dialog.component.html',
    styleUrls: ['./database-create-dialog.component.scss'],
})
export class DatabaseCreateDialogComponent implements OnInit, AfterViewInit, OnDestroy {
    form: FormGroup;
    isLoading = false;
    editor: monaco.editor.IStandaloneCodeEditor | null = null;

    @ViewChild('sqlEditorContainer', { static: false }) sqlEditorContainer!: ElementRef;

    constructor(
        private fb: FormBuilder,
        private dialogRef: MatDialogRef<DatabaseCreateDialogComponent>,
        private databaseService: DatabaseService,
        private snackBar: MatSnackBar,
        private monacoEditorService: MonacoEditorService
    ) {
        this.form = this.fb.group({
            name: ['', [Validators.required, Validators.pattern(/^[a-zA-Z_][a-zA-Z0-9_]*$/)]],
            description: [''],
            schemaSql: ['']
        });
    }

    async ngOnInit(): Promise<void> {
        await this.monacoEditorService.initMonaco();
    }

    async ngAfterViewInit(): Promise<void> {
        await this.initializeMonacoEditor();
    }

    ngOnDestroy(): void {
        if (this.editor) {
            this.editor.dispose();
        }
    }

    private async initializeMonacoEditor(): Promise<void> {
        if (!this.sqlEditorContainer) {
            return;
        }

        try {
            this.editor = await this.monacoEditorService.createEditor(
                this.sqlEditorContainer.nativeElement,
                this.form.get('schemaSql')?.value || '',
                {
                    language: 'sql',
                    theme: 'sqlLearnerLight',
                    automaticLayout: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    lineNumbers: 'on',
                    roundedSelection: false,
                    scrollbar: {
                        vertical: 'visible',
                        horizontal: 'visible'
                    },
                    folding: true,
                    wordWrap: 'on',
                    suggestOnTriggerCharacters: true,
                    quickSuggestions: true,
                    parameterHints: {
                        enabled: true
                    },
                    hover: {
                        enabled: true
                    }
                }
            );

            // Register SQL language features
            this.monacoEditorService.registerSqlLanguageFeatures(
                (word: monaco.editor.IWordAtPosition, range: monaco.Range) => this.getSqlSuggestions(word, range)
            );

            // Update form value when editor content changes
            if (this.editor) {
                this.editor.onDidChangeModelContent(() => {
                    const value = this.editor?.getValue() || '';
                    this.form.patchValue({ schemaSql: value });
                });

                // Set initial value
                const initialValue = this.form.get('schemaSql')?.value || '';
                if (initialValue) {
                    this.editor.setValue(initialValue);
                }
            }

        } catch (error) {
            console.error('Failed to initialize Monaco Editor:', error);
            this.snackBar.open('Fehler beim Laden des SQL-Editors', 'OK', { duration: 3000 });
        }
    }

    private getSqlSuggestions(word: monaco.editor.IWordAtPosition, range: monaco.Range): monaco.languages.CompletionItem[] {
        const suggestions: monaco.languages.CompletionItem[] = [
            // SQL Keywords
            {
                label: 'CREATE TABLE',
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: 'CREATE TABLE ${1:table_name} (\n\t${2:column_name} ${3:data_type}\n);',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Create a new table',
                range: range
            },
            {
                label: 'INSERT INTO',
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: 'INSERT INTO ${1:table_name} (${2:column1}, ${3:column2}) VALUES (${4:value1}, ${5:value2});',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Insert data into a table',
                range: range
            },
            {
                label: 'SELECT',
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: 'SELECT ${1:*} FROM ${2:table_name};',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Select data from a table',
                range: range
            },
            {
                label: 'ALTER TABLE',
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: 'ALTER TABLE ${1:table_name} ADD COLUMN ${2:column_name} ${3:data_type};',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Modify table structure',
                range: range
            },
            // Data types
            {
                label: 'INTEGER',
                kind: monaco.languages.CompletionItemKind.Class,
                insertText: 'INTEGER',
                documentation: 'Integer data type',
                range: range
            },
            {
                label: 'VARCHAR',
                kind: monaco.languages.CompletionItemKind.Class,
                insertText: 'VARCHAR(${1:255})',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Variable-length character string',
                range: range
            },
            {
                label: 'TEXT',
                kind: monaco.languages.CompletionItemKind.Class,
                insertText: 'TEXT',
                documentation: 'Variable unlimited length character string',
                range: range
            },
            {
                label: 'BOOLEAN',
                kind: monaco.languages.CompletionItemKind.Class,
                insertText: 'BOOLEAN',
                documentation: 'Boolean data type',
                range: range
            },
            {
                label: 'DATE',
                kind: monaco.languages.CompletionItemKind.Class,
                insertText: 'DATE',
                documentation: 'Date data type',
                range: range
            },
            {
                label: 'TIMESTAMP',
                kind: monaco.languages.CompletionItemKind.Class,
                insertText: 'TIMESTAMP',
                documentation: 'Timestamp data type',
                range: range
            },
            {
                label: 'SERIAL',
                kind: monaco.languages.CompletionItemKind.Class,
                insertText: 'SERIAL',
                documentation: 'Auto-incrementing integer',
                range: range
            },
            // Constraints
            {
                label: 'PRIMARY KEY',
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: 'PRIMARY KEY',
                documentation: 'Primary key constraint',
                range: range
            },
            {
                label: 'FOREIGN KEY',
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: 'FOREIGN KEY (${1:column}) REFERENCES ${2:table}(${3:column})',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Foreign key constraint',
                range: range
            },
            {
                label: 'UNIQUE',
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: 'UNIQUE',
                documentation: 'Unique constraint',
                range: range
            },
            {
                label: 'NOT NULL',
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: 'NOT NULL',
                documentation: 'Not null constraint',
                range: range
            },
            {
                label: 'DEFAULT',
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: 'DEFAULT ${1:value}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Default value constraint',
                range: range
            }
        ];

        return suggestions;
    }

    loadExample(): void {
        const exampleSQL = `-- Beispiel für eine einfache Datenbankstruktur
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Beispiel-Daten einfügen
INSERT INTO users (username, email, password_hash) VALUES
    ('admin', 'admin@example.com', 'hashed_password_here'),
    ('user1', 'user1@example.com', 'hashed_password_here');

INSERT INTO posts (user_id, title, content) VALUES
    (1, 'Willkommen', 'Dies ist mein erster Post!'),
    (2, 'Hallo Welt', 'Hallo, das ist ein Test-Post.');`;

        if (this.editor) {
            this.editor.setValue(exampleSQL);
            this.form.patchValue({ schemaSql: exampleSQL });
        }
    }

    formatCode(): void {
        if (this.editor) {
            // Trigger format action in Monaco Editor
            this.editor.getAction('editor.action.formatDocument')?.run();
        }
    }

    onSubmit(): void {
        if (this.form.valid) {
            this.isLoading = true;
            const formData = this.form.value;

            this.databaseService.createDatabase(formData).subscribe({
                next: (response) => {
                    this.snackBar.open('Datenbank erfolgreich erstellt!', 'OK', { duration: 3000 });
                    this.dialogRef.close(response);
                },
                error: (error) => {
                    console.error('Error creating database:', error);
                    this.snackBar.open(
                        error.error?.message || 'Fehler beim Erstellen der Datenbank',
                        'OK',
                        { duration: 5000 }
                    );
                    this.isLoading = false;
                }
            });
        } else {
            this.snackBar.open('Bitte füllen Sie alle erforderlichen Felder aus.', 'OK', { duration: 3000 });
        }
    }

    onCancel(): void {
        this.dialogRef.close();
    }
}
