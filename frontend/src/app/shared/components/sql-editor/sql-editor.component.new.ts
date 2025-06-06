import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { editor } from 'monaco-editor';
import * as monaco from 'monaco-editor';
import { MonacoEditorService } from '../../services/monaco-editor.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface TableInfo {
    name: string;
    columns: ColumnInfo[];
    primaryKeys?: string[];
    foreignKeys?: Array<{
        column: string;
        references: {
            table: string;
            column: string;
        }
    }>;
}

export interface ColumnInfo {
    name: string;
    type: string;
    table: string;
    isPrimaryKey?: boolean;
    isForeignKey?: boolean;
    references?: {
        table: string;
        column: string;
    };
}

export interface ValidationError {
    message: string;
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
    severity: monaco.MarkerSeverity;
}

@Component({
    selector: 'app-sql-editor',
    template: '<div #editorContainer class="editor-container"></div>',
    styleUrls: ['./sql-editor.component.scss']
})
export class SqlEditorComponent implements OnInit, OnDestroy {
    @ViewChild('editorContainer', { static: true }) editorContainer!: ElementRef;
    @Input() initialValue = '';
    @Input() schema = '';
    @Input() theme: 'light' | 'dark' = 'light';
    @Output() valueChange = new EventEmitter<string>();
    @Output() editorReady = new EventEmitter<void>();

    private editor: editor.IStandaloneCodeEditor | null = null;
    private tables: TableInfo[] = [];
    private columns: ColumnInfo[] = [];
    private destroy$ = new Subject<void>();
    private editorInitialized = false;

    constructor(private monacoEditorService: MonacoEditorService) {}

    async ngOnInit() {
        await this.initEditor();
        if (this.schema) {
            this.parseSchema(this.schema);
        }
    }

    ngOnDestroy() {
        if (this.editor) {
            this.editor.dispose();
        }
        this.destroy$.next();
        this.destroy$.complete();
    }

    private async initEditor() {
        if (!this.editorContainer?.nativeElement) {
            console.error('Editor container element not found');
            return;
        }

        try {
            await this.monacoEditorService.initMonaco();
            
            this.editor = await this.monacoEditorService.createEditor(
                this.editorContainer.nativeElement,
                this.initialValue,
                {
                    automaticLayout: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    theme: this.theme === 'dark' ? 'sqlLearnerDark' : 'sqlLearnerLight',
                    fixedOverflowWidgets: true,
                    dimension: {
                        width: this.editorContainer.nativeElement.clientWidth,
                        height: this.editorContainer.nativeElement.clientHeight
                    }
                }
            );

            if (!this.editor.getModel()) {
                const model = monaco.editor.createModel(
                    this.initialValue,
                    'sql'
                );
                this.editor.setModel(model);
            }

            this.monacoEditorService.registerSqlLanguageFeatures(
                (word, range) => this.getSuggestions(word, range)
            );

            this.editor.onDidChangeModelContent(() => {
                const value = this.editor?.getValue() || '';
                this.valueChange.emit(value);
                this.updateEditorMarkers();
            });

            window.addEventListener('resize', () => this.layout());

            this.editorInitialized = true;
            this.editorReady.emit();

        } catch (error) {
            console.error('Failed to initialize SQL Editor:', error);
        }
    }

    private parseSchema(schemaSql: string): void {
        const lines = schemaSql.split('\n');
        let currentTable: TableInfo | null = null;

        const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["`]?(\w+)["`]?\s*\(/i;
        const columnRegex = /^\s*["`]?(\w+)["`]?\s+([\w()]+)(?:\s+|,|$)/i;

        for (const line of lines) {
            const createTableMatch = line.match(createTableRegex);
            if (createTableMatch) {
                const tableName = createTableMatch[1];
                currentTable = { name: tableName, columns: [] };
                this.tables.push(currentTable);
                continue;
            }

            if (currentTable && !line.includes(');')) {
                const columnMatch = line.match(columnRegex);
                if (columnMatch) {
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
        const model = this.editor?.getModel();
        if (!model) return suggestions;

        const lineUntilPosition = model.getLineContent(range.startLineNumber).substring(0, range.startColumn);
        const currentWord = word?.word.toLowerCase() || '';

        // Check for table.column notation first
        const dotMatch = lineUntilPosition.match(/(\w+)\.(\w*)$/);
        if (dotMatch) {
            const tableName = dotMatch[1];
            const partialColumn = dotMatch[2];
            const matchingTable = this.tables.find(t => t.name.toLowerCase() === tableName.toLowerCase());
            
            if (matchingTable) {
                return matchingTable.columns.map(col => ({
                    label: col.name,
                    kind: monaco.languages.CompletionItemKind.Field,
                    insertText: col.name,
                    range,
                    detail: `${col.type} in ${matchingTable.name}`,
                    documentation: {
                        value: [
                            `**Column: ${col.name}**`,
                            `Type: ${col.type}`,
                            `Table: ${matchingTable.name}`,
                            col.isPrimaryKey ? '\nPrimary Key' : '',
                            col.isForeignKey ? `\nForeign Key → ${col.references?.table}.${col.references?.column}` : ''
                        ].join('\n'),
                        isTrusted: true
                    }
                })).filter(s => 
                    !partialColumn || s.label.toLowerCase().startsWith(partialColumn.toLowerCase())
                );
            }
            return [];
        }

        // Detect context for showing tables
        const tableContextRegex = /(?:FROM|JOIN|UPDATE|INTO|TABLE|SELECT|WHERE|GROUP\s+BY|ORDER\s+BY|ON|SET)\s+(?:\w+\s*,\s*)*(\w*)$/i;
        const tableMatch = lineUntilPosition.match(tableContextRegex);
        if (tableMatch) {
            return this.tables.map(table => ({
                label: table.name,
                kind: monaco.languages.CompletionItemKind.Class,
                insertText: table.name + '.',  // Add dot automatically
                range,
                detail: `Table with ${table.columns.length} columns`,
                documentation: {
                    value: [
                        `**Table: ${table.name}**`,
                        '',
                        'Columns:',
                        ...table.columns.map(col => {
                            const tags = [];
                            if (col.isPrimaryKey) tags.push('PK');
                            if (col.isForeignKey) tags.push('FK');
                            const tagStr = tags.length ? ` (${tags.join(', ')})` : '';
                            return `- ${col.name}: ${col.type}${tagStr}`;
                        })
                    ].join('\n'),
                    isTrusted: true
                }
            })).filter(s => 
                !currentWord || s.label.toLowerCase().startsWith(currentWord)
            );
        }

        // SQL Keywords
        const keywords = this.getKeywords().map(keyword => ({
            label: keyword,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: keyword + ' ',
            range
        }));
        suggestions.push(...keywords);

        // SQL Functions
        if (/SELECT\s+(?:\w+\s*,\s*)*(\w*)$/i.test(lineUntilPosition)) {
            const functions = ['COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'DISTINCT'].map(func => ({
                label: func,
                kind: monaco.languages.CompletionItemKind.Function,
                insertText: func === 'DISTINCT' ? `${func} ` : `${func}()`,
                range
            }));
            suggestions.push(...functions);
        }

        // Operators
        if (/(?:WHERE|AND|OR|HAVING)\s+\w+\s+(\w*)$/i.test(lineUntilPosition)) {
            const operators = ['=', '<>', '>', '<', '>=', '<=', 'LIKE', 'IN', 'BETWEEN', 'IS NULL', 'IS NOT NULL']
                .map(op => ({
                    label: op,
                    kind: monaco.languages.CompletionItemKind.Operator,
                    insertText: op + ' ',
                    range
                }));
            suggestions.push(...operators);
        }

        // Snippets
        const snippets = this.getSnippets().map(snippet => ({
            label: snippet.label,
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: snippet.insertText,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: snippet.documentation,
            range
        }));
        suggestions.push(...snippets);

        return currentWord
            ? suggestions.filter(s => 
                (typeof s.label === 'string' ? s.label : s.label.label)
                .toLowerCase()
                .startsWith(currentWord)
              )
            : suggestions;
    }

    private getKeywords(): string[] {
        return [
            'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'HAVING',
            'JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL OUTER JOIN',
            'ON', 'AND', 'OR', 'NOT', 'IN', 'EXISTS', 'LIKE', 'BETWEEN',
            'DESC', 'ASC', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX',
            'UNION', 'UNION ALL', 'INTERSECT', 'EXCEPT'
        ];
    }

    private getSnippets(): { label: string; insertText: string; documentation: string }[] {
        return [
            {
                label: 'sel-all',
                insertText: 'SELECT *\nFROM ${1:table}\nWHERE ${2:condition};',
                documentation: 'Select all columns with condition'
            },
            {
                label: 'sel-cols',
                insertText: 'SELECT ${1:columns}\nFROM ${2:table}\nWHERE ${3:condition};',
                documentation: 'Select specific columns with condition'
            },
            {
                label: 'inner-join',
                insertText: 'SELECT ${1:columns}\nFROM ${2:table1} t1\nINNER JOIN ${3:table2} t2 ON ${4:t1.id = t2.id};',
                documentation: 'Inner join template'
            },
            {
                label: 'group-by',
                insertText: 'SELECT ${1:columns}, COUNT(*) as count\nFROM ${2:table}\nGROUP BY ${1:columns}\nHAVING COUNT(*) ${3:condition};',
                documentation: 'Group by with having clause'
            }
        ];
    }

    private updateEditorMarkers(): void {
        if (!this.editor) return;

        const model = this.editor.getModel();
        if (!model) return;

        const errors = this.validateSql(this.editor.getValue());
        
        monaco.editor.setModelMarkers(model, 'sql', errors.map(error => ({
            message: error.message,
            severity: error.severity,
            startLineNumber: error.startLineNumber,
            startColumn: error.startColumn,
            endLineNumber: error.endLineNumber,
            endColumn: error.endColumn
        })));
    }

    private validateSql(sql: string): ValidationError[] {
        const errors: ValidationError[] = [];
        if (!sql.trim().toLowerCase().startsWith('select')) {
            errors.push({
                message: 'Query must start with SELECT',
                startLineNumber: 1,
                startColumn: 1,
                endLineNumber: 1,
                endColumn: 2,
                severity: monaco.MarkerSeverity.Error
            });
        }
        return errors;
    }

    getValue(): string {
        return this.editor?.getValue() || '';
    }

    setValue(value: string): void {
        if (!this.editor) return;
        
        const currentValue = this.editor.getValue();
        if (currentValue !== value) {
            this.editor.setValue(value);
        }
    }

    setTheme(isDark: boolean): void {
        this.theme = isDark ? 'dark' : 'light';
        this.monacoEditorService.setTheme(isDark);
    }

    focus(): void {
        if (!this.editor) return;
        this.editor.focus();
    }

    layout(): void {
        if (!this.editor) return;
        this.editor.layout();
    }
}
