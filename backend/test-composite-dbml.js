/**
 * Isolated test for composite foreign key handling
 * This file tests the backend functionality without dependencies
 */

// Test data simulating the parsed schema
const testSchema = {
  tables: [
    {
      name: 'users',
      columns: [
        {
          name: 'id',
          type: 'INTEGER',
          isPrimaryKey: true,
          isNullable: false,
          isUnique: false,
          isForeignKey: false,
          constraints: ['PRIMARY KEY']
        },
        {
          name: 'name',
          type: 'VARCHAR(100)',
          isPrimaryKey: false,
          isNullable: false,
          isUnique: false,
          isForeignKey: false,
          constraints: ['NOT NULL']
        }
      ]
    },
    {
      name: 'orders',
      columns: [
        {
          name: 'order_id',
          type: 'INTEGER',
          isPrimaryKey: true,
          isNullable: false,
          isUnique: false,
          isForeignKey: false,
          constraints: ['PRIMARY KEY']
        },
        {
          name: 'customer_id',
          type: 'INTEGER',
          isPrimaryKey: true,
          isNullable: false,
          isUnique: false,
          isForeignKey: false,
          constraints: ['PRIMARY KEY']
        },
        {
          name: 'order_date',
          type: 'DATE',
          isPrimaryKey: false,
          isNullable: true,
          isUnique: false,
          isForeignKey: false,
          constraints: []
        }
      ]
    },
    {
      name: 'order_items',
      columns: [
        {
          name: 'item_id',
          type: 'INTEGER',
          isPrimaryKey: true,
          isNullable: false,
          isUnique: false,
          isForeignKey: false,
          constraints: ['PRIMARY KEY']
        },
        {
          name: 'order_id',
          type: 'INTEGER',
          isPrimaryKey: false,
          isNullable: true,
          isUnique: false,
          isForeignKey: true,
          constraints: ['FOREIGN KEY']
        },
        {
          name: 'customer_id',
          type: 'INTEGER',
          isPrimaryKey: false,
          isNullable: true,
          isUnique: false,
          isForeignKey: true,
          constraints: ['FOREIGN KEY']
        },
        {
          name: 'product_name',
          type: 'VARCHAR(200)',
          isPrimaryKey: false,
          isNullable: true,
          isUnique: false,
          isForeignKey: false,
          constraints: []
        },
        {
          name: 'quantity',
          type: 'INTEGER',
          isPrimaryKey: false,
          isNullable: true,
          isUnique: false,
          isForeignKey: false,
          constraints: []
        },
        {
          name: 'created_by',
          type: 'INTEGER',
          isPrimaryKey: false,
          isNullable: true,
          isUnique: false,
          isForeignKey: true,
          constraints: ['FOREIGN KEY']
        }
      ]
    }
  ],
  foreignKeys: [
    {
      sourceTable: 'order_items',
      sourceColumn: ['order_id', 'customer_id'],
      targetTable: 'orders',
      targetColumn: ['order_id', 'customer_id'],
      constraintName: 'fk_order_items_orders'
    },
    {
      sourceTable: 'order_items',
      sourceColumn: 'created_by',
      targetTable: 'users',
      targetColumn: 'id',
      constraintName: 'fk_order_items_users'
    }
  ],
  metadata: {
    dialect: 'postgresql',
    parsedAt: new Date(),
    source: 'pgsql-ast-parser'
  }
};

// DBML Generation Function (copied from backend)
function convertTypedSchemaToDbml(typedSchema, databaseName) {
  try {
    let dbml = `Project ${databaseName} {\n`;
    dbml += `  database_type: 'PostgreSQL'\n`;
    dbml += `  Note: 'Generated from SQL Schema via ${typedSchema.metadata?.source || 'unknown parser'}'\n`;
    dbml += `}\n\n`;

    // Map SQL types to DBML types
    const mapSqlTypeToDbml = (sqlType) => {
      const typeMap = {
        'INTEGER': 'int',
        'SERIAL': 'int',
        'BIGINT': 'bigint',
        'VARCHAR': 'varchar',
        'TEXT': 'text',
        'BOOLEAN': 'boolean',
        'TIMESTAMP': 'timestamp',
        'DATE': 'date',
        'DECIMAL': 'decimal',
        'FLOAT': 'float',
        'REAL': 'real'
      };

      const upperType = sqlType.toUpperCase().split('(')[0];
      return typeMap[upperType] || sqlType.toLowerCase();
    };

    // Add tables
    for (const table of typedSchema.tables) {
      dbml += `Table ${table.name} {\n`;
      
      for (const column of table.columns) {
        const type = mapSqlTypeToDbml(column.type);
        let columnLine = `  ${column.name} ${type}`;
        
        const attributes = [];
        if (column.isPrimaryKey) attributes.push('pk');
        if (!column.isNullable) attributes.push('not null');
        if (column.isUnique) attributes.push('unique');
        if (column.defaultValue) attributes.push(`default: '${column.defaultValue}'`);
        
        // Add FK reference inline if this column is a foreign key (only for single-column FKs)
        const fkRef = typedSchema.foreignKeys.find(fk => 
          fk.sourceTable === table.name && 
          (typeof fk.sourceColumn === 'string' && fk.sourceColumn === column.name)
        );
        if (fkRef && typeof fkRef.targetColumn === 'string') {
          attributes.push(`ref: > ${fkRef.targetTable}.${fkRef.targetColumn}`);
        }
        
        if (attributes.length > 0) {
          columnLine += ` [${attributes.join(', ')}]`;
        }
        
        dbml += columnLine + '\n';
      }
      
      dbml += `}\n\n`;
    }

    // Add relationships (foreign keys) - for all FKs including multi-column ones
    for (const fk of typedSchema.foreignKeys) {
      const sourceColumns = Array.isArray(fk.sourceColumn) ? fk.sourceColumn : [fk.sourceColumn];
      const targetColumns = Array.isArray(fk.targetColumn) ? fk.targetColumn : [fk.targetColumn];
      
      // For multi-column FKs, create composite reference
      if (sourceColumns.length > 1 && targetColumns.length > 1) {
        dbml += `Ref: (${sourceColumns.map(col => `${fk.sourceTable}.${col}`).join(', ')}) > (${targetColumns.map(col => `${fk.targetTable}.${col}`).join(', ')})`;
      } else {
        dbml += `Ref: ${fk.sourceTable}.${sourceColumns[0]} > ${fk.targetTable}.${targetColumns[0]}`;
      }
      
      if (fk.onDelete) dbml += ` [delete: ${fk.onDelete.toLowerCase()}]`;
      dbml += '\n';
    }
    
    if (typedSchema.foreignKeys.length > 0) {
      dbml += '\n';
    }

    return dbml;
  } catch (error) {
    console.error('DBML conversion error:', error);
    return `// Error generating DBML: ${error.message}`;
  }
}

// Run the test
console.log('🔬 === COMPOSITE FK DBML GENERATION TEST ===');
console.log('Test Data:');
console.log('- Tables:', testSchema.tables.length);
console.log('- Foreign Keys:', testSchema.foreignKeys.length);

testSchema.foreignKeys.forEach((fk, i) => {
  const sourceColumns = Array.isArray(fk.sourceColumn) ? fk.sourceColumn.join(', ') : fk.sourceColumn;
  const targetColumns = Array.isArray(fk.targetColumn) ? fk.targetColumn.join(', ') : fk.targetColumn;
  console.log(`  FK ${i+1}: ${fk.sourceTable}.[${sourceColumns}] -> ${fk.targetTable}.[${targetColumns}]`);
});

console.log('\n📊 Generated DBML:');
console.log('=====================================');
const dbml = convertTypedSchemaToDbml(testSchema, 'Test Schema');
console.log(dbml);
console.log('=====================================');

// Validate the DBML
const hasCompositeRef = dbml.includes('Ref: (order_items.order_id, order_items.customer_id) > (orders.order_id, orders.customer_id)');
const hasSingleRef = dbml.includes('Ref: order_items.created_by > users.id');

console.log('\n🎯 Validation Results:');
console.log('✅ Expected composite FK reference:', hasCompositeRef ? 'FOUND' : 'MISSING');
console.log('✅ Expected single FK reference:', hasSingleRef ? 'FOUND' : 'MISSING');
console.log('✅ Total Ref lines:', (dbml.match(/^Ref:/gm) || []).length);

if (hasCompositeRef && hasSingleRef) {
  console.log('\n🎉 SUCCESS: Composite FK DBML generation is working correctly!');
} else {
  console.log('\n❌ FAILURE: Composite FK DBML generation needs fixes.');
}
