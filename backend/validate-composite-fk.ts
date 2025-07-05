// Temporary test to validate composite FK behavior
import { PostgreSQLASTParser } from './src/modules/schema-visualization/services/postgresql-ast-parser.service';
import { SchemaVisualizationService } from './src/modules/schema-visualization/services/schema-visualization.service';

// Mock DatabasesService
const mockDatabasesService = {
  findOne: jest.fn(),
  getDatabaseSchema: jest.fn()
};

const testSchema = `
-- Test schema for composite foreign keys
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE orders (
    order_id INTEGER,
    customer_id INTEGER,
    order_date DATE,
    PRIMARY KEY (order_id, customer_id)
);

CREATE TABLE order_items (
    item_id INTEGER PRIMARY KEY,
    order_id INTEGER,
    customer_id INTEGER,
    product_name VARCHAR(200),
    quantity INTEGER,
    created_by INTEGER,
    -- Composite FK - this should be treated as ONE relationship
    FOREIGN KEY (order_id, customer_id) REFERENCES orders(order_id, customer_id),
    -- Single column FK
    FOREIGN KEY (created_by) REFERENCES users(id)
);
`;

console.log('🔬 === COMPOSITE FK VALIDATION TEST ===');

// 1. Test AST Parser
const parser = new PostgreSQLASTParser();
const typedSchema = parser.parseSchema(testSchema);

console.log('✅ AST Parser Results:');
console.log('   Tables:', typedSchema.tables.length);
console.log('   Foreign Keys:', typedSchema.foreignKeys.length);

// Debug each FK
typedSchema.foreignKeys.forEach((fk, i) => {
  const sourceColumns = Array.isArray(fk.sourceColumn) ? fk.sourceColumn : [fk.sourceColumn];
  const targetColumns = Array.isArray(fk.targetColumn) ? fk.targetColumn : [fk.targetColumn];
  
  console.log(`   FK ${i+1}: ${fk.sourceTable}.[${sourceColumns.join(', ')}] -> ${fk.targetTable}.[${targetColumns.join(', ')}]`);
  console.log(`         Type: ${Array.isArray(fk.sourceColumn) ? 'COMPOSITE' : 'SINGLE'}`);
});

// 2. Test Service Layer
const service = new SchemaVisualizationService(mockDatabasesService as any);

// Use the private method by casting the service
const dbmlCode = (service as any).convertTypedSchemaToDbml(typedSchema, 'Test Schema');

console.log('\n📊 DBML Generation Results:');
console.log('DBML Code:');
console.log(dbmlCode);

// 3. Test DTO Mapping
const { tables, relationships } = (service as any).mapTypedSchemaToDto(typedSchema);

console.log('\n🔗 DTO Mapping Results:');
console.log('   Tables:', tables.length);
console.log('   Relationships:', relationships.length);

relationships.forEach((rel, i) => {
  const fromColumns = Array.isArray(rel.fromColumn) ? rel.fromColumn : [rel.fromColumn];
  const toColumns = Array.isArray(rel.toColumn) ? rel.toColumn : [rel.toColumn];
  
  console.log(`   Relationship ${i+1}: ${rel.fromTable}.[${fromColumns.join(', ')}] -> ${rel.toTable}.[${toColumns.join(', ')}]`);
  console.log(`                    Type: ${Array.isArray(rel.fromColumn) ? 'COMPOSITE' : 'SINGLE'}`);
});

console.log('\n🎯 === VALIDATION SUMMARY ===');
console.log('Expected: 2 foreign keys (1 composite, 1 single)');
console.log('Actual:', typedSchema.foreignKeys.length, 'foreign keys');
console.log('Expected: 2 relationships (1 composite, 1 single)');
console.log('Actual:', relationships.length, 'relationships');

// Check for specific composite FK
const compositeFK = typedSchema.foreignKeys.find(fk => Array.isArray(fk.sourceColumn) && fk.sourceColumn.length === 2);
if (compositeFK) {
  console.log('✅ Composite FK found correctly');
} else {
  console.log('❌ Composite FK not found or incorrectly parsed');
}

// Check for specific single FK
const singleFK = typedSchema.foreignKeys.find(fk => !Array.isArray(fk.sourceColumn) && fk.sourceColumn === 'created_by');
if (singleFK) {
  console.log('✅ Single FK found correctly');
} else {
  console.log('❌ Single FK not found or incorrectly parsed');
}

export { }; // Make this a module
