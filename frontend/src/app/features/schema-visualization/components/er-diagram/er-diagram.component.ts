import { Component, Inject, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * Data structure representing a column in a table for DBML parsing and visualization.
 * @property {string} name - The name of the column.
 * @property {string} type - The SQL data type of the column.
 * @property {boolean} isPrimaryKey - Whether the column is a primary key.
 * @property {boolean} isForeignKey - Whether the column is a foreign key.
 * @property {boolean} isUnique - Whether the column has a unique constraint.
 * @property {object} references - Foreign key reference information (if isForeignKey is true).
 */
interface TableColumn {
    name: string;
    type: string;
    isPrimaryKey: boolean;
    isForeignKey: boolean;
    isUnique: boolean;
    references?: {
        table: string;
        column: string;
    };
}

/**
 * Data structure representing a table parsed from DBML.
 * @property {string} name - The name of the table.
 * @property {TableColumn[]} columns - Array of columns in the table.
 */
interface DbmlTable {
    name: string;
    columns: TableColumn[];
}

/**
 * Data structure representing a relationship parsed from DBML.
 * @property {string} fromTable - Name of the source table.
 * @property {string | string[]} fromColumn - Name(s) of the source column(s). Single column as string, multi-column as array.
 * @property {string} toTable - Name of the target table.
 * @property {string | string[]} toColumn - Name(s) of the target column(s). Single column as string, multi-column as array.
 */
interface DbmlRelationship {
    fromTable: string;
    fromColumn: string | string[];
    toTable: string;
    toColumn: string | string[];
}

/**
 * Data passed to the ER diagram dialog component.
 * @property {string} dbmlCode - The DBML code to visualize.
 * @property {string} [databaseName] - Optional name of the database.
 */
interface ERDiagramDialogData {
    dbmlCode: string;
    databaseName?: string;
}

/**
 * Component for visualizing an ER diagram from DBML code.
 * Parses DBML and generates a simple HTML-based visualization of tables and relationships.
 */
@Component({
    selector: 'app-er-diagram',
    templateUrl: './er-diagram.component.html',
    styleUrls: ['./er-diagram.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class ErDiagramComponent implements OnInit, OnDestroy {
    diagramHtml: SafeHtml | null = null;
    parsedTables: DbmlTable[] = [];
    parsedRelationships: DbmlRelationship[] = [];

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: ERDiagramDialogData,
        private dialogRef: MatDialogRef<ErDiagramComponent>,
        private sanitizer: DomSanitizer,
    ) {}

    /**
     * Lifecycle hook for component initialization. Generates the diagram on load.
     */
    ngOnInit(): void {
        this.generateDiagram();
    }

    /**
     * Lifecycle hook for component destruction. Used for cleanup if needed.
     */
    ngOnDestroy(): void {
        // Cleanup if needed
    }

    /**
     * Generates the ER diagram from the provided DBML code.
     * Parses DBML and sets the parsed data for template rendering.
     */
    private async generateDiagram(): Promise<void> {
        try {
            console.log('🎨 [AUDIT] Frontend - generateDiagram():');
            console.log('   Input Data:', this.data);
            console.log('   DBML Code Length:', this.data.dbmlCode?.length || 0);
            console.log('   Database Name:', this.data.databaseName || 'None');

            if (!this.data.dbmlCode || this.data.dbmlCode.trim() === '') {
                console.warn('❌ No DBML code provided');
                return;
            }

            console.log('📋 DBML Code Preview:', this.data.dbmlCode.substring(0, 200) + '...');

            // Parse DBML code into structured data for template rendering
            this.parsedTables = this.parseDbmlTables(this.data.dbmlCode);
            this.parsedRelationships = this.parseDbmlRelationships(this.data.dbmlCode);

            // Map FK references from relationships to columns
            this.mapForeignKeyReferences();

            console.log('✅ [AUDIT] Parsing Complete:');
            console.log('   Parsed Tables Count:', this.parsedTables.length);
            console.log('   Parsed Relationships Count:', this.parsedRelationships.length);

            // Detailed table logging
            this.parsedTables.forEach((table, index) => {
                console.log(`   📊 Table ${index + 1}: ${table.name}`);
                console.log(
                    `      Columns (${table.columns.length}):`,
                    table.columns.map((c) => ({
                        name: c.name,
                        type: c.type,
                        pk: c.isPrimaryKey,
                        fk: c.isForeignKey,
                        unique: c.isUnique,
                        references: c.references,
                    })),
                );
            });

            // Detailed relationship logging
            this.parsedRelationships.forEach((rel, index) => {
                console.log(
                    `   🔗 Relationship ${index + 1}: ${rel.fromTable}.${rel.fromColumn} -> ${rel.toTable}.${rel.toColumn}`,
                );
            });

            // No longer generate HTML content - use Angular template instead
            this.diagramHtml = null;
        } catch (error) {
            console.error('Error generating ER diagram:', error);
        }
    }

    /**
     * Maps foreign key references from relationships to table columns.
     * This complements the inline FK references parsed from DBML columns.
     */
    private mapForeignKeyReferences(): void {
        this.parsedRelationships.forEach((relationship) => {
            // Einzelspalten-FK wie gehabt
            if (
                typeof relationship.fromColumn === 'string' &&
                typeof relationship.toColumn === 'string'
            ) {
                const sourceTable = this.parsedTables.find(
                    (t) => t.name === relationship.fromTable,
                );
                if (sourceTable) {
                    const sourceColumn = sourceTable.columns.find(
                        (c) => c.name === relationship.fromColumn,
                    );
                    if (sourceColumn) {
                        if (!sourceColumn.isForeignKey) {
                            sourceColumn.isForeignKey = true;
                        }
                        if (!sourceColumn.references) {
                            sourceColumn.references = {
                                table: relationship.toTable,
                                column: relationship.toColumn,
                            };
                        }
                        console.log(
                            `🔗 Mapped FK reference: ${relationship.fromTable}.${relationship.fromColumn} → ${relationship.toTable}.${relationship.toColumn}`,
                        );
                    }
                }
            } else if (
                Array.isArray(relationship.fromColumn) &&
                Array.isArray(relationship.toColumn)
            ) {
                // NEU: Für zusammengesetzte FKs alle beteiligten Spalten markieren
                const sourceTable = this.parsedTables.find(
                    (t) => t.name === relationship.fromTable,
                );
                if (sourceTable) {
                    relationship.fromColumn.forEach((colName, idx) => {
                        const sourceColumn = sourceTable.columns.find((c) => c.name === colName);
                        if (sourceColumn) {
                            if (!sourceColumn.isForeignKey) {
                                sourceColumn.isForeignKey = true;
                            }
                            if (!sourceColumn.references) {
                                sourceColumn.references = {
                                    table: relationship.toTable,
                                    column: Array.isArray(relationship.toColumn)
                                        ? relationship.toColumn[idx]
                                        : relationship.toColumn,
                                };
                            }
                            console.log(
                                `🔗 Mapped composite FK: ${relationship.fromTable}.${colName} → ${relationship.toTable}.${Array.isArray(relationship.toColumn) ? relationship.toColumn[idx] : relationship.toColumn}`,
                            );
                        }
                    });
                }
            } else {
                // Fallback: Logging für ungewöhnliche Fälle
                const fromCols = Array.isArray(relationship.fromColumn)
                    ? relationship.fromColumn.join(', ')
                    : relationship.fromColumn;
                const toCols = Array.isArray(relationship.toColumn)
                    ? relationship.toColumn.join(', ')
                    : relationship.toColumn;
                console.log(
                    `🔗 Composite FK detected: ${relationship.fromTable}.[${fromCols}] → ${relationship.toTable}.[${toCols}]`,
                );
            }
        });
    }

    /**
     * Creates a simple HTML visualization of the ER diagram from DBML code.
     * @param {string} dbmlCode - The DBML code to parse and visualize.
     * @returns {string} - The generated HTML string for the diagram.
     */
    private createSimpleVisualization(dbmlCode: string): string {
        // Simple DBML parser to create a table-based visualization
        const tables = this.parseDbmlTables(dbmlCode);

        let html = '<div class="dbml-visualization">';

        tables.forEach((table: DbmlTable) => {
            html += `
        <div class="table-box">
          <div class="table-header">
            <strong>${table.name}</strong>
          </div>
          <div class="table-columns">
      `;

            table.columns.forEach((column: TableColumn) => {
                html += `
          <div class="column-row ${column.isPrimaryKey ? 'primary-key-row' : ''}">
            <span class="column-icons">
              ${column.isPrimaryKey ? '<mat-icon class="pk-icon" matTooltip="Primärschlüssel">vpn_key</mat-icon>' : ''}
              ${column.isForeignKey ? '<mat-icon class="fk-icon" matTooltip="Fremdschlüssel">link</mat-icon>' : ''}
              ${column.isUnique ? '<mat-icon class="uq-icon" matTooltip="Eindeutig">star</mat-icon>' : ''}
            </span>
            <span class="column-name">${column.name}</span>
            <span class="column-type">${column.type}</span>
          </div>
        `;
            });

            html += `
          </div>
        </div>
      `;
        });

        html += '</div>';

        // Add relationships info
        const relationships = this.parseDbmlRelationships(dbmlCode);
        if (relationships.length > 0) {
            html += '<div class="relationships-section"><h4>Beziehungen:</h4><ul>';
            relationships.forEach((rel: DbmlRelationship) => {
                const fromColumns = Array.isArray(rel.fromColumn)
                    ? rel.fromColumn.join(', ')
                    : rel.fromColumn;
                const toColumns = Array.isArray(rel.toColumn)
                    ? rel.toColumn.join(', ')
                    : rel.toColumn;
                const isComposite = Array.isArray(rel.fromColumn) && rel.fromColumn.length > 1;

                html += `<li class="${isComposite ? 'composite-fk' : 'single-fk'}">
          ${rel.fromTable}.[${fromColumns}] → ${rel.toTable}.[${toColumns}]
          ${isComposite ? '<span class="composite-badge">Zusammengesetzt</span>' : ''}
        </li>`;
            });
            html += '</ul></div>';
        }

        return html;
    }

    /**
     * Parses DBML code and extracts table definitions.
     * @param {string} dbmlCode - The DBML code to parse.
     * @returns {DbmlTable[]} - Array of parsed tables.
     */
    private parseDbmlTables(dbmlCode: string): DbmlTable[] {
        const tables: DbmlTable[] = [];
        const tableRegex = /Table\s+(\w+)\s*\{([^}]+)\}/g;
        let match;

        while ((match = tableRegex.exec(dbmlCode)) !== null) {
            const tableName = match[1];
            const tableContent = match[2];

            const columns = this.parseTableColumns(tableContent);
            tables.push({ name: tableName, columns });
        }

        return tables;
    }

    /**
     * Parses the content of a DBML table and extracts columns.
     * @param {string} tableContent - The content of the table block in DBML.
     * @returns {TableColumn[]} - Array of parsed columns.
     */
    private parseTableColumns(tableContent: string): TableColumn[] {
        const columns: TableColumn[] = [];
        const lines = tableContent
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line);

        lines.forEach((line) => {
            if (line.includes('//') || line.includes('/*')) return; // Skip comments

            const parts = line.split(/\s+/);
            if (parts.length < 2) return;

            const name = parts[0];
            const type = parts[1];

            // Erkenne PK/FK/UQ über explizite DBML-Attribute
            const isPrimaryKey = /\[.*\bpk\b.*\]/i.test(line) || /\[.*primary key.*\]/i.test(line);
            const isUnique = /\[.*\buq\b.*\]/i.test(line) || /\[.*unique.*\]/i.test(line);

            // Erkenne FK über ref: Attribut in der Spalte
            const refMatch = line.match(/ref:\s*>\s*(\w+)\.(\w+)/i);
            const isForeignKey = !!refMatch || /\[.*foreign key.*\]/i.test(line);

            let references = undefined;
            if (refMatch) {
                references = {
                    table: refMatch[1],
                    column: refMatch[2],
                };
            }

            console.log(
                `Column parsed: ${name} (PK: ${isPrimaryKey}, FK: ${isForeignKey}, UQ: ${isUnique}, Ref: ${references ? `${references.table}.${references.column}` : 'none'})`,
            );

            columns.push({ name, type, isPrimaryKey, isForeignKey, isUnique, references });
        });

        return columns;
    }

    /**
     * Parses DBML code and extracts relationships between tables.
     * @param {string} dbmlCode - The DBML code to parse.
     * @returns {DbmlRelationship[]} - Array of parsed relationships.
     */
    private parseDbmlRelationships(dbmlCode: string): DbmlRelationship[] {
        const relationships: DbmlRelationship[] = [];

        // Pattern for single column relationships: table.column > table.column
        const singleRefRegex = /(\w+)\.(\w+)\s*>\s*(\w+)\.(\w+)/g;

        // Pattern for composite relationships: (table.col1, table.col2) > (table.col1, table.col2)
        const compositeRefRegex = /\(([^)]+)\)\s*>\s*\(([^)]+)\)/g;

        let match;

        // Parse single column relationships
        while ((match = singleRefRegex.exec(dbmlCode)) !== null) {
            relationships.push({
                fromTable: match[1],
                fromColumn: match[2],
                toTable: match[3],
                toColumn: match[4],
            });
        }

        // Parse composite relationships
        while ((match = compositeRefRegex.exec(dbmlCode)) !== null) {
            const fromPart = match[1];
            const toPart = match[2];

            // Parse source columns from "table.col1, table.col2" format
            const fromColumns = this.parseCompositeColumns(fromPart);
            const toColumns = this.parseCompositeColumns(toPart);

            if (
                fromColumns.length > 0 &&
                toColumns.length > 0 &&
                fromColumns.length === toColumns.length
            ) {
                relationships.push({
                    fromTable: fromColumns[0].table,
                    fromColumn: fromColumns.map((c) => c.column),
                    toTable: toColumns[0].table,
                    toColumn: toColumns.map((c) => c.column),
                });
            }
        }

        return relationships;
    }

    /**
     * Checks if a relationship is a composite foreign key.
     * @param {DbmlRelationship} relationship - The relationship to check.
     * @returns {boolean} - True if the relationship is composite.
     */
    isCompositeRelationship(relationship: DbmlRelationship): boolean {
        return Array.isArray(relationship.fromColumn) && relationship.fromColumn.length > 1;
    }

    /**
     * Formats column names for display (handles both single and composite columns).
     * @param {string | string[]} columns - The column(s) to format.
     * @returns {string} - The formatted column names.
     */
    formatColumns(columns: string | string[]): string {
        if (Array.isArray(columns)) {
            return columns.join(', ');
        }
        return columns;
    }

    /**
     * Creates a detailed tooltip for FK relationships, handling both single and composite FKs.
     * @param {DbmlRelationship} relationship - The relationship to create a tooltip for.
     * @returns {string} - The formatted tooltip text.
     */
    getRelationshipTooltip(relationship: DbmlRelationship): string {
        const targetColumns = Array.isArray(relationship.toColumn)
            ? relationship.toColumn.join(', ')
            : relationship.toColumn;

        if (this.isCompositeRelationship(relationship)) {
            return `FK → ${relationship.toTable}(${targetColumns})`;
        } else {
            return `FK → ${relationship.toTable}.${targetColumns}`;
        }
    }

    /**
     * Gets a tooltip for the composite badge indicating the number of columns.
     * @param {DbmlRelationship} relationship - The relationship to create a tooltip for.
     * @returns {string} - The formatted tooltip text for the composite badge.
     */
    getCompositeTooltip(relationship: DbmlRelationship): string {
        const columnCount = Array.isArray(relationship.fromColumn)
            ? relationship.fromColumn.length
            : 1;
        return `Zusammengesetzter Fremdschlüssel mit ${columnCount} Spalten`;
    }

    /**
     * Parses composite column references like "table.col1, table.col2".
     * @param {string} columnsPart - The columns part of a composite reference.
     * @returns {Array<{table: string, column: string}>} - Array of table-column pairs.
     */
    private parseCompositeColumns(columnsPart: string): Array<{ table: string; column: string }> {
        const columns: Array<{ table: string; column: string }> = [];
        const parts = columnsPart.split(',').map((p) => p.trim());

        parts.forEach((part) => {
            const match = part.match(/(\w+)\.(\w+)/);
            if (match) {
                columns.push({
                    table: match[1],
                    column: match[2],
                });
            }
        });

        return columns;
    }

    /**
     * Gibt den passenden Tooltip für eine FK-Spalte zurück (auch für zusammengesetzte FKs)
     */
    getForeignKeyTooltip(tableName: string, columnName: string): string {
        // Suche nach einer zusammengesetzten Beziehung, an der diese Spalte beteiligt ist
        const compositeRel = this.parsedRelationships.find(
            (rel) =>
                Array.isArray(rel.fromColumn) &&
                rel.fromTable === tableName &&
                rel.fromColumn.includes(columnName),
        );
        if (compositeRel) {
            const toCols = (compositeRel.toColumn as string[]).join(', ');
            return `FK → ${compositeRel.toTable}.[${toCols}]`;
        }
        // Fallback: Einzelspalten-FK
        const singleRel = this.parsedRelationships.find(
            (rel) => rel.fromTable === tableName && rel.fromColumn === columnName,
        );
        if (singleRel) {
            return `FK → ${singleRel.toTable}.${singleRel.toColumn}`;
        }
        // Fallback: generisch
        return 'Fremdschlüssel';
    }

    /**
     * Prüft, ob eine Spalte Teil eines zusammengesetzten Foreign Keys ist
     */
    isColumnInCompositeFK(tableName: string, columnName: string): boolean {
        return this.parsedRelationships.some(
            (rel) =>
                Array.isArray(rel.fromColumn) &&
                rel.fromTable === tableName &&
                rel.fromColumn.includes(columnName),
        );
    }
}
