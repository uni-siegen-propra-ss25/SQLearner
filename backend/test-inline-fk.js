const { PostgreSQLASTParser } = require('./dist/modules/schema-visualization/services/postgresql-ast-parser.service');

const parser = new PostgreSQLASTParser();

const sql = `
-- Kunden
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100)
);

-- Produkte
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    price DECIMAL(10,2)
);

-- Bestellungen (FK zu customers)
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    order_date DATE
);

-- Bestellpositionen (FK zu orders und products)
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER
);
`;

try {
  const result = parser.parseSchema(sql);
  console.log('=== PARSING RESULT ===');
  console.log('Tables:', result.tables.length);
  console.log('Foreign Keys:', result.foreignKeys.length);
  
  console.log('\n=== TABLES ===');
  result.tables.forEach(table => {
    console.log(`Table: ${table.name}`);
    table.columns.forEach(col => {
      console.log(`  - ${col.name} (${col.type}) [PK: ${col.isPrimaryKey}, FK: ${col.isForeignKey}]`);
    });
  });
  
  console.log('\n=== FOREIGN KEYS ===');
  result.foreignKeys.forEach(fk => {
    console.log(`FK: ${fk.sourceTable}.${fk.sourceColumn} -> ${fk.targetTable}.${fk.targetColumn}`);
  });
  
} catch (error) {
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
}
