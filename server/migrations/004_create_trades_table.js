exports.up = function(knex) {
  return knex.schema.createTable('trades', function(table) {
    table.increments('id').primary();
    table.integer('buy_order_id').unsigned().references('id').inTable('orders');
    table.integer('sell_order_id').unsigned().references('id').inTable('orders');
    table.integer('buyer_id').unsigned().references('id').inTable('users');
    table.integer('seller_id').unsigned().references('id').inTable('users');
    table.integer('company_id').unsigned().references('id').inTable('companies');
    table.integer('quantity').notNullable();
    table.decimal('price', 10, 2).notNullable();
    table.decimal('total_amount', 15, 2).notNullable();
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('trades');
};