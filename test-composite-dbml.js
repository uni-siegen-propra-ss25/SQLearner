const { PostgreSQLASTParser } = require('./backend/src/modules/schema-visualization/services/postgresql-ast-parser.service');
const { SchemaVisualizationService } = require('./backend/src/modules/schema-visualization/services/schema-visualization.service');
const fs = require('fs');

// Read the test schema
const testSchema = fs.readFileSync('./test-composite-fk.sql', 'utf8');

console.log('🧪 Testing Composite FK Parsing & DBML Generation');
console.log('==================================================\n');

console.log('📋 Test Schema:');
console.log(testSchema);
console.log('\n' + '='.repeat(50));

// Test 1: AST Parser
console.log('\n🔍 Test 1: AST Parser');
try {
  const astParser = new PostgreSQLASTParser();
  const parsedSchema = astParser.parseSchema(testSchema);
  
  console.log('✅ AST Parsing Success');
  console.log(`📊 Tables: ${parsedSchema.tables.length}`);
  console.log(`🔗 Foreign Keys: ${parsedSchema.foreignKeys.length}`);
  
  // Log each foreign key
  parsedSchema.foreignKeys.forEach((fk, index) => {
    const sourceColumns = Array.isArray(fk.sourceColumn) ? fk.sourceColumn : [fk.sourceColumn];
    const targetColumns = Array.isArray(fk.targetColumn) ? fk.targetColumn : [fk.targetColumn];
    
    console.log(`   FK ${index + 1}: ${fk.sourceTable}.[${sourceColumns.join(', ')}] -> ${fk.targetTable}.[${targetColumns.join(', ')}]`);
  });
  
  // Test 2: DBML Generation
  console.log('\n🎨 Test 2: DBML Generation');
  const visualizationService = new SchemaVisualizationService();
  const dbmlResult = visualizationService.convertTypedSchemaToDbml(parsedSchema, 'TestDB');
  
  console.log('✅ DBML Generation Success');
  console.log('\n📋 Generated DBML:');
  console.log(dbmlResult);
  
  // Check for composite FK pattern
  const hasCompositeRef = /Ref: \(.*,.*\) > \(.*,.*\)/.test(dbmlResult);
  console.log(`\n🔍 Composite FK Pattern Found: ${hasCompositeRef ? '✅' : '❌'}`);
  
} catch (error) {
  console.error('❌ Test Failed:', error.message);
  console.error(error.stack);
}
