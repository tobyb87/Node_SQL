create database bamazon;

use bamazon;

create table product(
  item_id integer not null auto_increment,
  product_name varchar(50),
  department_name varchar(50),
  price decimal(10,2),
  stock_quantity integer,
  primary key(item_id)
);