-- Test schema for composite foreign keys
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE orders (
    order_id INTEGER,
    customer_id INTEGER,
    order_date DATE,
    PRIMARY KEY (order_id, customer_id)
);

CREATE TABLE order_items (
    item_id INTEGER PRIMARY KEY,
    order_id INTEGER,
    customer_id INTEGER,
    product_name VARCHAR(200),
    quantity INTEGER,
    created_by INTEGER,
    -- Composite FK - this should be treated as ONE relationship
    FOREIGN KEY (order_id, customer_id) REFERENCES orders(order_id, customer_id),
    -- Single column FK
    FOREIGN KEY (created_by) REFERENCES users(id)
);
