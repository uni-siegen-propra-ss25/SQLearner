// Test the frontend parsing logic
// This should be run in the browser console or as a Node.js script

const testDbml = `
Project Test {
  database_type: 'PostgreSQL'
  Note: 'Generated from SQL Schema via pgsql-ast-parser'
}

Table orders {
  order_id integer [pk, not null]
  customer_id integer [pk, not null]
}

Table order_items {
  item_id integer [pk, not null]
  order_id integer [not null]
  customer_id integer [not null]
}

Ref: (order_items.order_id, order_items.customer_id) > (orders.order_id, orders.customer_id)
`;

console.log('🧪 Testing Frontend DBML Parsing');
console.log('=================================');
console.log('Test DBML:');
console.log(testDbml);
console.log('\n📋 Expected Frontend Parsing:');
console.log('1. Should parse 2 tables');
console.log('2. Should parse 1 composite relationship');
console.log('3. Relationship should have fromColumn as array: ["order_id", "customer_id"]');
console.log('4. Relationship should have toColumn as array: ["order_id", "customer_id"]');
console.log('5. isCompositeRelationship() should return true');
console.log('6. getRelationshipTooltip() should return "FK → orders(order_id, customer_id)"');
console.log('\n✅ This DBML should work correctly with the frontend parsing logic');
