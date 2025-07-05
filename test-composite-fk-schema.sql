-- Test SQL schema with composite foreign keys for verification
-- This will be used to test the complete workflow

-- Create parent table with composite primary key
CREATE TABLE orders (
    order_id INT,
    customer_id INT,
    order_date DATE,
    total_amount DECIMAL(10,2),
    PRIMARY KEY (order_id, customer_id)
);

-- Create child table with composite foreign key
CREATE TABLE order_details (
    detail_id INT PRIMARY KEY,
    order_id INT,
    customer_id INT,
    product_id INT,
    quantity INT,
    unit_price DECIMAL(10,2),
    FOREIGN KEY (order_id, customer_id) REFERENCES orders(order_id, customer_id)
);

-- Create another table to test mixed FKs (single and composite)
CREATE TABLE customers (
    id INT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(255)
);

-- Table with both single and composite foreign keys
CREATE TABLE order_audit (
    audit_id INT PRIMARY KEY,
    order_id INT,
    customer_id INT,
    auditor_id INT,
    audit_date DATE,
    notes TEXT,
    FOREIGN KEY (order_id, customer_id) REFERENCES orders(order_id, customer_id),
    FOREIGN KEY (auditor_id) REFERENCES customers(id)
);

-- Insert some test data
INSERT INTO orders VALUES 
(1, 101, '2024-01-15', 299.99),
(2, 102, '2024-01-16', 149.50),
(1, 102, '2024-01-17', 89.99);

INSERT INTO customers VALUES 
(1, 'John Doe', 'john@example.com'),
(2, 'Jane Smith', 'jane@example.com');

INSERT INTO order_details VALUES 
(1, 1, 101, 1001, 2, 149.99),
(2, 1, 101, 1002, 1, 149.99),
(3, 2, 102, 1003, 3, 49.83);

INSERT INTO order_audit VALUES 
(1, 1, 101, 1, '2024-01-15', 'Initial order review'),
(2, 2, 102, 2, '2024-01-16', 'Standard audit process');
