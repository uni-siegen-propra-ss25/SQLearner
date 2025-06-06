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
            await this.monacoEditorService.initMonaco();  // Make sure Monaco is initialized first
            
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
                    // Add explicit dimensions to ensure visibility
                    dimension: {
                        width: this.editorContainer.nativeElement.clientWidth,
                        height: this.editorContainer.nativeElement.clientHeight
                    }
                }
            );

            // Create a new model for the editor if it doesn't exist
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

            // Handle window resize
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

        // First priority: Check for table.column notation
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

        // Second priority: Check for SQL contexts where tables should be suggested
        const tableContextRegex = /(?:FROM|JOIN|UPDATE|INTO|TABLE|SELECT|WHERE|GROUP\s+BY|ORDER\s+BY|ON|SET|INSERT)\s+(?:\w+\s*,\s*)*(\w*)$/i;
        const tableMatch = lineUntilPosition.match(tableContextRegex);
        if (tableMatch) {
            return this.tables.map(table => ({
                label: table.name,
                kind: monaco.languages.CompletionItemKind.Class,
                insertText: table.name,  // No automatic dot
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

        // Third priority: Check for operator contexts
        if (/(?:WHERE|AND|OR|HAVING)\s+\w+\s+(\w*)$/i.test(lineUntilPosition)) {
            suggestions.push(
                ...['=', '<>', '>', '<', '>=', '<=', 'LIKE', 'IN', 'BETWEEN', 'IS NULL', 'IS NOT NULL']
                .map(op => ({
                    label: op,
                    kind: monaco.languages.CompletionItemKind.Operator,
                    insertText: op + ' ',
                    range
                }))
            );
        }

        // Fourth priority: Functions in SELECT context
        if (/SELECT\s+(?:\w+\s*,\s*)*(\w*)$/i.test(lineUntilPosition)) {
            suggestions.push(
                ...['COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'DISTINCT']
                .map(func => ({
                    label: func,
                    kind: monaco.languages.CompletionItemKind.Function,
                    insertText: func === 'DISTINCT' ? `${func} ` : `${func}()`,
                    range
                }))
            );
        }

        // Last priority: Keywords and Snippets if no other context matches
        if (suggestions.length === 0) {
            const keywords = this.getKeywords().map(keyword => ({
                label: keyword,
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: keyword + ' ',
                range
            }));
            suggestions.push(...keywords);

            const snippets = this.getSnippets().map(snippet => ({
                label: snippet.label,
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: snippet.insertText,
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: snippet.documentation,
                range
            }));
            suggestions.push(...snippets);
        }

        // Filter all suggestions by current word if one exists
        return currentWord
            ? suggestions.filter(s => 
                (typeof s.label === 'string' ? s.label : s.label.label)
                .toLowerCase()
                .startsWith(currentWord)
              )
            : suggestions;
    }

    private layout(): void {
        if (this.editor) {
            this.editor.layout();
        }
    }

    setTheme(theme: 'light' | 'dark'): void {
        this.theme = theme;
        if (this.editor) {
            this.editor.updateOptions({
                theme: theme === 'dark' ? 'sqlLearnerDark' : 'sqlLearnerLight'
            });
        }
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

    private getTableSuggestions(range: monaco.Range): monaco.languages.CompletionItem[] {
        return this.tables.map(table => ({
            label: table.name,
            kind: monaco.languages.CompletionItemKind.Class,
            insertText: table.name,  // No automatic dot
            range: range,
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
                    }),
                    '',
                    table.foreignKeys?.length ? [
                        'Foreign Keys:',
                        ...table.foreignKeys.map(fk => 
                            `- ${fk.column} → ${fk.references.table}.${fk.references.column}`
                        )
                    ].join('\n') : ''
                ].join('\n'),
                isTrusted: true
            }
        }));
    }

    private getColumnSuggestions(range: monaco.Range, afterDot: boolean, tableContext?: string): monaco.languages.CompletionItem[] {
        // Show table names without auto-dot
        return this.tables.map(table => ({
            label: table.name,
            kind: monaco.languages.CompletionItemKind.Class,
            insertText: table.name,  // No automatic dot
            range: range,
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
        }));
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
        if (!sql.trim()) return errors;

        const lowerSql = sql.toLowerCase().trim();
        const lines = sql.split('\n');
        const lastLine = lines[lines.length - 1];

        // Check for multiple SELECT statements
        const selectCount = (lowerSql.match(/\bselect\b/gi) || []).length;
        if (selectCount > 1) {
            errors.push({
                message: 'Mehrere SELECT-Statements sind nicht erlaubt. Bitte nur eine Abfrage pro Ausführung.',
                startLineNumber: 1,
                startColumn: 1,
                endLineNumber: lines.length,
                endColumn: lastLine.length,
                severity: monaco.MarkerSeverity.Error
            });
            return errors;
        }

        // Basic structure validation
        if (!lowerSql.startsWith('select')) {
            errors.push({
                message: 'Query muss mit SELECT beginnen',
                startLineNumber: 1,
                startColumn: 1,
                endLineNumber: 1,
                endColumn: Math.min(sql.length, 10),
                severity: monaco.MarkerSeverity.Error
            });
            // Don't continue validation if basic structure is wrong
            return errors;
        }

        // Extract tables from FROM and JOIN clauses (improved regex)
        const fromRegex = /\bfrom\s+([a-zA-Z_][a-zA-Z0-9_]*)(?:\s+(?:as\s+)?([a-zA-Z_][a-zA-Z0-9_]*))?\b/i;
        const joinRegex = /\bjoin\s+([a-zA-Z_][a-zA-Z0-9_]*)(?:\s+(?:as\s+)?([a-zA-Z_][a-zA-Z0-9_]*))?\b/gi;
        
        const fromMatch = lowerSql.match(fromRegex);
        
        // Check for required FROM clause with valid table name
        if (!fromMatch) {
            const fromKeywordPos = lowerSql.indexOf('from');
            if (fromKeywordPos === -1) {
                errors.push({
                    message: 'FROM Klausel fehlt',
                    startLineNumber: 1,
                    startColumn: 1,
                    endLineNumber: lines.length,
                    endColumn: lastLine.length,
                    severity: monaco.MarkerSeverity.Error
                });
            } else {
                // FROM exists but table name is missing or invalid
                errors.push({
                    message: 'Tabellenname nach FROM fehlt oder ist ungültig',
                    startLineNumber: this.getLineNumberForPosition(sql, fromKeywordPos),
                    startColumn: this.getColumnForPosition(sql, fromKeywordPos),
                    endLineNumber: this.getLineNumberForPosition(sql, fromKeywordPos + 4),
                    endColumn: this.getColumnForPosition(sql, fromKeywordPos + 4),
                    severity: monaco.MarkerSeverity.Error
                });
            }
            return errors;
        }
        
        const joinMatches = Array.from(lowerSql.matchAll(joinRegex));
        
        // Build a map of table aliases and their actual names
        const tableAliases = new Map<string, string>();
        
        if (fromMatch) {
            const [, tableName, alias] = fromMatch;
            tableAliases.set(alias?.toLowerCase() || tableName.toLowerCase(), tableName.toLowerCase());
            
            // Validate FROM table exists
            if (!this.tables.some(t => t.name.toLowerCase() === tableName.toLowerCase())) {
                const pos = sql.toLowerCase().indexOf(tableName.toLowerCase());
                errors.push({
                    message: `Tabelle "${tableName}" existiert nicht in der Datenbank`,
                    startLineNumber: this.getLineNumberForPosition(sql, pos),
                    startColumn: this.getColumnForPosition(sql, pos),
                    endLineNumber: this.getLineNumberForPosition(sql, pos + tableName.length),
                    endColumn: this.getColumnForPosition(sql, pos + tableName.length),
                    severity: monaco.MarkerSeverity.Error
                });
            }
        }
        
        // Process and validate JOIN clauses
        joinMatches.forEach(match => {
            const [fullMatch, tableName, alias] = match;
            tableAliases.set(alias?.toLowerCase() || tableName.toLowerCase(), tableName.toLowerCase());
            
            if (!this.tables.some(t => t.name.toLowerCase() === tableName.toLowerCase())) {
                const pos = sql.toLowerCase().indexOf(match[0].toLowerCase());
                errors.push({
                    message: `Tabelle "${tableName}" existiert nicht in der Datenbank`,
                    startLineNumber: this.getLineNumberForPosition(sql, pos + match[0].indexOf(tableName)),
                    startColumn: this.getColumnForPosition(sql, pos + match[0].indexOf(tableName)),
                    endLineNumber: this.getLineNumberForPosition(sql, pos + match[0].indexOf(tableName) + tableName.length),
                    endColumn: this.getColumnForPosition(sql, pos + match[0].indexOf(tableName) + tableName.length),
                    severity: monaco.MarkerSeverity.Error
                });
            }
        });

        // Check for missing ON clause in JOINs
        const hasJoinWithoutOn = /\bjoin\s+\w+(?!\s+on\b)/i.test(lowerSql);
        if (hasJoinWithoutOn) {
            const pos = sql.toLowerCase().indexOf('join');
            errors.push({
                message: 'JOIN benötigt eine ON Bedingung',
                startLineNumber: this.getLineNumberForPosition(sql, pos),
                startColumn: this.getColumnForPosition(sql, pos),
                endLineNumber: this.getLineNumberForPosition(sql, pos + 4),
                endColumn: this.getColumnForPosition(sql, pos + 4),
                severity: monaco.MarkerSeverity.Error
            });
        }

        // Validate all table.column references
        const tableColumnRegex = /([a-zA-Z_][a-zA-Z0-9_]*)\.([a-zA-Z_][a-zA-Z0-9_]*)/g;
        let match;
        while ((match = tableColumnRegex.exec(sql)) !== null) {
            const [fullMatch, referenceTableName, columnName] = match;
            const lowerTableName = referenceTableName.toLowerCase();
            
            if (!tableAliases.has(lowerTableName)) {
                errors.push({
                    message: `Tabelle oder Alias "${referenceTableName}" wird in der FROM/JOIN Klausel nicht verwendet`,
                    startLineNumber: this.getLineNumberForPosition(sql, match.index),
                    startColumn: this.getColumnForPosition(sql, match.index),
                    endLineNumber: this.getLineNumberForPosition(sql, match.index + referenceTableName.length),
                    endColumn: this.getColumnForPosition(sql, match.index + referenceTableName.length),
                    severity: monaco.MarkerSeverity.Error
                });
                continue;
            }

            const actualTableName = tableAliases.get(lowerTableName)!;
            const table = this.tables.find(t => t.name.toLowerCase() === actualTableName);
            
            if (!table) {
                errors.push({
                    message: `Tabelle "${actualTableName}" existiert nicht in der Datenbank`,
                    startLineNumber: this.getLineNumberForPosition(sql, match.index),
                    startColumn: this.getColumnForPosition(sql, match.index),
                    endLineNumber: this.getLineNumberForPosition(sql, match.index + referenceTableName.length),
                    endColumn: this.getColumnForPosition(sql, match.index + referenceTableName.length),
                    severity: monaco.MarkerSeverity.Error
                });
                continue;
            }

            if (!table.columns.some(c => c.name.toLowerCase() === columnName.toLowerCase())) {
                const columnStart = match.index + referenceTableName.length + 1;
                errors.push({
                    message: `Spalte "${columnName}" existiert nicht in Tabelle "${table.name}"`,
                    startLineNumber: this.getLineNumberForPosition(sql, columnStart),
                    startColumn: this.getColumnForPosition(sql, columnStart),
                    endLineNumber: this.getLineNumberForPosition(sql, columnStart + columnName.length),
                    endColumn: this.getColumnForPosition(sql, columnStart + columnName.length),
                    severity: monaco.MarkerSeverity.Error
                });
            }
        }

        // Check for missing semicolon
        if (!lowerSql.endsWith(';')) {
            errors.push({
                message: 'Query muss mit ; enden',
                startLineNumber: lines.length,
                startColumn: lastLine.length,
                endLineNumber: lines.length,
                endColumn: lastLine.length + 1,
                severity: monaco.MarkerSeverity.Warning
            });
        }

        return errors;
    }

    private getLineNumberForPosition(text: string, position: number): number {
        const textBefore = text.substring(0, position);
        return (textBefore.match(/\n/g) || []).length + 1;
    }

    private getColumnForPosition(text: string, position: number): number {
        const textBefore = text.substring(0, position);
        const lastNewline = textBefore.lastIndexOf('\n');
        return position - lastNewline;
    }

    private findColumnReferences(sql: string): Array<{ column: string, table: string, position: number }> {
        const references: Array<{ column: string, table: string, position: number }> = [];
        const lowerSql = sql.toLowerCase();

        // Check explicit table.column references
        const tableColumnRegex = /(\w+)\.(\w+)/g;
        let match;
        while ((match = tableColumnRegex.exec(sql)) !== null) {
            references.push({
                table: match[1],
                column: match[2],
                position: match.index + match[1].length + 1
            });
        }

        // Check columns in SELECT clause
        const selectMatch = lowerSql.match(/select\s+((?:(?!from)[^;])*)/i);
        if (selectMatch) {
            const selectClause = selectMatch[1];
            const fromMatch = lowerSql.match(/from\s+(\w+)/i);
            if (fromMatch) {
                const defaultTable = fromMatch[1];
                const columns = selectClause.split(',')
                    .map(col => col.trim())
                    .filter(col => !col.includes('.') && !this.isAggregateFunction(col));
                
                columns.forEach(col => {
                    const pos = sql.indexOf(col);
                    if (pos !== -1) {
                        references.push({
                            table: defaultTable,
                            column: col,
                            position: pos
                        });
                    }
                });
            }
        }

        return references;
    }

    private isAggregateFunction(text: string): boolean {
        const aggregateFunctions = ['count', 'sum', 'avg', 'min', 'max', 'distinct'];
        const lower = text.toLowerCase().trim();
        return aggregateFunctions.some(func => lower.startsWith(func + '('));
    }
}
