// Simple test to verify ER diagram component parsing
const dbmlCode = `
Project TestSchema {
  database_type: 'PostgreSQL'
  Note: 'Generated from SQL Schema via pgsql-ast-parser'
}

Table orders {
  order_id INTEGER [pk]
  customer_id INTEGER [pk]
}

Table order_items {
  item_id SERIAL [pk]
  order_id INTEGER
  customer_id INTEGER
}

Ref: (order_items.order_id, order_items.customer_id) > (orders.order_id, orders.customer_id)
`;

// Simple regex parsing (mimics the component logic)
const relationships = [];

// Pattern for composite relationships: (table.col1, table.col2) > (table.col1, table.col2)
const compositeRefRegex = /\(([^)]+)\)\s*>\s*\(([^)]+)\)/g;

let match;
while ((match = compositeRefRegex.exec(dbmlCode)) !== null) {
  const fromPart = match[1];
  const toPart = match[2];
  
  // Parse source columns from "table.col1, table.col2" format
  const fromColumns = [];
  const toColumns = [];
  
  // Parse from part
  const fromEntries = fromPart.split(',').map(s => s.trim());
  for (const entry of fromEntries) {
    const [table, column] = entry.split('.');
    if (table && column) {
      fromColumns.push({ table: table.trim(), column: column.trim() });
    }
  }
  
  // Parse to part
  const toEntries = toPart.split(',').map(s => s.trim());
  for (const entry of toEntries) {
    const [table, column] = entry.split('.');
    if (table && column) {
      toColumns.push({ table: table.trim(), column: column.trim() });
    }
  }
  
  if (fromColumns.length > 0 && toColumns.length > 0 && fromColumns.length === toColumns.length) {
    relationships.push({
      fromTable: fromColumns[0].table,
      fromColumn: fromColumns.map(c => c.column),
      toTable: toColumns[0].table,
      toColumn: toColumns.map(c => c.column)
    });
  }
}

console.log('=== ER DIAGRAM PARSING TEST ===');
console.log('Input DBML:');
console.log(dbmlCode);
console.log('\nParsed Relationships:');
relationships.forEach((rel, index) => {
  console.log(`${index + 1}. ${rel.fromTable}.[${rel.fromColumn.join(', ')}] -> ${rel.toTable}.[${rel.toColumn.join(', ')}]`);
  console.log(`   Composite: ${Array.isArray(rel.fromColumn) && rel.fromColumn.length > 1}`);
});

console.log(`\nTotal relationships found: ${relationships.length}`);
