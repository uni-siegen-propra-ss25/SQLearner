// Debug-Test für Composite FK Parsing
const { PostgreSQLASTParser } = require('./backend/src/modules/schema-visualization/services/postgresql-ast-parser.service');

const testSchema = `
CREATE TABLE orders (
    order_id INTEGER,
    customer_id INTEGER,
    PRIMARY KEY (order_id, customer_id)
);

CREATE TABLE order_items (
    item_id INTEGER PRIMARY KEY,
    order_id INTEGER,
    customer_id INTEGER,
    FOREIGN KEY (order_id, customer_id) REFERENCES orders(order_id, customer_id)
);
`;

console.log('🧪 DEBUG: Testing Composite FK Parsing');
console.log('=====================================');

try {
  const parser = new PostgreSQLASTParser();
  const result = parser.parseSchema(testSchema);
  
  console.log('\n📊 RESULTS:');
  console.log(`Tables: ${result.tables.length}`);
  console.log(`Foreign Keys: ${result.foreignKeys.length}`);
  
  console.log('\n🔗 Foreign Keys Details:');
  result.foreignKeys.forEach((fk, index) => {
    console.log(`FK ${index + 1}:`);
    console.log(`  Source: ${fk.sourceTable}.${Array.isArray(fk.sourceColumn) ? '[' + fk.sourceColumn.join(', ') + ']' : fk.sourceColumn}`);
    console.log(`  Target: ${fk.targetTable}.${Array.isArray(fk.targetColumn) ? '[' + fk.targetColumn.join(', ') + ']' : fk.targetColumn}`);
    console.log(`  Is Composite: ${Array.isArray(fk.sourceColumn)}`);
  });
  
} catch (error) {
  console.error('❌ Error:', error.message);
}
