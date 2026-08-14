-- 0001_extensions_and_enums.sql

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

drop type if exists user_role cascade;
drop type if exists order_type cascade;
drop type if exists fulfillment_type cascade;
drop type if exists order_status cascade;
drop type if exists payment_status cascade;
drop type if exists payment_method cascade;
drop type if exists product_type cascade;
drop type if exists inventory_movement cascade;
drop type if exists session_status cascade;
drop type if exists table_status cascade;

create type user_role as enum ('staff', 'kitchen', 'admin');
create type order_type as enum ('DINE_IN', 'ONLINE');
create type fulfillment_type as enum ('TABLE', 'PICKUP', 'DELIVERY');
create type order_status as enum ('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED');
create type payment_status as enum ('PENDING', 'PAID', 'FAILED', 'EXPIRED', 'REFUNDED');
create type product_type as enum ('CAFE_DRINK', 'FOOD', 'PASTRY', 'COFFEE_BEAN');
create type inventory_movement as enum ('IN', 'OUT', 'ADJUSTMENT', 'WASTE');
create type session_status as enum ('open', 'closed');
