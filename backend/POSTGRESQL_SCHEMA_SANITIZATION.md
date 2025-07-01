# PostgreSQL Schema Sanitization

## Übersicht

Die `getDatabaseSchema()` Methode im `DatabasesService` wurde erweitert, um PostgreSQL-spezifische Syntax zu entfernen und ein standardkonformes DDL zu liefern, das mit verschiedenen Parsern kompatibel ist.

## Problem

PostgreSQL generiert bei der Schema-Extraktion aus `information_schema` oft Spezial-Syntax wie:
- `::regclass` Casts in Foreign Key Referenzen
- `::text`, `::integer`, `::boolean` Type Casts
- `::timestamp`, `::numeric` Casts in DEFAULT-Werten
- `nextval('sequence')::regclass` in SERIAL-Spalten

Diese Syntax ist PostgreSQL-spezifisch und führt zu Problemen bei:
- AST-Parsern (wie `pgsql-ast-parser`)
- Frontend-Renderern
- Schema-Visualisierung
- Cross-Database-Kompatibilität

## Lösung

### Implementierte Sanitization

Die `sanitizePostgreSQLSchema()` Methode entfernt systematisch:

1. **::regclass Casts**: `REFERENCES table_name::regclass` → `REFERENCES table_name`
2. **Alle Type Casts**: `::text`, `::integer`, `::boolean`, etc.
3. **Quoted Value Casts**: `'value'::text` → `'value'`
4. **Numeric Casts**: `123::integer` → `123`
5. **Function Casts**: `nextval('seq')::regclass` → `nextval('seq')`
6. **Whitespace Normalization**: Entfernt überflüssige Leerzeichen und Leerzeilen

### Beispiel-Transformation

**Vorher (mit PostgreSQL Casts):**
```sql
CREATE TABLE users (
    id INTEGER DEFAULT nextval('users_id_seq'::regclass),
    name VARCHAR DEFAULT 'anonymous'::text,
    age INTEGER DEFAULT 0::integer,
    is_active BOOLEAN DEFAULT true::boolean
);

CREATE TABLE posts (
    id INTEGER,
    user_id INTEGER REFERENCES users(id)::regclass
);
```

**Nachher (bereinigt):**
```sql
CREATE TABLE users (
    id INTEGER DEFAULT nextval('users_id_seq'),
    name VARCHAR DEFAULT 'anonymous',
    age INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE posts (
    id INTEGER,
    user_id INTEGER REFERENCES users(id)
);
```

## Code-Implementierung

### Methoden-Signatur
```typescript
/**
 * Gets the actual PostgreSQL schema from the real database
 * Removes PostgreSQL-specific syntax like ::regclass, ::type casts to ensure
 * compatibility with parsers and clean display in frontend
 * @param id Database ID
 * @returns SQL schema as string without PostgreSQL casts
 */
async getDatabaseSchema(id: number): Promise<{ schema: string }>
```

### Sanitization-Logik
```typescript
private sanitizePostgreSQLSchema(schemaSQL: string): string {
    let cleanSchema = schemaSQL;
    
    // 1. Remove ::regclass casts
    cleanSchema = cleanSchema.replace(/::regclass/g, '');
    
    // 2. Remove all other ::type casts
    cleanSchema = cleanSchema.replace(/::[a-zA-Z_][a-zA-Z0-9_]*/g, '');
    
    // 3. Clean up quoted values with type casts
    cleanSchema = cleanSchema.replace(/'([^']+)'::[a-zA-Z_][a-zA-Z0-9_]*/g, "'$1'");
    
    // 4. Clean up unquoted values with type casts
    cleanSchema = cleanSchema.replace(/\b([a-zA-Z0-9_]+)::[a-zA-Z_][a-zA-Z0-9_]*/g, '$1');
    
    // 5. Clean up numeric casts
    cleanSchema = cleanSchema.replace(/\b(\d+(?:\.\d+)?)::[a-zA-Z_][a-zA-Z0-9_]*/g, '$1');
    
    // 6. Remove function casts
    cleanSchema = cleanSchema.replace(/nextval\(([^)]+)\)::[a-zA-Z_][a-zA-Z0-9_]*/g, 'nextval($1)');
    
    // 7. Normalize whitespace
    cleanSchema = cleanSchema
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        .replace(/\s+$/gm, '')
        .replace(/^\s+$/gm, '');
    
    return cleanSchema;
}
```

## Testing

### Unit Tests
Umfassende Tests in `databases.service.sanitization.spec.ts`:

- ✅ Entfernung von `::regclass` Casts
- ✅ Entfernung aller Type Casts (`::text`, `::integer`, etc.)
- ✅ Komplexe Schemas mit mehreren Cast-Typen
- ✅ Whitespace-Normalisierung
- ✅ Edge Cases ohne Casts
- ✅ `nextval()` Funktions-Casts
- ✅ Integration in `getDatabaseSchema()`

### Test-Ergebnisse
```
✓ should remove ::regclass casts (9 ms)
✓ should remove all PostgreSQL type casts (2 ms)
✓ should handle complex schema with multiple cast types (2 ms)
✓ should normalize whitespace and remove empty lines (2 ms)
✓ should handle edge cases with no casts (2 ms)
✓ should handle nextval function calls with casts (1 ms)
✓ should handle schema sanitization in getDatabaseSchema method (20 ms)

Test Suites: 1 passed, 1 total
Tests: 7 passed, 7 total
```

## Vorteile

### 1. Parser-Kompatibilität
- **AST-Parser**: `pgsql-ast-parser` kann das bereinigte Schema fehlerfrei parsen
- **Frontend-Renderer**: DBML-Generierung läuft ohne Fehler
- **Cross-Platform**: Schema funktioniert mit verschiedenen SQL-Dialekten

### 2. Benutzerfreundlichkeit
- **Saubere Anzeige**: Keine verwirrende PostgreSQL-Syntax im Frontend
- **Lesbarkeit**: Standard-SQL ist für Benutzer verständlicher
- **Debugging**: Einfachere Fehlersuche ohne PostgreSQL-Spezialitäten

### 3. Wartbarkeit
- **Modularer Code**: Sanitization ist in separater Methode gekapselt
- **Erweiterbar**: Neue Regex-Patterns können einfach hinzugefügt werden
- **Testbar**: Vollständige Unit-Test-Abdeckung

## Integration

### Schema-Visualization-Service
Die bereinigte Schema wird nahtlos von der Schema-Visualization verwendet:

```typescript
async visualizeDatabase(databaseId: number): Promise<ERDiagramDto> {
    const { schema } = await this.databasesService.getDatabaseSchema(databaseId);
    // schema ist bereits bereinigt und parser-kompatibel
    return this.parseSchemaString({ schema, name: database.name });
}
```

### Frontend ER-Diagramm
Das Frontend erhält saubere, standardkonforme DDL-Statements für die Visualisierung.

## Zukünftige Erweiterungen

### Zusätzliche Sanitization
- **CHECK Constraints**: PostgreSQL-spezifische CHECK-Syntax bereinigen
- **ENUM Types**: User-defined Types in Standard-Types konvertieren
- **Partitioning**: PARTITION BY Syntax entfernen/vereinfachen

### Performance-Optimierung
- **Caching**: Bereinigte Schemas zwischenspeichern
- **Batch Processing**: Mehrere Schemas gleichzeitig bereinigen
- **Streaming**: Große Schemas in Chunks verarbeiten

## Best Practices

1. **Immer sanitizen**: Jede Schema-Ausgabe sollte bereinigt werden
2. **Tests erweitern**: Neue PostgreSQL-Features in Tests aufnehmen
3. **Logging**: Sanitization-Prozess protokollieren für Debugging
4. **Backwards Compatibility**: Bestehende Funktionalität nicht brechen

## Fazit

Die PostgreSQL Schema Sanitization stellt sicher, dass SQLearner robuste, parser-kompatible und benutzerfreundliche Schema-Darstellungen liefert, die in allen Komponenten des Systems fehlerfrei funktionieren.
