import { parse } from 'pgsql-ast-parser';

const sql = `
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100)
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    order_date DATE
);
`;

try {
  const ast = parse(sql);
  console.log('=== AST STRUCTURE ===');
  console.log(JSON.stringify(ast, null, 2));
  
  // Fokus auf die orders-Tabelle
  const ordersTable = ast.find(stmt => stmt.type === 'create table' && (stmt as any).name?.name === 'orders');
  if (ordersTable) {
    console.log('\n=== ORDERS TABLE ===');
    console.log(JSON.stringify(ordersTable, null, 2));
    
    // Fokus auf customer_id Spalte
    const customerIdColumn = (ordersTable as any).columns?.find((col: any) => col.name?.name === 'customer_id');
    if (customerIdColumn) {
      console.log('\n=== CUSTOMER_ID COLUMN ===');
      console.log(JSON.stringify(customerIdColumn, null, 2));
    }
  }
  
} catch (error) {
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
}
