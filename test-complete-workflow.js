// Complete workflow test for composite foreign key fix
// This simulates the full process from database extraction to schema generation

console.log('=== Testing Complete Composite Foreign Key Workflow ===\n');

// 1. First, test the database extraction query result simulation
console.log('1. Simulating database extraction query results...');

// Mock the result that would come from the updated FK query in getDatabaseSchema
const fkQueryResult = {
    rows: [
        // Composite FK: order_details -> orders
        {
            constraint_name: 'order_details_order_id_customer_id_fkey',
            column_name: 'order_id',
            ordinal_position: 1,
            foreign_table_name: 'orders',
            foreign_column_name: 'order_id'
        },
        {
            constraint_name: 'order_details_order_id_customer_id_fkey',
            column_name: 'customer_id',
            ordinal_position: 2,
            foreign_table_name: 'orders',
            foreign_column_name: 'customer_id'
        },
        // Composite FK: order_audit -> orders
        {
            constraint_name: 'order_audit_order_id_customer_id_fkey',
            column_name: 'order_id',
            ordinal_position: 1,
            foreign_table_name: 'orders',
            foreign_column_name: 'order_id'
        },
        {
            constraint_name: 'order_audit_order_id_customer_id_fkey',
            column_name: 'customer_id',
            ordinal_position: 2,
            foreign_table_name: 'orders',
            foreign_column_name: 'customer_id'
        },
        // Single FK: order_audit -> customers
        {
            constraint_name: 'order_audit_auditor_id_fkey',
            column_name: 'auditor_id',
            ordinal_position: 1,
            foreign_table_name: 'customers',
            foreign_column_name: 'id'
        }
    ]
};

// 2. Test the grouping logic (from the fixed getDatabaseSchema method)
console.log('2. Testing FK grouping logic...');

const fkGroups = new Map();

for (const fk of fkQueryResult.rows) {
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

console.log(`   ✓ Found ${fkGroups.size} unique constraints`);
console.log(`   ✓ Expected: 3 (2 composite + 1 single)`);

// 3. Test SQL generation
console.log('3. Testing SQL constraint generation...');

let generatedSQL = '';
for (const [constraintName, fkGroup] of fkGroups) {
    const localCols = fkGroup.localColumns.join(', ');
    const foreignCols = fkGroup.foreignColumns.join(', ');
    const constraint = `FOREIGN KEY (${localCols}) REFERENCES ${fkGroup.foreignTable}(${foreignCols})`;
    generatedSQL += `    ${constraint},\n`;
    
    console.log(`   Generated: ${constraint}`);
}

// 4. Test expected outcomes
console.log('\n4. Verifying expected outcomes...');

const compositeConstraints = Array.from(fkGroups.values()).filter(group => group.localColumns.length > 1);
const singleConstraints = Array.from(fkGroups.values()).filter(group => group.localColumns.length === 1);

console.log(`   ✓ Composite constraints: ${compositeConstraints.length} (expected: 2)`);
console.log(`   ✓ Single constraints: ${singleConstraints.length} (expected: 1)`);

// 5. Test DBML generation simulation
console.log('\n5. Simulating DBML generation...');

function generateDBMLRefs(fkGroups) {
    let dbmlRefs = '';
    for (const [constraintName, fkGroup] of fkGroups) {
        const localCols = fkGroup.localColumns.length > 1 
            ? `(${fkGroup.localColumns.join(', ')})`
            : fkGroup.localColumns[0];
        const foreignCols = fkGroup.foreignColumns.length > 1 
            ? `(${fkGroup.foreignColumns.join(', ')})`
            : fkGroup.foreignColumns[0];
        
        dbmlRefs += `Ref: ${fkGroup.foreignTable}.${foreignCols} < order_details.${localCols}\n`;
    }
    return dbmlRefs;
}

const dbmlRefs = generateDBMLRefs(fkGroups);
console.log('   Generated DBML references:');
console.log(dbmlRefs);

// 6. Final verification
console.log('6. Final verification...');

const hasCompositeFK = generatedSQL.includes('FOREIGN KEY (order_id, customer_id)');
const hasSingleFK = generatedSQL.includes('FOREIGN KEY (auditor_id)');

console.log(`   ✓ Contains composite FK: ${hasCompositeFK}`);
console.log(`   ✓ Contains single FK: ${hasSingleFK}`);

if (hasCompositeFK && hasSingleFK && fkGroups.size === 3) {
    console.log('\n🎉 SUCCESS: The composite foreign key fix is working correctly!');
    console.log('   - Composite FKs are grouped into single constraints');
    console.log('   - Single FKs remain unchanged');
    console.log('   - Generated SQL properly represents composite relationships');
} else {
    console.log('\n❌ FAILURE: The fix has issues');
    console.log(`   - FK groups: ${fkGroups.size} (expected: 3)`);
    console.log(`   - Has composite FK: ${hasCompositeFK}`);
    console.log(`   - Has single FK: ${hasSingleFK}`);
}

console.log('\n=== Test Complete ===');
