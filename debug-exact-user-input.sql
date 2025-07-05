CREATE TABLE orders (
    order_id INTEGER,
    customer_id INTEGER,
    PRIMARY KEY (order_id, customer_id)
);

CREATE TABLE order_items (
    item_id SERIAL PRIMARY KEY,
    order_id INTEGER,
    customer_id INTEGER,
    FOREIGN KEY (order_id, customer_id) REFERENCES orders(order_id, customer_id)
);
