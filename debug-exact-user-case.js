import { PostgreSQLASTParser } from './backend/src/modules/schema-visualization/services/postgresql-ast-parser.service';
import { SchemaVisualizationService } from './backend/src/modules/schema-visualization/services/schema-visualization.service';
import { readFileSync } from 'fs';

const parser = new PostgreSQLASTParser();
const visualizationService = new SchemaVisualizationService();

// Test with the exact user input
const userSql = readFileSync('debug-exact-user-input.sql', 'utf8');
console.log('=== USER INPUT SQL ===');
console.log(userSql);
console.log('\n=== PARSER RESULT ===');

try {
  const result = parser.parseSchema(userSql);
  
  console.log('Tables:', result.tables.length);
  console.log('Foreign Keys:', result.foreignKeys.length);
  
  console.log('\n=== FOREIGN KEYS DETAILED ===');
  result.foreignKeys.forEach((fk, index) => {
    console.log(`FK ${index + 1}:`);
    console.log(`  Source: ${fk.sourceTable}.${Array.isArray(fk.sourceColumn) ? `[${fk.sourceColumn.join(', ')}]` : fk.sourceColumn}`);
    console.log(`  Target: ${fk.targetTable}.${Array.isArray(fk.targetColumn) ? `[${fk.targetColumn.join(', ')}]` : fk.targetColumn}`);
    console.log(`  Constraint: ${fk.constraintName || 'unnamed'}`);
    console.log('');
  });
  
  console.log('\n=== DBML GENERATION ===');
  const dbmlCode = visualizationService.convertTypedSchemaToDbml(result, 'TestDB');
  console.log(dbmlCode);
  
  console.log('\n=== COLUMNS WITH FK FLAGS ===');
  result.tables.forEach(table => {
    console.log(`Table: ${table.name}`);
    table.columns.forEach(col => {
      if (col.isForeignKey) {
        console.log(`  FK Column: ${col.name} (${col.type})`);
      }
    });
  });
  
} catch (error) {
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
}
