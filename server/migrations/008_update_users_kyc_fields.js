exports.up = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    // Remove the basic KYC fields since we now have proper KYC tables
    table.dropColumn('kyc_status');
    table.dropColumn('kyc_documents');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    // Restore the basic KYC fields if rolling back
    table.string('kyc_status').defaultTo('pending');
    table.text('kyc_documents');
  });
};