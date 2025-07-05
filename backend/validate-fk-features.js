// Simple validation test for FK features
const { PostgreSQLASTParser } = require('./src/modules/schema-visualization/services/postgresql-ast-parser.service');

console.log('🔍 Testing FK Features Implementation...\n');

// Test 1: Basic Inline FK
console.log('=== Test 1: Basic Inline FK ===');
const inlineTest = `
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
    const parser = new PostgreSQLASTParser();
    const result = parser.parseSchema(inlineTest);
    
    console.log('✅ Parse successful');
    console.log('Tables:', result.tables.length);
    console.log('Foreign Keys:', result.foreignKeys.length);
    console.log('FK Details:', result.foreignKeys.map(fk => `${fk.sourceTable}.${fk.sourceColumn} -> ${fk.targetTable}.${fk.targetColumn}`));
    
    // Check if column is marked as FK
    const postsTable = result.tables.find(t => t.name === 'posts');
    const userIdCol = postsTable?.columns.find(c => c.name === 'user_id');
    console.log('user_id marked as FK:', userIdCol?.isForeignKey || false);
    
} catch (error) {
    console.error('❌ Test failed:', error.message);
}

// Test 2: Multi-Column FK
console.log('\n=== Test 2: Multi-Column FK ===');
const multiColumnTest = `
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
    const parser = new PostgreSQLASTParser();
    const result = parser.parseSchema(multiColumnTest);
    
    console.log('✅ Parse successful');
    console.log('Tables:', result.tables.length);
    console.log('Foreign Keys:', result.foreignKeys.length);
    
    if (result.foreignKeys.length > 0) {
        const fk = result.foreignKeys[0];
        console.log('Multi-column FK detected:', Array.isArray(fk.sourceColumn));
        console.log('Source columns:', fk.sourceColumn);
        console.log('Target columns:', fk.targetColumn);
    }
    
} catch (error) {
    console.error('❌ Test failed:', error.message);
}

// Test 3: Error validation
console.log('\n=== Test 3: Error Validation ===');
const errorTest = `
CREATE TABLE posts (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
`;

try {
    const parser = new PostgreSQLASTParser();
    const result = parser.parseSchema(errorTest);
    console.log('⚠️  Should have thrown error but didn\'t');
} catch (error) {
    console.log('✅ Correctly caught error:', error.message);
}

console.log('\n🎯 FK Features Testing Complete!');
