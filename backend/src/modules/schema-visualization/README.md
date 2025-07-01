# Schema Visualization Module

This module provides database schema visualization capabilities for the SQLearner application. It converts SQL DDL schemas into visual ER diagrams using DBML (Database Markup Language) format.

## Features

- **PostgreSQL AST Parsing**: Uses `pgsql-ast-parser` for accurate PostgreSQL DDL parsing
- **Typed Schema Representation**: Fully typed TypeScript interfaces replace `any` types
- **DBML Generation**: Creates DBML code for database schema representation
- **ER Diagram Data**: Provides table and relationship data for visualization
- **Position Calculation**: Automatically calculates table positions for layout
- **Database Integration**: Directly visualizes existing databases from the system
- **Granular Error Handling**: Specific error types with detailed messages
- **Fallback Parser**: Regex-based parser for legacy compatibility

## Architecture

### Primary Parser: PostgreSQL AST
- **Engine**: `pgsql-ast-parser`
- **Advantages**: Full PostgreSQL syntax support, AST-based accuracy, better error reporting
- **Supported Features**: See [PostgreSQL DDL Support](./POSTGRESQL_DDL_SUPPORT.md)

### Fallback Parser: Regex-based
- **Engine**: Custom regex patterns
- **Purpose**: Legacy compatibility when AST parser fails
- **Output**: Unified `TypedJsonSchema` format

### Error Handling
- **SchemaParsingError**: SQL syntax errors with line numbers
- **ASTMappingError**: AST to schema mapping failures
- **UnsupportedDDLError**: Unsupported PostgreSQL features

## API Endpoints

### POST /schema-visualization/parse-schema
Parses a SQL schema string and returns visualization data.

**Request Body:**
```json
{
  "schema": "CREATE TABLE users (id SERIAL PRIMARY KEY, name VARCHAR(100));",
  "name": "My Schema"
}
```

**Response:**
```json
{
  "tables": [...],
  "relationships": [...],
  "metadata": {
    "databaseName": "My Schema",
    "tableCount": 1,
    "relationshipCount": 0
  },
  "dbmlCode": "Project My Schema {...}",
  "jsonSchema": {...}
}
```

### GET /schema-visualization/database/:id
Visualizes an existing database from the system.

**Response:** Same format as above

## Data Flow

1. **SQL Input** → PostgreSQL AST Parser → **TypedJsonSchema**
2. **TypedJsonSchema** → DBML Converter → **DBML Code**
3. **TypedJsonSchema** → DTO Mapper → **Table/Relationship DTOs**
4. **DTOs** → Position Calculator → **Positioned Elements**

## Schema Parsing Features

### Supported SQL Elements
- `CREATE TABLE` statements
- Column definitions with types
- Primary keys (`PRIMARY KEY`)
- Foreign keys (`REFERENCES`)
- Unique constraints (`UNIQUE`)
- Not null constraints (`NOT NULL`)
- Default values (`DEFAULT`)

### Relationship Detection
- Automatically detects foreign key relationships
- Supports standard `REFERENCES` syntax
- Creates `many-to-one` relationships by default

### DBML Output
- Clean, readable DBML syntax
- Proper attribute annotations (`[pk]`, `[not null]`, etc.)
- Relationship definitions
- Project metadata

## Usage Examples

### Basic Schema Parsing
```typescript
const schemaService = new SchemaVisualizationService(databasesService);

const result = await schemaService.parseSchemaString({
  schema: `
    CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(100) UNIQUE NOT NULL
    );
  `,
  name: 'User System'
});

console.log(result.dbmlCode);
```

### Database Visualization
```typescript
// Visualize database with ID 1
const diagram = await schemaService.visualizeDatabase(1);
```

## Position Calculation

Tables are automatically positioned using a grid layout:
- **Grid Width:** 350px spacing
- **Grid Height:** 280px spacing  
- **Start Position:** (50, 50)
- **Layout:** Square grid based on table count
- **Height Calculation:** Dynamic based on column count

## Error Handling

- **Invalid SQL:** Graceful fallback with error messages
- **Missing Database:** Clear error messages for not found databases
- **Parsing Errors:** Detailed error information in responses

## Dependencies

- `@dbml/core`: DBML parsing and generation
- `@dbml/cli`: Additional DBML utilities
- Custom SQL parser as fallback

## Testing

Run tests with:
```bash
npm test schema-visualization.service.spec.ts
```

Tests cover:
- SQL schema parsing
- DBML generation
- Database visualization
- Error handling
- Edge cases (empty schemas, invalid input)

## Future Enhancements

- SVG generation using DBML renderers
- Interactive diagram features
- Advanced layout algorithms
- Support for more SQL dialects
- Real-time schema synchronization
