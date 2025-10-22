exports.up = function(knex) {
  return knex.schema
    // Create KYC records table
    .createTable('kyc_records', function(table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
      table.enum('status', ['pending', 'verified', 'rejected', 'expired']).defaultTo('pending');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      table.timestamp('verified_at').nullable();
      table.integer('verified_by').unsigned().references('id').inTable('users').nullable();
      table.text('rejection_reason').nullable();
      table.timestamp('expiry_date').nullable();
      table.integer('compliance_score').defaultTo(0);
      
      // Indexes for performance
      table.index('user_id');
      table.index('status');
      table.index('created_at');
    })
    
    // Create KYC documents table
    .createTable('kyc_documents', function(table) {
      table.increments('id').primary();
      table.integer('kyc_record_id').unsigned().references('id').inTable('kyc_records').onDelete('CASCADE');
      table.enum('document_type', ['aadhaar', 'pan', 'bank_statement']).notNullable();
      table.string('original_filename', 255).notNullable();
      table.string('encrypted_filename', 255).notNullable();
      table.integer('file_size').notNullable();
      table.string('mime_type', 100).notNullable();
      table.timestamp('upload_timestamp').defaultTo(knex.fn.now());
      table.jsonb('extracted_data').nullable();
      table.enum('validation_status', ['pending', 'valid', 'invalid']).defaultTo('pending');
      table.jsonb('validation_errors').nullable();
      
      // Indexes for performance
      table.index('kyc_record_id');
      table.index('document_type');
      table.index('validation_status');
    })
    
    // Create KYC audit logs table
    .createTable('kyc_audit_logs', function(table) {
      table.increments('id').primary();
      table.integer('kyc_record_id').unsigned().references('id').inTable('kyc_records').onDelete('CASCADE');
      table.string('action_type', 50).notNullable();
      table.integer('performed_by').unsigned().references('id').inTable('users').nullable();
      table.jsonb('action_details').notNullable();
      table.string('ip_address', 45).nullable(); // Supports both IPv4 and IPv6
      table.text('user_agent').nullable();
      table.timestamp('timestamp').defaultTo(knex.fn.now());
      
      // Indexes for performance
      table.index('kyc_record_id');
      table.index('timestamp');
      table.index('action_type');
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('kyc_audit_logs')
    .dropTableIfExists('kyc_documents')
    .dropTableIfExists('kyc_records');
};