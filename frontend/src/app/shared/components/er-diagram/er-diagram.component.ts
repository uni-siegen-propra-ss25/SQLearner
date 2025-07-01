import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface TableColumn {
  name: string;
  type: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isUnique: boolean;
}

interface DbmlTable {
  name: string;
  columns: TableColumn[];
}

interface DbmlRelationship {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
}

interface ERDiagramDialogData {
  dbmlCode: string;
  databaseName?: string;
}

@Component({
  selector: 'app-er-diagram',
  template: `
    <div class="er-dialog">
      <div class="er-dialog-header">
        <h2 mat-dialog-title>
          <mat-icon>schema</mat-icon>
          ER-Diagramm{{ data.databaseName ? ' - ' + data.databaseName : '' }}
        </h2>
        <button mat-icon-button mat-dialog-close matTooltip="Schließen">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      
      <mat-dialog-content class="er-dialog-content">
        <div class="er-container" *ngIf="diagramHtml; else errorState">
          <div [innerHTML]="diagramHtml" class="diagram-content"></div>
        </div>
        
        <ng-template #errorState>
          <div class="error-state">
            <mat-icon>error_outline</mat-icon>
            <h3>Diagramm konnte nicht generiert werden</h3>
            <p>Bitte überprüfen Sie das SQL-Schema.</p>
            <mat-divider></mat-divider>
            <details>
              <summary>DBML Code anzeigen</summary>
              <pre><code>{{ data.dbmlCode || 'Kein DBML Code verfügbar' }}</code></pre>
            </details>
          </div>
        </ng-template>
      </mat-dialog-content>
      
      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>Schließen</button>
        <button mat-stroked-button (click)="downloadSvg()" [disabled]="!diagramHtml">
          <mat-icon>download</mat-icon>
          SVG herunterladen
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styleUrls: ['./er-diagram.component.scss']
})
export class ErDiagramComponent implements OnInit, OnDestroy {
  diagramHtml: SafeHtml | null = null;
  private rawSvg: string = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ERDiagramDialogData,
    private dialogRef: MatDialogRef<ErDiagramComponent>,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.generateDiagram();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

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

  downloadSvg(): void {
    if (!this.diagramHtml) return;

    // Create a simple SVG from the HTML content for download
    const htmlContent = this.data.dbmlCode || 'No DBML content available';
    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml">
            <pre style="font-family: monospace; padding: 20px; background: white;">${htmlContent}</pre>
          </div>
        </foreignObject>
      </svg>
    `;
    
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `er-diagram-${this.data.databaseName || 'schema'}.svg`;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
