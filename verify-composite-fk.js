// Simple test to verify composite FK behavior
const fs = require('fs');
const path = require('path');

// Test schema with composite FK
const testSchema = `
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

console.log('🧪 Testing Composite FK Behavior');
console.log('=====================================');
console.log('Test Schema:');
console.log(testSchema);
console.log('\n📋 Expected Results:');
console.log('1. Backend should parse ONE composite FK (not multiple single FKs)');
console.log('2. DBML should contain ONE Ref line: (order_items.order_id, order_items.customer_id) > (orders.order_id, orders.customer_id)');
console.log('3. Frontend should show ONE relationship with tooltip: FK → orders(order_id, customer_id)');
console.log('\n✅ To verify: Start the application and test with this schema');
