exports.up = function(knex) {
  return knex.schema.createTable('orders', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.integer('company_id').unsigned().references('id').inTable('companies').onDelete('CASCADE');
    table.enum('type', ['BUY', 'SELL']).notNullable();
    table.enum('order_type', ['MARKET', 'LIMIT']).notNullable();
    table.integer('quantity').notNullable();
    table.decimal('price', 10, 2);
    table.decimal('total_amount', 15, 2);
    table.enum('status', ['PENDING', 'PARTIAL', 'COMPLETED', 'CANCELLED']).defaultTo('PENDING');
    table.integer('filled_quantity').defaultTo(0);
    table.decimal('filled_amount', 15, 2).defaultTo(0);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('orders');
};