import { PostgreSQLASTParser } from './src/modules/schema-visualization/services/postgresql-ast-parser.service';

console.log('🔬 === SCHEMA VISUALIZATION FEATURE TEST ===');

const parser = new PostgreSQLASTParser();

const testSchema = `
-- Test Schema: E-Commerce Database
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2)
);

-- Inline FK Test
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    order_date DATE NOT NULL
);

-- Multi-Column FK Test
CREATE TABLE order_products (
    order_id INTEGER,
    product_id INTEGER,
    quantity INTEGER NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    PRIMARY KEY (order_id, product_id)
);

-- Self-Referencing FK Test
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    manager_id INTEGER REFERENCES employees(id)
);
`;

console.log('📋 Parsing schema...');
const result = parser.parseSchema(testSchema);

console.log('✅ Schema parsing completed!');
console.log(`📊 Results: ${result.tables.length} tables, ${result.foreignKeys.length} foreign keys`);

console.log('\n--- TABLES ---');
result.tables.forEach(table => {
    console.log(`🏷️  ${table.name}`);
    table.columns.forEach(col => {
        const flags: string[] = [];
        if (col.isPrimaryKey) flags.push('PK');
        if (col.isForeignKey) flags.push('FK');
        if (col.isUnique) flags.push('UNIQUE');
        if (!col.isNullable) flags.push('NOT NULL');
        
        console.log(`   - ${col.name} (${col.type}) ${flags.join(', ')}`);
    });
});

console.log('\n--- FOREIGN KEYS ---');
result.foreignKeys.forEach(fk => {
    const sourceCol = Array.isArray(fk.sourceColumn) ? fk.sourceColumn.join(', ') : fk.sourceColumn;
    const targetCol = Array.isArray(fk.targetColumn) ? fk.targetColumn.join(', ') : fk.targetColumn;
    
    console.log(`🔗 ${fk.sourceTable}.[${sourceCol}] -> ${fk.targetTable}.[${targetCol}]`);
    if (fk.onDelete) console.log(`   ON DELETE: ${fk.onDelete}`);
    if (fk.onUpdate) console.log(`   ON UPDATE: ${fk.onUpdate}`);
});

console.log('\n🎉 Feature test completed successfully!');
