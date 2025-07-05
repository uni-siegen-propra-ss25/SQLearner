-- Test Cases for FK Features Implementation
-- Phase 1 & 2: Essential FK Extensions

-- Test Case 1: Inline Column FK Syntax
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE posts (
    id INTEGER PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Test Case 2: Multi-Column Foreign Keys
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
    product_name VARCHAR(255),
    quantity INTEGER,
    FOREIGN KEY (order_id, customer_id) REFERENCES orders(order_id, customer_id)
);

-- Test Case 3: Schema-qualified Table Names
CREATE SCHEMA sales;

CREATE TABLE sales.customers (
    customer_id INTEGER PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE
);

CREATE TABLE sales.invoices (
    invoice_id INTEGER PRIMARY KEY,
    customer_id INTEGER,
    invoice_date DATE,
    amount DECIMAL(10, 2),
    FOREIGN KEY (customer_id) REFERENCES sales.customers(customer_id)
);

-- Test Case 4: Complex Mixed FK Scenarios
CREATE TABLE departments (
    dept_id INTEGER PRIMARY KEY,
    dept_name VARCHAR(100) NOT NULL
);

CREATE TABLE employees (
    emp_id INTEGER PRIMARY KEY,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    dept_id INTEGER REFERENCES departments(dept_id),
    manager_id INTEGER REFERENCES employees(emp_id)
);

-- Test Case 5: Composite Primary Key with Mixed FK Types
CREATE TABLE projects (
    project_id INTEGER PRIMARY KEY,
    project_name VARCHAR(100) NOT NULL,
    manager_id INTEGER REFERENCES employees(emp_id)
);

CREATE TABLE employee_projects (
    emp_id INTEGER,
    project_id INTEGER,
    role VARCHAR(50),
    start_date DATE,
    end_date DATE,
    PRIMARY KEY (emp_id, project_id),
    FOREIGN KEY (emp_id) REFERENCES employees(emp_id),
    FOREIGN KEY (project_id) REFERENCES projects(project_id)
);
