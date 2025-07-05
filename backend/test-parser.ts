import { PostgreSQLASTParser } from './src/modules/schema-visualization/services/postgresql-ast-parser.service';

const parser = new PostgreSQLASTParser();

// Test schema with FK issues
const testSchema = `
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE posts (
  id INTEGER PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  user_id INTEGER REFERENCES users(id)
);
`;

console.log('Testing PostgreSQL AST Parser...\n');

try {
  const result = parser.parseSchema(testSchema);
  
  console.log('✅ Parsing successful!');
  console.log(`Tables found: ${result.tables.length}`);
  console.log(`Foreign keys found: ${result.foreignKeys.length}`);
  
  console.log('\n--- Tables ---');
  result.tables.forEach(table => {
    console.log(`Table: ${table.name}`);
    table.columns.forEach(col => {
      console.log(`  - ${col.name} (${col.type}) PK:${col.isPrimaryKey} FK:${col.isForeignKey}`);
    });
  });
  
  console.log('\n--- Foreign Keys ---');
  result.foreignKeys.forEach(fk => {
    console.log(`FK: ${fk.sourceTable}.${fk.sourceColumn} -> ${fk.targetTable}.${fk.targetColumn}`);
  });
  
} catch (error) {
  console.log('❌ Parsing failed:', error.message);
  console.log('Error details:', error);
}
