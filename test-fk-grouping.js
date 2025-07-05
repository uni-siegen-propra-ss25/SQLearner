// Test für die reparierte FK-Gruppierung
const testData = [
  {
    constraint_name: 'fk_order_items_order',
    column_name: 'order_id',
    ordinal_position: 1,
    foreign_table_name: 'orders',
    foreign_column_name: 'order_id'
  },
  {
    constraint_name: 'fk_order_items_order',
    column_name: 'customer_id', 
    ordinal_position: 2,
    foreign_table_name: 'orders',
    foreign_column_name: 'customer_id'
  },
  {
    constraint_name: 'fk_order_items_user',
    column_name: 'user_id',
    ordinal_position: 1,
    foreign_table_name: 'users',
    foreign_column_name: 'id'
  }
];

console.log('=== TESTING FK GROUPING LOGIC ===');
console.log('Input data (simulated DB rows):');
console.log(testData);

// Group foreign keys by constraint_name to handle composite FKs correctly
const fkGroups = new Map();

for (const fk of testData) {
    if (!fkGroups.has(fk.constraint_name)) {
        fkGroups.set(fk.constraint_name, {
            localColumns: [],
            foreignTable: fk.foreign_table_name,
            foreignColumns: []
        });
    }
    
    const group = fkGroups.get(fk.constraint_name);
    group.localColumns.push(fk.column_name);
    group.foreignColumns.push(fk.foreign_column_name);
}

console.log('\n=== GROUPED FK RESULTS ===');
for (const [constraintName, fkGroup] of fkGroups) {
    const localCols = fkGroup.localColumns.join(', ');
    const foreignCols = fkGroup.foreignColumns.join(', ');
    const sql = `FOREIGN KEY (${localCols}) REFERENCES ${fkGroup.foreignTable}(${foreignCols})`;
    console.log(`${constraintName}: ${sql}`);
}

console.log('\n=== EXPECTED OUTPUT ===');
console.log('Should show:');
console.log('1. One composite FK: FOREIGN KEY (order_id, customer_id) REFERENCES orders(order_id, customer_id)');
console.log('2. One single FK: FOREIGN KEY (user_id) REFERENCES users(id)');
