exports.up = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    table.enum('user_role', ['user', 'admin', 'verified_investor']).defaultTo('user');
    table.timestamp('last_login');
    table.string('kyc_status').defaultTo('pending'); // pending, approved, rejected
    table.text('kyc_documents'); // JSON string of document URLs
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    table.dropColumn('user_role');
    table.dropColumn('last_login');
    table.dropColumn('kyc_status');
    table.dropColumn('kyc_documents');
  });
};