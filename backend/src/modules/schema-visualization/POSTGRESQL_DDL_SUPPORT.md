# PostgreSQL DDL Support Documentation

## Supported DDL Features

### 1. CREATE TABLE Statements

#### Basic Table Creation
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email TEXT UNIQUE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Supported Data Types
- **Integer Types**: `INTEGER`, `INT`, `INT4`, `BIGINT`, `INT8`, `SMALLINT`, `INT2`
- **Serial Types**: `SERIAL`, `BIGSERIAL` (auto-increment)
- **String Types**: `VARCHAR(n)`, `CHAR(n)`, `TEXT`
- **Boolean**: `BOOLEAN`, `BOOL`
- **Date/Time**: `TIMESTAMP`, `DATE`, `TIME`
- **Numeric**: `DECIMAL(p,s)`, `NUMERIC(p,s)`, `REAL`, `DOUBLE PRECISION`
- **PostgreSQL Specific**: `UUID`, `JSON`, `JSONB`
- **Array Types**: `INTEGER[]`, `TEXT[]`, etc.

#### Column Constraints
- `PRIMARY KEY` - Single or composite
- `NOT NULL` - Null constraint
- `UNIQUE` - Uniqueness constraint
- `DEFAULT value` - Default values (literals, functions)
- `REFERENCES table(column)` - Foreign key references

#### Table-Level Constraints
```sql
CREATE TABLE orders (
    id SERIAL,
    user_id INTEGER,
    product_id INTEGER,
    PRIMARY KEY (id),
    UNIQUE (user_id, product_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);
```

### 2. Foreign Key Constraints

#### Column-Level Foreign Keys
```sql
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
);
```

#### Table-Level Foreign Keys
```sql
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    CONSTRAINT fk_posts_user FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### Supported Actions
- `ON DELETE CASCADE`
- `ON DELETE SET NULL`
- `ON DELETE RESTRICT`
- `ON DELETE NO ACTION`
- `ON UPDATE CASCADE`
- `ON UPDATE SET NULL`
- `ON UPDATE RESTRICT`
- `ON UPDATE NO ACTION`

### 3. ALTER TABLE Statements (Limited Support)

Currently limited support for:
```sql
ALTER TABLE table_name ADD CONSTRAINT constraint_name 
FOREIGN KEY (column) REFERENCES other_table(column);
```

## Parser Architecture

### Primary Parser: pgsql-ast-parser
- Full PostgreSQL syntax support
- AST-based parsing for accuracy
- Better error reporting with line numbers
- Handles complex DDL constructs

### Fallback Parser: Regex-based
- Used when AST parser fails
- Limited to basic CREATE TABLE statements
- Regex patterns for column definitions
- Legacy compatibility

## Error Handling

### SchemaParsingError
Thrown when SQL syntax is invalid:
```typescript
{
  message: "Syntax error in DDL",
  line: 5,
  column: 12,
  sqlFragment: "Line 5: CREATE TABEL users..."
}
```

### ASTMappingError
Thrown when AST cannot be mapped to schema:
```typescript
{
  message: "Failed to extract column type",
  tableName: "users",
  columnName: "email"
}
```

### UnsupportedDDLError
Thrown for unsupported PostgreSQL features:
```typescript
{
  message: "ENUM types not supported",
  feature: "CREATE TYPE",
  suggestion: "Use VARCHAR instead"
}
```

## Limitations

### Not Currently Supported
- `CREATE TYPE` (ENUMs, composite types)
- `CREATE INDEX` statements
- `CHECK` constraints
- `EXCLUDE` constraints
- Advanced PostgreSQL features (arrays in constraints, etc.)
- `CREATE SEQUENCE` statements
- `CREATE VIEW` statements
- `CREATE FUNCTION` statements

### Workarounds
1. **ENUMs**: Use `VARCHAR` with documentation
2. **CHECK constraints**: Document in comments
3. **Complex types**: Use basic equivalent types

## Usage Examples

### Simple Schema
```sql
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Complex Schema with Multiple Constraints
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_profiles (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    bio TEXT,
    avatar_url TEXT
);
```

## Integration Notes

The parser automatically:
1. Extracts table definitions and relationships
2. Normalizes data types to standard format
3. Generates DBML for visualization
4. Creates positioned DTO objects for frontend
5. Provides detailed error messages for debugging

For complex schemas or unsupported features, the parser gracefully falls back to regex-based parsing while logging warnings for manual review.
