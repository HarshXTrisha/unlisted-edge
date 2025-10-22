exports.up = function(knex) {
  return knex.schema.createTable('portfolios', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.integer('company_id').unsigned().references('id').inTable('companies').onDelete('CASCADE');
    table.integer('quantity').notNullable();
    table.decimal('average_price', 10, 2).notNullable();
    table.decimal('total_invested', 15, 2).notNullable();
    table.timestamps(true, true);
    table.unique(['user_id', 'company_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('portfolios');
};