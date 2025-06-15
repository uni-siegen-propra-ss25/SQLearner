import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { QueryResult } from '../../services/database.service';

@Component({
    selector: 'app-er-diagram',
    template: `
        <div class="er-diagram-container">
            <div class="mermaid" [attr.data-processed]="isProcessed">
                {{ diagramDefinition }}
            </div>
        </div>
    `,
    styles: [`
        .er-diagram-container {
            margin: 20px 0;
            padding: 20px;
            background: #fff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        :host-context(.dark-theme) .er-diagram-container {
            background: #2d2d2d;
        }
    `]
})
export class ErDiagramComponent implements OnInit, OnChanges {
    @Input() queryResult: QueryResult | null = null;
    diagramDefinition: string = '';
    isProcessed: boolean = false;

    ngOnInit() {
        // Initialize mermaid
        (window as any).mermaid?.initialize({
            startOnLoad: true,
            theme: 'default',
            securityLevel: 'loose',
            er: {
                diagramPadding: 20,
                layoutDirection: 'TB',
                minEntityWidth: 100,
                minEntityHeight: 75,
                entityPadding: 15,
                stroke: 'gray',
                fill: 'honeydew',
                fontSize: 12
            }
        });
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['queryResult'] && this.queryResult) {
            this.generateDiagram();
        }
    }

    private generateDiagram() {
        if (!this.queryResult?.columns || !this.queryResult?.rows) {
            this.diagramDefinition = '';
            return;
        }

        // Start with ER diagram definition
        let diagram = 'erDiagram\n';
        
        // Get unique table names from the query result
        const tableNames = this.extractTableNames(this.queryResult);
        
        // For each table, create an entity definition
        tableNames.forEach(tableName => {
            diagram += `    ${tableName} {\n`;
            
            // Add only columns that belong to this table
            this.queryResult!.columns
                .filter(column => column.startsWith(`${tableName}.`))
                .forEach(column => {
                    const columnName = column.split('.')[1]; // Get the actual column name
                    const type = this.inferColumnType(this.queryResult!.rows, column);
                    diagram += `        ${type} ${columnName}\n`;
                });
            
            diagram += '    }\n';
        });

        // Add relationships if we can infer them
        const relationships = this.inferRelationships(this.queryResult);
        relationships.forEach(rel => {
            diagram += `    ${rel.from} }o--|| ${rel.to} : "${rel.label}"\n`;
        });

        this.diagramDefinition = diagram;
        this.isProcessed = false;
        
        // Force mermaid to reprocess the diagram
        setTimeout(() => {
            (window as any).mermaid?.contentLoaded();
            this.isProcessed = true;
        });
    }

    private extractTableNames(result: QueryResult): string[] {
        // Try to extract table names from column names
        // This is a simple implementation - you might want to enhance it
        const tableNames = new Set<string>();
        result.columns.forEach(column => {
            const parts = column.split('.');
            if (parts.length > 1) {
                tableNames.add(parts[0]);
            }
        });
        return Array.from(tableNames);
    }

    private inferColumnType(rows: Record<string, any>[], column: string): string {
        if (rows.length === 0) return 'string';
        
        const value = rows[0][column.split('.')[1]]; // Use only column name without table prefix
        if (value === null || value === undefined) return 'string';
        
        if (typeof value === 'number') {
            return Number.isInteger(value) ? 'int' : 'float';
        }
        if (typeof value === 'boolean') return 'boolean';
        if (value instanceof Date) return 'date';
        return 'string';
    }

    private inferRelationships(result: QueryResult): Array<{from: string, to: string, label: string}> {
        // This is a simple implementation - you might want to enhance it
        const relationships: Array<{from: string, to: string, label: string}> = [];
        const tableNames = this.extractTableNames(result);
        
        // Look for foreign key patterns in column names
        result.columns.forEach(column => {
            if (column.toLowerCase().endsWith('_id')) {
                const parts = column.split('.');
                if (parts.length > 1) {
                    const tableName = parts[0];
                    const referencedTable = column.replace('_id', '').split('.')[0];
                    if (tableNames.includes(referencedTable)) {
                        relationships.push({
                            from: tableName,
                            to: referencedTable,
                            label: 'references'
                        });
                    }
                }
            }
        });
        
        return relationships;
    }
}