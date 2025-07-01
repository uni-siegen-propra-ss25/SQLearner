# ER-Diagramm Frontend Integration

## Übersicht

Diese Dokumentation beschreibt die vollständige Integration des ER-Diagramm-Features in SQLearner. Das Feature ermöglicht es Benutzern, aus einer SQL-Schema-Definition ein visuelles ER-Diagramm in einem Dialog zu generieren und anzuzeigen.

## Installation und Setup

### 1. Dependencies

Die folgenden Abhängigkeiten sind bereits installiert:
- `@angular/material` - Material Design Komponenten
- `@angular/cdk` - Angular Component Development Kit

**Hinweis:** Die ursprünglich geplante `@softwaretechnik/dbml-renderer` Bibliothek konnte aufgrund von Node.js-spezifischen Dependencies nicht im Browser verwendet werden. Stattdessen wurde eine benutzerdefinierte DBML-Parser-Lösung implementiert.

### 2. Komponenten

#### ErDiagramComponent
- **Pfad:** `src/app/shared/components/er-diagram/er-diagram.component.ts`
- **Zweck:** Zeigt DBML-Code als strukturiertes ER-Diagramm in einem Material Dialog an
- **Features:**
  - Parst DBML-Code und erstellt eine tabellarische Visualisierung
  - Hebt Primary Keys, Foreign Keys und Unique Constraints hervor
  - Zeigt Beziehungen zwischen Tabellen an
  - Responsive Design mit Scroll-Unterstützung
  - Download-Funktionalität (SVG-Export)

#### SchemaVisualizationService
- **Pfad:** `src/app/core/services/schema-visualization.service.ts`
- **Zweck:** Frontend-Service für die Kommunikation mit dem Backend-Schema-Visualization-API
- **Methoden:**
  - `parseSchemaString()` - Parst DDL-String zu ER-Diagramm-Daten
  - `visualizeDatabase()` - Holt ER-Diagramm-Daten für eine spezifische Datenbank

## Integration in Query Exercise

### 1. Button-Integration

Das ER-Diagramm-Feature wurde in die Query Exercise Komponente integriert:

```html
<!-- In query-exercise.component.html -->
<div class="schema-header">
  <mat-icon>schema</mat-icon>
  <span>Datenbankschema</span>
  <button
    mat-icon-button
    color="primary"
    (click)="showErDiagram()"
    matTooltip="ER-Diagramm anzeigen"
    class="er-diagram-button"
  >
    <mat-icon>account_tree</mat-icon>
  </button>
</div>
```

### 2. Komponenten-Integration

```typescript
// In query-exercise.component.ts
import { SchemaVisualizationService } from '../../../../core/services/schema-visualization.service';
import { ErDiagramComponent } from '../../../../shared/components/er-diagram/er-diagram.component';

export class QueryExerciseComponent {
  // ...

  showErDiagram(): void {
    const schemaToUse = this.actualDatabaseSchema || this.exercise?.database?.schemaSql || '';
    
    if (!schemaToUse.trim()) {
      this.snackBar.open('Kein Schema verfügbar für das ER-Diagramm', 'Schließen', {
        duration: 3000
      });
      return;
    }

    // Versuche zuerst die Datenbank-ID zu verwenden
    if (this.exercise?.database?.id) {
      this.schemaVisualizationService.visualizeDatabase(this.exercise.database.id)
        .subscribe({
          next: (erDiagram) => this.openErDiagramDialog(erDiagram),
          error: () => this.fallbackToSchemaString(schemaToUse)
        });
    } else {
      this.fallbackToSchemaString(schemaToUse);
    }
  }

  private openErDiagramDialog(erDiagram: any): void {
    this.dialog.open(ErDiagramComponent, {
      data: {
        dbmlCode: erDiagram.dbmlCode,
        databaseName: this.exercise?.database?.name
      },
      width: '90vw',
      height: '90vh',
      maxWidth: '1200px',
      maxHeight: '800px',
      disableClose: false,
      panelClass: 'er-diagram-dialog'
    });
  }
}
```

## Module-Konfiguration

### SharedModule
```typescript
// src/app/shared/shared.module.ts
import { ErDiagramComponent } from './components/er-diagram/er-diagram.component';

@NgModule({
  declarations: [
    NavigationRailComponent, 
    SqlEditorComponent, 
    ErDiagramComponent  // ER-Diagramm-Komponente hinzugefügt
  ],
  imports: [CommonModule, MaterialModule, RouterModule, TranslateModule],
  exports: [
    NavigationRailComponent, 
    SqlEditorComponent, 
    ErDiagramComponent,  // Für externe Nutzung exportiert
    TranslateModule
  ]
})
export class SharedModule {}
```

## DBML-Parser-Implementierung

Die Komponente enthält einen benutzerdefinierten DBML-Parser, der folgende Features unterstützt:

### Unterstützte DBML-Syntax:
```dbml
Table users {
  id integer [primary key]
  name varchar [unique]
  email varchar
  created_at timestamp
}

Table posts {
  id integer [primary key]
  user_id integer [ref: > users.id]  // Foreign Key Referenz
  title varchar
  content text
}
```

### Parser-Features:
- **Tabellen-Erkennung:** Extrahiert Tabellennamen und Spalten
- **Constraint-Erkennung:** Erkennt `[primary key]`, `[pk]`, `[unique]`, `[uq]`, `[ref:]`
- **Beziehungs-Parsing:** Extrahiert Foreign Key Beziehungen
- **Kommentar-Handling:** Ignoriert `//` und `/* */` Kommentare

## Styling und Design

### Responsive Design
- **Desktop:** Vollständige Tabellen-Ansicht mit allen Details
- **Mobile:** Kompakte Ansicht mit gestapelten Elementen
- **Tablet:** Angepasste Größen und Abstände

### Visual Features
- **Farbkodierung:**
  - Primary Keys: Blau (`#1565c0`)
  - Foreign Keys: Rot (`#d84315`)
  - Unique Constraints: Orange (`#f57c00`)
- **Badges:** Kleine Kennzeichnungen für Constraints (PK, FK, UQ)
- **Hover-Effekte:** Interaktive Elemente für bessere UX
- **Schatten:** Subtile Box-Shadows für Tiefe

### CSS-Klassen
```scss
.dbml-visualization {
  .table-box {
    // Tabellen-Container
    .table-header { /* Tabellen-Header */ }
    .table-columns {
      .column-row { /* Spalten-Zeilen */ }
      .primary-key-row { /* Hervorhebung für Primary Keys */ }
    }
  }
  .relationships-section { /* Beziehungs-Anzeige */ }
}
```

## Error Handling

### Frontend Error Handling:
- **Kein Schema verfügbar:** Benutzerfreundliche Snackbar-Meldung
- **Backend-Fehler:** Fallback auf Schema-String-Parsing
- **Parsing-Fehler:** Anzeige der Fehler-Komponente mit Details
- **Leerer DBML:** Graceful Handling mit Fehlermeldung

### Backend Error Handling:
- **Database nicht gefunden:** Strukturierte Fehlermeldung
- **Schema-Parsing-Fehler:** Detaillierte Fehlerinformationen
- **DBML-Generierung-Fehler:** Fallback auf einfache Schema-Anzeige

## Testing

### Unit Tests
- **ErDiagramComponent:** Basis-Komponenten-Tests
- **SchemaVisualizationService:** API-Kommunikations-Tests
- **DBML-Parser:** Parser-Funktionalitäts-Tests

Testfile: `src/app/shared/components/er-diagram/er-diagram.component.spec.ts`

## Verwendung

### Für Benutzer:
1. Öffne eine Query Exercise mit einem verfügbaren Schema
2. Wechsle zur "Schema"-Ansicht
3. Klicke auf das ER-Diagramm-Icon (🌳) neben "Datenbankschema"
4. Das ER-Diagramm öffnet sich in einem Dialog
5. Optional: Lade das Diagramm als SVG herunter

### Für Entwickler:
```typescript
// ER-Diagramm programmatisch öffnen
this.dialog.open(ErDiagramComponent, {
  data: {
    dbmlCode: 'Table users { id integer [pk] }',
    databaseName: 'My Database'
  },
  width: '90vw',
  height: '90vh'
});
```

## Zukünftige Verbesserungen

### Mögliche Erweiterungen:
1. **Echte SVG-Rendering:** Integration einer browser-kompatiblen DBML-zu-SVG-Bibliothek
2. **Drag & Drop:** Interaktive Positionierung von Tabellen
3. **Zoom-Funktionalität:** Vergrößern/Verkleinern des Diagramms
4. **Export-Optionen:** PNG, PDF, JSON Export
5. **Beziehungslinien:** Visuelle Verbindungslinien zwischen Tabellen
6. **Erweiterte DBML-Syntax:** Unterstützung für komplexere DBML-Features

### Performance-Optimierungen:
1. **Lazy Loading:** Verzögertes Laden großer Diagramme
2. **Virtualisierung:** Effiziente Darstellung sehr großer Schemas
3. **Caching:** Client-seitige Zwischenspeicherung von generierten Diagrammen

## Backend-Integration

Das Frontend kommuniziert mit folgenden Backend-Endpoints:

- **POST** `/api/schema-visualization/parse-schema` - Parst DDL-String
- **GET** `/api/schema-visualization/database/{id}` - Holt Schema für Datenbank-ID

Die Backend-Implementierung nutzt `pgsql-ast-parser` für robustes PostgreSQL DDL-Parsing und generiert DBML-Code für die Frontend-Visualisierung.

## Fazit

Das ER-Diagramm-Feature bietet eine vollständige, benutzerfreundliche Lösung zur Visualisierung von Datenbankschemas in SQLearner. Die Implementierung ist wartbar, erweiterbar und bietet eine solide Grundlage für zukünftige Verbesserungen.
