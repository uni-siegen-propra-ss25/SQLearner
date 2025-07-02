import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * Data structure representing a column in a table for DBML parsing and visualization.
 * @property {string} name - The name of the column.
 * @property {string} type - The SQL data type of the column.
 * @property {boolean} isPrimaryKey - Whether the column is a primary key.
 * @property {boolean} isForeignKey - Whether the column is a foreign key.
 * @property {boolean} isUnique - Whether the column has a unique constraint.
 */
interface TableColumn {
  name: string;
  type: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isUnique: boolean;
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
 * @property {string} fromColumn - Name of the source column.
 * @property {string} toTable - Name of the target table.
 * @property {string} toColumn - Name of the target column.
 */
interface DbmlRelationship {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
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
  styleUrls: ['./er-diagram.component.scss']
})
export class ErDiagramComponent implements OnInit, OnDestroy {
  diagramHtml: SafeHtml | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ERDiagramDialogData,
    private dialogRef: MatDialogRef<ErDiagramComponent>,
    private sanitizer: DomSanitizer
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
   * Generates the ER diagram HTML from the provided DBML code.
   * Sets the sanitized HTML for rendering in the dialog.
   */
  private async generateDiagram(): Promise<void> {
    try {
      if (!this.data.dbmlCode || this.data.dbmlCode.trim() === '') {
        console.warn('No DBML code provided');
        return;
      }

      // For now, we'll create a simple table visualization from DBML
      // In the future, this can be replaced with a proper DBML renderer
      const htmlContent = this.createSimpleVisualization(this.data.dbmlCode);
      
      if (htmlContent) {
        // Sanitize the HTML for security
        this.diagramHtml = this.sanitizer.bypassSecurityTrustHtml(htmlContent);
      } else {
        console.error('Failed to generate visualization from DBML');
      }
    } catch (error) {
      console.error('Error generating ER diagram:', error);
    }
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
        const badges = [];
        if (column.isPrimaryKey) badges.push('<span class="badge primary-key">PK</span>');
        if (column.isForeignKey) badges.push('<span class="badge foreign-key">FK</span>');
        if (column.isUnique) badges.push('<span class="badge unique">UQ</span>');
        
        html += `
          <div class="column-row ${column.isPrimaryKey ? 'primary-key-row' : ''}">
            <span class="column-name">${column.name}</span>
            <span class="column-type">${column.type}</span>
            ${badges.join(' ')}
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
        html += `<li>${rel.fromTable}.${rel.fromColumn} → ${rel.toTable}.${rel.toColumn}</li>`;
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
    const lines = tableContent.split('\n').map(line => line.trim()).filter(line => line);
    
    lines.forEach(line => {
      if (line.includes('//') || line.includes('/*')) return; // Skip comments
      
      const parts = line.split(/\s+/);
      if (parts.length < 2) return;
      
      const name = parts[0];
      const type = parts[1];
      
      const isPrimaryKey = line.includes('[primary key]') || line.includes('[pk]');
      const isForeignKey = line.includes('[ref:') || line.includes('[foreign key]');
      const isUnique = line.includes('[unique]') || line.includes('[uq]');
      
      columns.push({ name, type, isPrimaryKey, isForeignKey, isUnique });
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
    const refRegex = /(\w+)\.(\w+)\s*>\s*(\w+)\.(\w+)/g;
    let match;
    
    while ((match = refRegex.exec(dbmlCode)) !== null) {
      relationships.push({
        fromTable: match[1],
        fromColumn: match[2],
        toTable: match[3],
        toColumn: match[4]
      });
    }
    
    return relationships;
  }
}
