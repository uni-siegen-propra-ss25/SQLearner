// Test script for composite foreign keys
const { PostgreSQLASTParser } = require('./src/modules/schema-visualization/services/postgresql-ast-parser.service');
const fs = require('fs');

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

const parser = new PostgreSQLASTParser();
const result = parser.parseSchema(testSchema);

console.log('=== PARSED SCHEMA ===');
console.log('Tables:', result.tables.length);
console.log('Foreign Keys:', result.foreignKeys.length);

result.foreignKeys.forEach((fk, i) => {
    const sourceColumns = Array.isArray(fk.sourceColumn) ? fk.sourceColumn.join(', ') : fk.sourceColumn;
    const targetColumns = Array.isArray(fk.targetColumn) ? fk.targetColumn.join(', ') : fk.targetColumn;
    console.log(`FK ${i+1}: ${fk.sourceTable}.[${sourceColumns}] -> ${fk.targetTable}.[${targetColumns}]`);
});

// Test DBML generation
const { SchemaVisualizationService } = require('./src/modules/schema-visualization/services/schema-visualization.service');
const mockDatabasesService = { findOne: jest.fn() };
const service = new SchemaVisualizationService(mockDatabasesService);
const dbmlCode = service.convertTypedSchemaToDbml(result, 'Test Schema');

console.log('\n=== DBML OUTPUT ===');
console.log(dbmlCode);
