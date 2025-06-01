import { Component, Input, ElementRef, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { Exercise } from '../../../roadmap/models/exercise.model';
import { SubmissionService } from '../../services/submission.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import loader from '@monaco-editor/loader';
import * as monaco from 'monaco-editor';
import { editor } from 'monaco-editor';

interface TableInfo {
    name: string;
    columns: ColumnInfo[];
}

interface ColumnInfo {
    name: string;
    type: string;
    table: string;
}

interface ValidationError {
    message: string;
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
    severity: monaco.MarkerSeverity;
}

@Component({
    selector: 'app-query-exercise',
    templateUrl: './query-exercise.component.html',
    styleUrls: ['./query-exercise.component.scss'],
})
export class QueryExerciseComponent implements OnInit, OnDestroy {
    @Input() exercise!: Exercise;
    @ViewChild('editorContainer', { static: true }) editorContainer!: ElementRef;
    
    private editor: editor.IStandaloneCodeEditor | null = null;
    private tables: TableInfo[] = [];
    private columns: ColumnInfo[] = [];
    sqlQuery = '';
    queryResult: any = null;
    isLoading = false;
    showFeedback = false;
    feedback: string | null = null;
    currentView: 'schema' | 'result' = 'result';

    // Pagination variables
    pageSize = 10;
    pageSizeOptions = [5, 10, 25, 100];
    pageIndex = 0;
    
    constructor(
        private submissionService: SubmissionService,
        private snackBar: MatSnackBar,
    ) {}

    ngOnInit() {
        this.initMonacoEditor();
    }

    ngOnDestroy() {
        if (this.editor) {
            this.editor.dispose();
        }
    }

    private parseSchema(schemaSql: string): void {
        const lines = schemaSql.split('\n');
        let currentTable: TableInfo | null = null;

        // Regex für CREATE TABLE statements
        const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["`]?(\w+)["`]?\s*\(/i;
        // Regex für Spalten-Definitionen
        const columnRegex = /^\s*["`]?(\w+)["`]?\s+([\w()]+)(?:\s+|,|$)/i;

        for (const line of lines) {
            const createTableMatch = line.match(createTableRegex);
            if (createTableMatch) {
                // Neue Tabelle gefunden
                const tableName = createTableMatch[1];
                currentTable = { name: tableName, columns: [] };
                this.tables.push(currentTable);
                continue;
            }

            if (currentTable && !line.includes(');')) {
                const columnMatch = line.match(columnRegex);
                if (columnMatch) {
                    // Neue Spalte gefunden
                    const columnName = columnMatch[1];
                    const columnType = columnMatch[2];
                    const columnInfo: ColumnInfo = {
                        name: columnName,
                        type: columnType,
                        table: currentTable.name
                    };
                    currentTable.columns.push(columnInfo);
                    this.columns.push(columnInfo);
                }
            }

            if (line.includes(');')) {
                currentTable = null;
            }
        }
    }

    private getSuggestions(word: editor.IWordAtPosition, range: monaco.Range): monaco.languages.CompletionItem[] {
        const suggestions: monaco.languages.CompletionItem[] = [];
        const lineUntilPosition = this.editor?.getModel()?.getLineContent(range.startLineNumber).substring(0, range.startColumn) || '';
        
        // Standard SQL Keywords
        const keywords = [
            { label: 'SELECT', insertText: 'SELECT ' },
            { label: 'FROM', insertText: 'FROM ' },
            { label: 'WHERE', insertText: 'WHERE ' },
            { label: 'GROUP BY', insertText: 'GROUP BY ' },
            { label: 'ORDER BY', insertText: 'ORDER BY ' },
            { label: 'HAVING', insertText: 'HAVING ' },
            { label: 'JOIN', insertText: 'JOIN ' },
            { label: 'INNER JOIN', insertText: 'INNER JOIN ' },
            { label: 'LEFT JOIN', insertText: 'LEFT JOIN ' },
            { label: 'RIGHT JOIN', insertText: 'RIGHT JOIN ' },
            { label: 'ON', insertText: 'ON ' },
            { label: 'AS', insertText: 'AS ' },
            { label: 'AND', insertText: 'AND ' },
            { label: 'OR', insertText: 'OR ' },
            { label: 'IN', insertText: 'IN ' },
            { label: 'NOT', insertText: 'NOT ' },
            { label: 'LIKE', insertText: 'LIKE ' },
            { label: 'DESC', insertText: 'DESC' },
            { label: 'ASC', insertText: 'ASC' },
            { label: 'COUNT', insertText: 'COUNT(' },
            { label: 'SUM', insertText: 'SUM(' },
            { label: 'AVG', insertText: 'AVG(' },
            { label: 'MIN', insertText: 'MIN(' },
            { label: 'MAX', insertText: 'MAX(' },
            { label: 'DISTINCT', insertText: 'DISTINCT ' }
        ];

        // Füge Keywords hinzu
        keywords.forEach(keyword => {
            suggestions.push({
                label: keyword.label,
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: keyword.insertText,
                range: range
            });
        });

        // Prüfe den Kontext für spezifische Vorschläge
        const afterFrom = /FROM\s+$/i.test(lineUntilPosition);
        const afterJoin = /JOIN\s+$/i.test(lineUntilPosition);
        const afterSelect = /SELECT\s+$/i.test(lineUntilPosition);
        const inWhere = /WHERE\s+.*$/i.test(lineUntilPosition);
        const afterDot = /\.$/i.test(lineUntilPosition);

        // Extrahiere den Tabellennamen vor dem Punkt
        let tableContext: string | undefined;
        if (afterDot) {
            const beforeDot = lineUntilPosition.slice(0, -1).trim();
            tableContext = beforeDot.split(/\s+/).pop();
        }

        // Füge Tabellennamen hinzu
        if (afterFrom || afterJoin) {
            this.tables.forEach(table => {
                suggestions.push({
                    label: table.name,
                    kind: monaco.languages.CompletionItemKind.Class,
                    insertText: table.name,
                    range: range,
                    detail: `Table mit ${table.columns.length} Spalten`,
                    documentation: table.columns.map(col => `${col.name} (${col.type})`).join('\n')
                });
            });
        }

        // Füge Spaltennamen hinzu
        if (afterSelect || inWhere || afterDot) {
            // Wenn wir nach einem Punkt sind, zeige nur Spalten der spezifischen Tabelle
            const relevantColumns = afterDot && tableContext
                ? this.columns.filter(col => col.table === tableContext)
                : this.columns;

            relevantColumns.forEach(column => {
                suggestions.push({
                    label: afterDot ? column.name : `${column.table}.${column.name}`,
                    kind: monaco.languages.CompletionItemKind.Field,
                    insertText: afterDot ? column.name : `${column.table}.${column.name}`,
                    range: range,
                    detail: `${column.type} in ${column.table}`,
                });
            });
        }

        return suggestions;
    }

    private validateSql(sql: string): ValidationError[] {
        const errors: ValidationError[] = [];
        const tokens = this.tokenizeSQL(sql);
        
        // Validiere grundlegende SQL-Syntax
        const syntaxErrors = this.validateSQLSyntax(tokens);
        errors.push(...syntaxErrors);

        // Validiere Tabellen- und Spaltennamen
        const referenceErrors = this.validateReferences(tokens);
        errors.push(...referenceErrors);

        // Validiere Datentypen in Vergleichen
        const typeErrors = this.validateTypes(tokens);
        errors.push(...typeErrors);

        return errors;
    }

    private tokenizeSQL(sql: string): { type: string; value: string; line: number; column: number }[] {
        const tokens: { type: string; value: string; line: number; column: number }[] = [];
        const lines = sql.split('\n');
        let currentToken = '';
        let inString = false;
        let stringChar = '';

        lines.forEach((line, lineNum) => {
            let column = 0;
            while (column < line.length) {
                const char = line[column];

                if (inString) {
                    if (char === stringChar) {
                        inString = false;
                        tokens.push({ type: 'string', value: currentToken + char, line: lineNum + 1, column: column - currentToken.length });
                        currentToken = '';
                    } else {
                        currentToken += char;
                    }
                } else if (char === '"' || char === "'") {
                    inString = true;
                    stringChar = char;
                    currentToken = char;
                } else if (/\s/.test(char)) {
                    if (currentToken) {
                        tokens.push({ 
                            type: this.getTokenType(currentToken), 
                            value: currentToken,
                            line: lineNum + 1,
                            column: column - currentToken.length
                        });
                        currentToken = '';
                    }
                } else if ('(),=<>!'.includes(char)) {
                    if (currentToken) {
                        tokens.push({ 
                            type: this.getTokenType(currentToken), 
                            value: currentToken,
                            line: lineNum + 1,
                            column: column - currentToken.length
                        });
                        currentToken = '';
                    }
                    tokens.push({ type: 'operator', value: char, line: lineNum + 1, column });
                } else {
                    currentToken += char;
                }
                column++;
            }
            if (currentToken) {
                tokens.push({ 
                    type: this.getTokenType(currentToken), 
                    value: currentToken,
                    line: lineNum + 1,
                    column: line.length - currentToken.length
                });
                currentToken = '';
            }
        });

        return tokens;
    }

    private getTokenType(token: string): string {
        const upperToken = token.toUpperCase();
        if (['SELECT', 'FROM', 'WHERE', 'GROUP', 'BY', 'HAVING', 'ORDER', 'JOIN', 'ON', 'AND', 'OR', 'IN', 'LIKE'].includes(upperToken)) {
            return 'keyword';
        }
        if (/^\d+$/.test(token)) {
            return 'number';
        }
        return 'identifier';
    }

    private validateSQLSyntax(tokens: { type: string; value: string; line: number; column: number }[]): ValidationError[] {
        const errors: ValidationError[] = [];
        let hasSelect = false;
        let hasFrom = false;
        let lastKeyword = '';

        tokens.forEach((token, index) => {
            if (token.type === 'keyword') {
                const value = token.value.toUpperCase();
                
                if (value === 'SELECT') hasSelect = true;
                if (value === 'FROM') hasFrom = true;

                // Prüfe Keyword-Reihenfolge
                if (value === 'WHERE' && !hasFrom) {
                    errors.push({
                        message: 'WHERE clause must come after FROM',
                        startLineNumber: token.line,
                        startColumn: token.column,
                        endLineNumber: token.line,
                        endColumn: token.column + token.value.length,
                        severity: monaco.MarkerSeverity.Error
                    });
                }

                // Prüfe aufeinanderfolgende Keywords
                if (lastKeyword && !this.isValidKeywordSequence(lastKeyword, value)) {
                    errors.push({
                        message: `Invalid keyword sequence: ${lastKeyword} followed by ${value}`,
                        startLineNumber: token.line,
                        startColumn: token.column,
                        endLineNumber: token.line,
                        endColumn: token.column + token.value.length,
                        severity: monaco.MarkerSeverity.Error
                    });
                }

                lastKeyword = value;
            }
        });

        if (!hasSelect) {
            errors.push({
                message: 'Query must start with SELECT',
                startLineNumber: 1,
                startColumn: 1,
                endLineNumber: 1,
                endColumn: 2,
                severity: monaco.MarkerSeverity.Error
            });
        }

        if (!hasFrom && hasSelect) {
            errors.push({
                message: 'SELECT must be followed by FROM clause',
                startLineNumber: 1,
                startColumn: 1,
                endLineNumber: 1,
                endColumn: 7,
                severity: monaco.MarkerSeverity.Error
            });
        }

        return errors;
    }

    private validateReferences(tokens: { type: string; value: string; line: number; column: number }[]): ValidationError[] {
        const errors: ValidationError[] = [];
        let currentTable: string | null = null;
        let isSelectClause = false;
        let isFromClause = false;

        tokens.forEach((token, index) => {
            if (token.type === 'keyword') {
                const value = token.value.toUpperCase();
                isSelectClause = value === 'SELECT';
                isFromClause = value === 'FROM';
                if (isFromClause) {
                    // Nächstes Token sollte eine valide Tabelle sein
                    const nextToken = tokens[index + 1];
                    if (nextToken && nextToken.type === 'identifier') {
                        const table = this.tables.find(t => t.name.toLowerCase() === nextToken.value.toLowerCase());
                        if (!table) {
                            errors.push({
                                message: `Table "${nextToken.value}" does not exist`,
                                startLineNumber: nextToken.line,
                                startColumn: nextToken.column,
                                endLineNumber: nextToken.line,
                                endColumn: nextToken.column + nextToken.value.length,
                                severity: monaco.MarkerSeverity.Error
                            });
                        } else {
                            currentTable = table.name;
                        }
                    }
                }
            } else if (token.type === 'identifier') {
                if (isSelectClause || token.value.includes('.')) {
                    const [tableName, columnName] = token.value.includes('.') ? 
                        token.value.split('.') : 
                        [currentTable, token.value];

                    if (tableName) {
                        const table = this.tables.find(t => t.name.toLowerCase() === tableName.toLowerCase());
                        if (!table) {
                            errors.push({
                                message: `Table "${tableName}" does not exist`,
                                startLineNumber: token.line,
                                startColumn: token.column,
                                endLineNumber: token.line,
                                endColumn: token.column + tableName.length,
                                severity: monaco.MarkerSeverity.Error
                            });
                        } else if (columnName) {
                            const column = table.columns.find(c => c.name.toLowerCase() === columnName.toLowerCase());
                            if (!column) {
                                errors.push({
                                    message: `Column "${columnName}" does not exist in table "${tableName}"`,
                                    startLineNumber: token.line,
                                    startColumn: token.column + (token.value.includes('.') ? tableName.length + 1 : 0),
                                    endLineNumber: token.line,
                                    endColumn: token.column + token.value.length,
                                    severity: monaco.MarkerSeverity.Error
                                });
                            }
                        }
                    }
                }
            }
        });

        return errors;
    }

    private validateTypes(tokens: { type: string; value: string; line: number; column: number }[]): ValidationError[] {
        const errors: ValidationError[] = [];
        let lastColumn: ColumnInfo | null = null;
        let expectingValue = false;

        tokens.forEach((token, index) => {
            if (token.type === 'identifier' && token.value.includes('.')) {
                const [tableName, columnName] = token.value.split('.');
                const table = this.tables.find(t => t.name.toLowerCase() === tableName.toLowerCase());
                if (table) {
                    const column = table.columns.find(c => c.name.toLowerCase() === columnName.toLowerCase());
                    if (column) {
                        lastColumn = column;
                    }
                }
            } else if (token.type === 'operator' && ['=', '<', '>', '<=', '>=', '!='].includes(token.value)) {
                expectingValue = true;
            } else if (expectingValue && lastColumn) {
                const valueType = this.getValueType(token);
                if (!this.areTypesCompatible(lastColumn.type, valueType)) {
                    errors.push({
                        message: `Type mismatch: Cannot compare ${lastColumn.type} with ${valueType}`,
                        startLineNumber: token.line,
                        startColumn: token.column,
                        endLineNumber: token.line,
                        endColumn: token.column + token.value.length,
                        severity: monaco.MarkerSeverity.Error
                    });
                }
                expectingValue = false;
                lastColumn = null;
            }
        });

        return errors;
    }

    private isValidKeywordSequence(first: string, second: string): boolean {
        const validSequences: { [key: string]: string[] } = {
            'SELECT': ['FROM', 'DISTINCT'],
            'FROM': ['WHERE', 'JOIN', 'GROUP', 'ORDER'],
            'WHERE': ['AND', 'OR', 'GROUP', 'ORDER'],
            'GROUP': ['BY'],
            'ORDER': ['BY'],
            'JOIN': ['ON'],
            'AND': ['NOT'],
            'OR': ['NOT'],
        };

        return !validSequences[first] || validSequences[first].includes(second);
    }

    private getValueType(token: { type: string; value: string }): string {
        if (token.type === 'number') return 'number';
        if (token.type === 'string') return 'string';
        if (token.value.toLowerCase() === 'null') return 'null';
        if (['true', 'false'].includes(token.value.toLowerCase())) return 'boolean';
        return 'unknown';
    }

    private areTypesCompatible(columnType: string, valueType: string): boolean {
        const numericTypes = ['int', 'integer', 'number', 'decimal', 'float', 'double'];
        const stringTypes = ['varchar', 'text', 'char', 'string'];
        const dateTypes = ['date', 'datetime', 'timestamp'];

        columnType = columnType.toLowerCase();
        valueType = valueType.toLowerCase();

        if (valueType === 'null') return true; // NULL kann mit allem verglichen werden
        if (numericTypes.some(t => columnType.includes(t))) return valueType === 'number';
        if (stringTypes.some(t => columnType.includes(t))) return valueType === 'string';
        if (dateTypes.some(t => columnType.includes(t))) return valueType === 'string';
        
        return columnType === valueType;
    }

    private updateEditorMarkers(): void {
        if (!this.editor) return;

        const model = this.editor.getModel();
        if (!model) return;

        const errors = this.validateSql(this.sqlQuery);
        
        monaco.editor.setModelMarkers(model, 'sql', errors.map(error => ({
            message: error.message,
            severity: error.severity,
            startLineNumber: error.startLineNumber,
            startColumn: error.startColumn,
            endLineNumber: error.endLineNumber,
            endColumn: error.endColumn
        })));
    }

    private async initMonacoEditor() {
        try {
            await loader.init();
            
            const editorOptions: editor.IStandaloneEditorConstructionOptions = {
                value: this.sqlQuery,
                language: 'sql',
                theme: 'vs-light',
                minimap: { enabled: false },
                automaticLayout: true,
                scrollBeyondLastLine: false,
                lineNumbers: 'on',
                roundedSelection: true,
                contextmenu: true,
                fontSize: 14,
                quickSuggestions: true,
                fixedOverflowWidgets: true,
            };

            this.editor = monaco.editor.create(this.editorContainer.nativeElement, editorOptions);

            // Update sqlQuery and validate when editor content changes
            this.editor.onDidChangeModelContent(() => {
                this.sqlQuery = this.editor?.getValue() || '';
                this.updateEditorMarkers();
            });

            // Parse database schema if available
            if (this.exercise.database?.schemaSql) {
                this.parseSchema(this.exercise.database.schemaSql);
            }

            // Add SQL specific configurations
            monaco.languages.registerCompletionItemProvider('sql', {
                provideCompletionItems: (model, position) => {
                    const word = model.getWordUntilPosition(position);
                    const range = new monaco.Range(
                        position.lineNumber,
                        word.startColumn,
                        position.lineNumber,
                        word.endColumn
                    );

                    const suggestions = this.getSuggestions(word, range);
                    return { suggestions };
                },
                triggerCharacters: [' ', '.', ',']
            });

        } catch (error) {
            console.error('Failed to initialize Monaco Editor:', error);
        }
    }

    runQuery(): void {
        if (!this.sqlQuery.trim()) return;

        this.isLoading = true;
        this.submissionService.runQuery(this.exercise.id, this.sqlQuery).subscribe({
            next: (result) => {
                this.queryResult = result;
                this.isLoading = false;
                this.currentView = 'result';
            },
            error: (error) => {
                this.isLoading = false;
                this.queryResult = null;
                const errorMessage = error.error?.detail || error.error?.message || error.message || 'Failed to run query';
                this.snackBar.open(errorMessage, 'Close', {
                    duration: 5000,
                    panelClass: ['error-snackbar']
                });
            },
        });
    }

    submitQuery(): void {
        if (!this.sqlQuery.trim()) return;

        this.isLoading = true;
        this.submissionService.submitAnswer(this.exercise.id, this.sqlQuery).subscribe({
            next: (submission) => {
                this.isLoading = false;
                this.snackBar.open('Answer submitted successfully', 'Close', { duration: 3000 });

                if (submission.id) {
                    this.loadFeedback(submission.id);
                }
            },
            error: (error) => {
                this.isLoading = false;
                this.snackBar.open(error.message || 'Failed to submit answer', 'Close', {
                    duration: 3000,
                });
            },
        });
    }

    private loadFeedback(submissionId: number): void {
        this.submissionService.getFeedback(submissionId).subscribe({
            next: (feedback) => {
                this.feedback = feedback;
                this.showFeedback = true;
            },
            error: () => {
                this.feedback = 'Feedback is being generated...';
            },
        });
    }

    toggleFeedback(): void {
        this.showFeedback = !this.showFeedback;
    }

    onPageChange(e: any): void {
        this.pageIndex = e.pageIndex;
        this.pageSize = e.pageSize;
    }

    get paginatedRows(): any[] {
        if (!this.queryResult?.rows) return [];
        const start = this.pageIndex * this.pageSize;
        return this.queryResult.rows.slice(start, start + this.pageSize);
    }
}
