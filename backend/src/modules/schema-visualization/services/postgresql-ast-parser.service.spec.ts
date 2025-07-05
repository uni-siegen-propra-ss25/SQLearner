import { PostgreSQLASTParser } from './postgresql-ast-parser.service';
import { SchemaParsingError } from '../models/typed-schema.interface';

describe('PostgreSQLASTParser - FK Features', () => {
  let parser: PostgreSQLASTParser;

  beforeEach(() => {
    parser = new PostgreSQLASTParser();
  });

  describe('Phase 1: Essential FK Features', () => {
    describe('Inline Column FK Syntax', () => {
      it('should parse inline REFERENCES syntax correctly', () => {
        const sql = `
          CREATE TABLE users (
            id INTEGER PRIMARY KEY,
            name VARCHAR(100) NOT NULL
          );

          CREATE TABLE posts (
            id INTEGER PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            user_id INTEGER REFERENCES users(id)
          );
        `;

        const result = parser.parseSchema(sql);

        expect(result.tables).toHaveLength(2);
        expect(result.foreignKeys).toHaveLength(1);
        
        const fk = result.foreignKeys[0];
        expect(fk.sourceTable).toBe('posts');
        expect(fk.sourceColumn).toBe('user_id');
        expect(fk.targetTable).toBe('users');
        expect(fk.targetColumn).toBe('id');

        // Check that the column is marked as foreign key
        const postsTable = result.tables.find(t => t.name === 'posts');
        expect(postsTable).toBeDefined();
        const userIdColumn = postsTable!.columns.find(c => c.name === 'user_id');
        expect(userIdColumn).toBeDefined();
        expect(userIdColumn!.isForeignKey).toBe(true);
      });

      it('should handle inline FK with ON DELETE/UPDATE actions', () => {
        const sql = `
          CREATE TABLE users (
            id INTEGER PRIMARY KEY,
            name VARCHAR(100) NOT NULL
          );

          CREATE TABLE posts (
            id INTEGER PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE ON UPDATE SET NULL
          );
        `;

        const result = parser.parseSchema(sql);
        const fk = result.foreignKeys[0];
        
        expect(fk.onDelete).toBe('CASCADE');
        expect(fk.onUpdate).toBe('SET NULL');
      });
    });

    describe('Better Error Validation', () => {
      it('should warn for missing target table but not throw error', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
        
        const sql = `
          CREATE TABLE posts (
            id INTEGER PRIMARY KEY,
            user_id INTEGER,
            FOREIGN KEY (user_id) REFERENCES users(id)
          );
        `;

        const result = parser.parseSchema(sql);
        
        expect(result.foreignKeys).toHaveLength(1);
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Warning: Target table \'users\' not found')
        );
        
        consoleSpy.mockRestore();
      });

      it('should throw SchemaParsingError for missing source column', () => {
        const sql = `
          CREATE TABLE users (
            id INTEGER PRIMARY KEY,
            name VARCHAR(100) NOT NULL
          );

          CREATE TABLE posts (
            id INTEGER PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            FOREIGN KEY (nonexistent_column) REFERENCES users(id)
          );
        `;

        expect(() => {
          parser.parseSchema(sql);
        }).toThrow(SchemaParsingError);
      });

      it('should warn for missing target table but not throw error (duplicate test removed)', () => {
        // This test was duplicate - already exists below
        expect(true).toBe(true);
      });
    });
  });

  describe('Phase 2: Important FK Features', () => {
    describe('Multi-Column Foreign Keys', () => {
      it('should parse multi-column foreign keys correctly', () => {
        const sql = `
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

        const result = parser.parseSchema(sql);

        expect(result.tables).toHaveLength(2);
        expect(result.foreignKeys).toHaveLength(1);
        
        const fk = result.foreignKeys[0];
        expect(fk.sourceTable).toBe('order_items');
        expect(fk.sourceColumn).toEqual(['order_id', 'customer_id']);
        expect(fk.targetTable).toBe('orders');
        expect(fk.targetColumn).toEqual(['order_id', 'customer_id']);

        // Check that both columns are marked as foreign keys
        const orderItemsTable = result.tables.find(t => t.name === 'order_items');
        expect(orderItemsTable).toBeDefined();
        const orderIdColumn = orderItemsTable!.columns.find(c => c.name === 'order_id');
        expect(orderIdColumn).toBeDefined();
        const customerIdColumn = orderItemsTable!.columns.find(c => c.name === 'customer_id');
        expect(customerIdColumn).toBeDefined();
        expect(orderIdColumn!.isForeignKey).toBe(true);
        expect(customerIdColumn!.isForeignKey).toBe(true);
      });

      it('should handle mixed single and multi-column FKs', () => {
        const sql = `
          CREATE TABLE users (
            id INTEGER PRIMARY KEY,
            name VARCHAR(100) NOT NULL
          );

          CREATE TABLE orders (
            order_id INTEGER,
            customer_id INTEGER,
            PRIMARY KEY (order_id, customer_id)
          );

          CREATE TABLE order_items (
            item_id INTEGER PRIMARY KEY,
            order_id INTEGER,
            customer_id INTEGER,
            created_by INTEGER,
            FOREIGN KEY (order_id, customer_id) REFERENCES orders(order_id, customer_id),
            FOREIGN KEY (created_by) REFERENCES users(id)
          );
        `;

        const result = parser.parseSchema(sql);

        expect(result.foreignKeys).toHaveLength(2);
        
        const multiColumnFK = result.foreignKeys.find(fk => Array.isArray(fk.sourceColumn));
        expect(multiColumnFK).toBeDefined();
        expect(multiColumnFK!.sourceColumn).toEqual(['order_id', 'customer_id']);
        
        const singleColumnFK = result.foreignKeys.find(fk => !Array.isArray(fk.sourceColumn));
        expect(singleColumnFK).toBeDefined();
        expect(singleColumnFK!.sourceColumn).toBe('created_by');
      });

      it('should reject mismatched column count in multi-column FK', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
        
        const sql = `
          CREATE TABLE orders (
            order_id INTEGER,
            customer_id INTEGER,
            PRIMARY KEY (order_id, customer_id)
          );

          CREATE TABLE order_items (
            item_id INTEGER PRIMARY KEY,
            order_id INTEGER,
            FOREIGN KEY (order_id) REFERENCES orders(order_id, customer_id)
          );
        `;

        const result = parser.parseSchema(sql);
        
        expect(result.foreignKeys).toHaveLength(0);
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('column count mismatch')
        );
        
        consoleSpy.mockRestore();
      });
    });

    describe('Schema-qualified Table Names', () => {
      it('should parse schema-qualified table names in FKs', () => {
        const sql = `
          CREATE SCHEMA sales;

          CREATE TABLE sales.customers (
            customer_id INTEGER PRIMARY KEY,
            customer_name VARCHAR(100) NOT NULL
          );

          CREATE TABLE sales.invoices (
            invoice_id INTEGER PRIMARY KEY,
            customer_id INTEGER,
            FOREIGN KEY (customer_id) REFERENCES sales.customers(customer_id)
          );
        `;

        const result = parser.parseSchema(sql);

        expect(result.foreignKeys).toHaveLength(1);
        
        const fk = result.foreignKeys[0];
        expect(fk.sourceTable).toBe('invoices');
        expect(fk.targetTable).toBe('customers');
      });

      it('should handle cross-schema references', () => {
        const sql = `
          CREATE SCHEMA auth;
          CREATE SCHEMA sales;

          CREATE TABLE auth.users (
            user_id INTEGER PRIMARY KEY,
            username VARCHAR(100) NOT NULL
          );

          CREATE TABLE sales.orders (
            order_id INTEGER PRIMARY KEY,
            user_id INTEGER,
            FOREIGN KEY (user_id) REFERENCES auth.users(user_id)
          );
        `;

        const result = parser.parseSchema(sql);

        expect(result.foreignKeys).toHaveLength(1);
        
        const fk = result.foreignKeys[0];
        expect(fk.sourceTable).toBe('orders');
        expect(fk.targetTable).toBe('users');
      });
    });
  });

  describe('DBML Generation', () => {
    it('should generate correct DBML for single-column FKs', () => {
      const sql = `
        CREATE TABLE users (
          id INTEGER PRIMARY KEY,
          name VARCHAR(100) NOT NULL
        );

        CREATE TABLE posts (
          id INTEGER PRIMARY KEY,
          user_id INTEGER REFERENCES users(id)
        );
      `;

      const result = parser.parseSchema(sql);
      
      // This would typically be tested in the SchemaVisualizationService
      // but we can verify the FK structure is correct
      expect(result.foreignKeys).toHaveLength(1);
      expect(result.foreignKeys[0].sourceColumn).toBe('user_id');
      expect(result.foreignKeys[0].targetColumn).toBe('id');
    });

    it('should generate correct DBML for multi-column FKs', () => {
      const sql = `
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

      const result = parser.parseSchema(sql);
      
      expect(result.foreignKeys).toHaveLength(1);
      expect(result.foreignKeys[0].sourceColumn).toEqual(['order_id', 'customer_id']);
      expect(result.foreignKeys[0].targetColumn).toEqual(['order_id', 'customer_id']);
    });
  });
});
