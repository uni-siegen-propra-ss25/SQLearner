import { PostgreSQLASTParser } from './src/modules/schema-visualization/services/postgresql-ast-parser.service';

const parser = new PostgreSQLASTParser();

const sql = `
-- Multi-Column Foreign Key Test
CREATE TABLE orders (
    order_id INTEGER,
    customer_id INTEGER,
    PRIMARY KEY (order_id, customer_id)
);

CREATE TABLE order_items (
    item_id SERIAL PRIMARY KEY,
    order_id INTEGER,
    customer_id INTEGER,
    FOREIGN KEY (order_id, customer_id) REFERENCES orders(order_id, customer_id)
);

-- Schema-qualified Test
CREATE SCHEMA sales;

CREATE TABLE sales.customers (
    customer_id SERIAL PRIMARY KEY,
    name VARCHAR(100)
);

CREATE TABLE sales.invoices (
    invoice_id SERIAL PRIMARY KEY,
    customer_id INTEGER,
    FOREIGN KEY (customer_id) REFERENCES sales.customers(customer_id)
);

-- Mixed FK Types Test
CREATE TABLE departments (
    dept_id SERIAL PRIMARY KEY,
    dept_name VARCHAR(100)
);

CREATE TABLE employees (
    emp_id SERIAL PRIMARY KEY,
    dept_id INTEGER REFERENCES departments(dept_id),
    manager_id INTEGER REFERENCES employees(emp_id)
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
    const sourceCol = Array.isArray(fk.sourceColumn) ? `[${fk.sourceColumn.join(', ')}]` : fk.sourceColumn;
    const targetCol = Array.isArray(fk.targetColumn) ? `[${fk.targetColumn.join(', ')}]` : fk.targetColumn;
    console.log(`FK: ${fk.sourceTable}.${sourceCol} -> ${fk.targetTable}.${targetCol}`);
  });
  
} catch (error) {
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
}
