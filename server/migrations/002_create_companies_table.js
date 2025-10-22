exports.up = function(knex) {
  return knex.schema.createTable('companies', function(table) {
    table.increments('id').primary();
    table.string('symbol').unique().notNullable();
    table.string('name').notNullable();
    table.text('description');
    table.string('sector');
    table.string('industry');
    table.decimal('current_price', 10, 2);
    table.decimal('market_cap', 15, 2);
    table.integer('total_shares');
    table.integer('available_shares');
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('companies');
};