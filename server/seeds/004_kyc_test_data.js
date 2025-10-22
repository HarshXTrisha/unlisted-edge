exports.seed = async function(knex) {
  // Clear existing KYC data
  await knex('kyc_audit_logs').del();
  await knex('kyc_documents').del();
  await knex('kyc_records').del();

  // Get user IDs for test data
  const users = await knex('users').select('id', 'email');
  const testUser = users.find(u => u.email === 'test@example.com');
  const adminUser = users.find(u => u.email === 'admin@example.com');

  if (!testUser) {
    console.log('Test user not found, skipping KYC seed data');
    return;
  }

  // Create KYC record for test user
  const [kycRecord] = await knex('kyc_records').insert({
    user_id: testUser.id,
    status: 'pending',
    created_at: new Date(),
    updated_at: new Date(),
    compliance_score: 75
  }).returning('*');

  // Create sample documents for the KYC record
  const documents = [
    {
      kyc_record_id: kycRecord.id,
      document_type: 'aadhaar',
      original_filename: 'aadhaar_sample.pdf',
      encrypted_filename: 'enc_aadhaar_' + Date.now() + '.pdf',
      file_size: 1024000, // 1MB
      mime_type: 'application/pdf',
      upload_timestamp: new Date(),
      extracted_data: JSON.stringify({
        aadhaar: {
          number: '1234 5678 9012',
          name: 'Test User',
          address: '123 Test Street, Test City, Test State - 123456'
        }
      }),
      validation_status: 'valid'
    },
    {
      kyc_record_id: kycRecord.id,
      document_type: 'pan',
      original_filename: 'pan_sample.jpg',
      encrypted_filename: 'enc_pan_' + Date.now() + '.jpg',
      file_size: 512000, // 512KB
      mime_type: 'image/jpeg',
      upload_timestamp: new Date(),
      extracted_data: JSON.stringify({
        pan: {
          number: 'ABCDE1234F',
          name: 'Test User'
        }
      }),
      validation_status: 'valid'
    },
    {
      kyc_record_id: kycRecord.id,
      document_type: 'bank_statement',
      original_filename: 'bank_statement.pdf',
      encrypted_filename: 'enc_bank_' + Date.now() + '.pdf',
      file_size: 2048000, // 2MB
      mime_type: 'application/pdf',
      upload_timestamp: new Date(),
      extracted_data: JSON.stringify({
        bankStatement: {
          accountHolderName: 'Test User',
          accountNumber: '1234567890',
          bankName: 'Test Bank',
          statementPeriod: 'Jan 2024 - Mar 2024'
        }
      }),
      validation_status: 'pending'
    }
  ];

  await knex('kyc_documents').insert(documents);

  // Create audit log entries
  const auditLogs = [
    {
      kyc_record_id: kycRecord.id,
      action_type: 'KYC_CREATED',
      performed_by: testUser.id,
      action_details: JSON.stringify({
        message: 'KYC record created',
        status: 'pending'
      }),
      ip_address: '127.0.0.1',
      user_agent: 'Test Browser',
      timestamp: new Date()
    },
    {
      kyc_record_id: kycRecord.id,
      action_type: 'DOCUMENT_UPLOADED',
      performed_by: testUser.id,
      action_details: JSON.stringify({
        document_type: 'aadhaar',
        filename: 'aadhaar_sample.pdf',
        file_size: 1024000
      }),
      ip_address: '127.0.0.1',
      user_agent: 'Test Browser',
      timestamp: new Date()
    },
    {
      kyc_record_id: kycRecord.id,
      action_type: 'DOCUMENT_UPLOADED',
      performed_by: testUser.id,
      action_details: JSON.stringify({
        document_type: 'pan',
        filename: 'pan_sample.jpg',
        file_size: 512000
      }),
      ip_address: '127.0.0.1',
      user_agent: 'Test Browser',
      timestamp: new Date()
    }
  ];

  await knex('kyc_audit_logs').insert(auditLogs);

  console.log('KYC test data seeded successfully');
};