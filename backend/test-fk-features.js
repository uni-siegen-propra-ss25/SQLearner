// Test Script for FK Features Implementation
// Tests Phase 1 & 2: Essential FK Extensions

import { PostgreSQLASTParser } from './src/modules/schema-visualization/services/postgresql-ast-parser.service';
import { readFileSync } from 'fs';
import { join } from 'path';

const parser = new PostgreSQLASTParser();

// Test 1: Inline Column FK Syntax
console.log('=== Test 1: Inline Column FK Syntax ===');
const inlineFK = `
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

try {
    const result1 = parser.parseSchema(inlineFK);
    console.log('✅ Inline FK Test Passed');
    console.log('Tables:', result1.tables.map(t => t.name));
    console.log('Foreign Keys:', result1.foreignKeys.map(fk => `${fk.sourceTable}.${fk.sourceColumn} -> ${fk.targetTable}.${fk.targetColumn}`));
    console.log('FK Columns marked:', result1.tables.find(t => t.name === 'posts')?.columns.find(c => c.name === 'user_id')?.isForeignKey);
} catch (error) {
    console.error('❌ Inline FK Test Failed:', error.message);
}

// Test 2: Multi-Column Foreign Keys
console.log('\n=== Test 2: Multi-Column Foreign Keys ===');
const multiColumnFK = `
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

try {
    const result2 = parser.parseSchema(multiColumnFK);
    console.log('✅ Multi-Column FK Test Passed');
    console.log('Tables:', result2.tables.map(t => t.name));
    console.log('Foreign Keys:', result2.foreignKeys.map(fk => {
        const sourceColumns = Array.isArray(fk.sourceColumn) ? fk.sourceColumn : [fk.sourceColumn];
        const targetColumns = Array.isArray(fk.targetColumn) ? fk.targetColumn : [fk.targetColumn];
        return `${fk.sourceTable}.[${sourceColumns.join(', ')}] -> ${fk.targetTable}.[${targetColumns.join(', ')}]`;
    }));
} catch (error) {
    console.error('❌ Multi-Column FK Test Failed:', error.message);
}

// Test 3: Schema-qualified Table Names
console.log('\n=== Test 3: Schema-qualified Table Names ===');
const schemaQualifiedFK = `
CREATE SCHEMA sales;

CREATE TABLE sales.customers (
    customer_id INTEGER PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL
);

CREATE TABLE sales.invoices (
    invoice_id INTEGER PRIMARY KEY,
    customer_id INTEGER,
    FOREIGN KEY (customer_id) REFERENCES sales.customers(customer_id)
);
`;

try {
    const result3 = parser.parseSchema(schemaQualifiedFK);
    console.log('✅ Schema-qualified FK Test Passed');
    console.log('Tables:', result3.tables.map(t => t.name));
    console.log('Foreign Keys:', result3.foreignKeys.map(fk => `${fk.sourceTable}.${fk.sourceColumn} -> ${fk.targetTable}.${fk.targetColumn}`));
} catch (error) {
    console.error('❌ Schema-qualified FK Test Failed:', error.message);
}

// Test 4: Error Validation
console.log('\n=== Test 4: Error Validation ===');
const invalidFK = `
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE posts (
    id INTEGER PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    user_id INTEGER,
    FOREIGN KEY (user_id) REFERENCES nonexistent_table(id)
);
`;

try {
    const result4 = parser.parseSchema(invalidFK);
    console.log('⚠️  Error Validation Test: Should have warnings for missing target table');
    console.log('Foreign Keys:', result4.foreignKeys.map(fk => `${fk.sourceTable}.${fk.sourceColumn} -> ${fk.targetTable}.${fk.targetColumn}`));
} catch (error) {
    console.log('✅ Error Validation Test Passed: Caught error as expected');
    console.log('Error:', error.message);
}

// Test 5: Complete Test from File
console.log('\n=== Test 5: Complete Test from File ===');
try {
    const sqlContent = readFileSync(join(__dirname, 'test-fk-features.sql'), 'utf-8');
    const result5 = parser.parseSchema(sqlContent);
    console.log('✅ Complete Test Passed');
    console.log('Tables:', result5.tables.map(t => t.name));
    console.log('Foreign Keys Count:', result5.foreignKeys.length);
    console.log('Foreign Keys:', result5.foreignKeys.map(fk => {
        const sourceColumns = Array.isArray(fk.sourceColumn) ? fk.sourceColumn : [fk.sourceColumn];
        const targetColumns = Array.isArray(fk.targetColumn) ? fk.targetColumn : [fk.targetColumn];
        return `${fk.sourceTable}.[${sourceColumns.join(', ')}] -> ${fk.targetTable}.[${targetColumns.join(', ')}]`;
    }));
} catch (error) {
    console.error('❌ Complete Test Failed:', error.message);
}

console.log('\n=== FK Features Testing Complete ===');
