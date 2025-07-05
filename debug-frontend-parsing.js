// Test für Frontend DBML Parsing Bug
const dbmlCode = `
Project TestSchema {
  database_type: 'PostgreSQL'
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

console.log('=== TESTING FRONTEND DBML PARSING ===');
console.log('DBML Code:');
console.log(dbmlCode);

const relationships = [];

// Pattern for single column relationships: table.column > table.column
const singleRefRegex = /(\w+)\.(\w+)\s*>\s*(\w+)\.(\w+)/g;

// Pattern for composite relationships: (table.col1, table.col2) > (table.col1, table.col2)
const compositeRefRegex = /\(([^)]+)\)\s*>\s*\(([^)]+)\)/g;

let match;

console.log('\n=== SINGLE REF REGEX MATCHES ===');
while ((match = singleRefRegex.exec(dbmlCode)) !== null) {
  console.log(`Found: ${match[1]}.${match[2]} > ${match[3]}.${match[4]}`);
  relationships.push({
    fromTable: match[1],
    fromColumn: match[2],
    toTable: match[3],
    toColumn: match[4],
    type: 'single'
  });
}

// Reset regex lastIndex for composite search
compositeRefRegex.lastIndex = 0;

console.log('\n=== COMPOSITE REF REGEX MATCHES ===');
while ((match = compositeRefRegex.exec(dbmlCode)) !== null) {
  console.log(`Found composite: (${match[1]}) > (${match[2]})`);
  
  const fromPart = match[1];
  const toPart = match[2];
  
  // Simple parsing
  const fromColumns = fromPart.split(',').map(s => {
    const [table, column] = s.trim().split('.');
    return { table: table.trim(), column: column.trim() };
  });
  
  const toColumns = toPart.split(',').map(s => {
    const [table, column] = s.trim().split('.');
    return { table: table.trim(), column: column.trim() };
  });
  
  relationships.push({
    fromTable: fromColumns[0].table,
    fromColumn: fromColumns.map(c => c.column),
    toTable: toColumns[0].table,
    toColumn: toColumns.map(c => c.column),
    type: 'composite'
  });
}

console.log('\n=== FINAL RELATIONSHIPS ===');
relationships.forEach((rel, index) => {
  const fromCol = Array.isArray(rel.fromColumn) ? `[${rel.fromColumn.join(', ')}]` : rel.fromColumn;
  const toCol = Array.isArray(rel.toColumn) ? `[${rel.toColumn.join(', ')}]` : rel.toColumn;
  console.log(`${index + 1}. ${rel.type}: ${rel.fromTable}.${fromCol} → ${rel.toTable}.${toCol}`);
});

console.log(`\nTotal relationships: ${relationships.length}`);
