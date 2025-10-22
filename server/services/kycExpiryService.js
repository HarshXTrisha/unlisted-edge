const knex = require('../config/database');
const KYCAuditService = require('./kycAuditService');

/**
 * KYC Document Expiry Service
 * Handles document expiry notifications and status updates
 */
class KYCExpiryService {

  /**
   * Document expiry periods (in months)
   */
  static EXPIRY_PERIODS = {
    'aadhaar': 120, // 10 years (Aadhaar doesn't expire but for compliance)
    'pan': 120, // 10 years (PAN doesn't expire)
    'bank_statement': 6, // 6 months
    'address_proof': 12, // 1 year
    'photo': 24 // 2 years
  };

  /**
   * Calculate expiry date for a document
   */
  static calculateExpiryDate(documentType, uploadDate) {
    const expiryMonths = this.EXPIRY_PERIODS[documentType] || 12;
    const expiry = new Date(uploadDate);
    expiry.setMonth(expiry.getMonth() + expiryMonths);
    return expiry;
  }

  /**
   * Get documents expiring soon (within 30 days)
   */
  static async getExpiringDocuments() {
    try {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const documents = await knex('kyc_documents')
        .join('kyc_records', 'kyc_documents.kyc_record_id', 'kyc_records.id')
        .join('users', 'kyc_records.user_id', 'users.id')
        .where('kyc_records.status', 'verified')
        .select([
          'kyc_documents.*',
          'kyc_records.user_id',
          'users.first_name',
          'users.last_name',
          'users.email'
        ]);

      const expiringDocs = documents.filter(doc => {
        const expiryDate = this.calculateExpiryDate(doc.document_type, doc.upload_timestamp);
        return expiryDate <= thirtyDaysFromNow;
      }).map(doc => ({
        ...doc,
        expiry_date: this.calculateExpiryDate(doc.document_type, doc.upload_timestamp),
        days_until_expiry: Math.ceil((this.calculateExpiryDate(doc.document_type, doc.upload_timestamp) - new Date()) / (1000 * 60 * 60 * 24))
      }));

      return expiringDocs;
    } catch (error) {
      console.error('Failed to get expiring documents:', error);
      return [];
    }
  }

  /**
   * Get expired documents
   */
  static async getExpiredDocuments() {
    try {
      const now = new Date();

      const documents = await knex('kyc_documents')
        .join('kyc_records', 'kyc_documents.kyc_record_id', 'kyc_records.id')
        .join('users', 'kyc_records.user_id', 'users.id')
        .where('kyc_records.status', 'verified')
        .select([
          'kyc_documents.*',
          'kyc_records.user_id',
          'users.first_name',
          'users.last_name',
          'users.email'
        ]);

      const expiredDocs = documents.filter(doc => {
        const expiryDate = this.calculateExpiryDate(doc.document_type, doc.upload_timestamp);
        return expiryDate < now;
      }).map(doc => ({
        ...doc,
        expiry_date: this.calculateExpiryDate(doc.document_type, doc.upload_timestamp),
        days_expired: Math.ceil((new Date() - this.calculateExpiryDate(doc.document_type, doc.upload_timestamp)) / (1000 * 60 * 60 * 24))
      }));

      return expiredDocs;
    } catch (error) {
      console.error('Failed to get expired documents:', error);
      return [];
    }
  }

  /**
   * Update KYC status for users with expired documents
   */
  static async updateExpiredKYCStatus() {
    try {
      const expiredDocs = await this.getExpiredDocuments();
      const userIds = [...new Set(expiredDocs.map(doc => doc.user_id))];

      let updatedCount = 0;
      for (const userId of userIds) {
        const result = await knex('kyc_records')
          .where('user_id', userId)
          .where('status', 'verified')
          .update({
            status: 'expired',
            updated_at: new Date(),
            rejection_reason: 'Documents have expired and need to be renewed'
          });

        if (result > 0) {
          updatedCount++;
          
          // Log the expiry
          await KYCAuditService.logAction({
            userId: 0, // System action
            action: 'KYC_EXPIRED',
            entityType: 'kyc_record',
            entityId: userId,
            metadata: {
              reason: 'Documents expired',
              expiredDocuments: expiredDocs.filter(doc => doc.user_id === userId).length
            },
            ipAddress: 'system',
            userAgent: 'KYC Expiry Service'
          });
        }
      }

      console.log(`Updated ${updatedCount} KYC records to expired status`);
      return updatedCount;
    } catch (error) {
      console.error('Failed to update expired KYC status:', error);
      return 0;
    }
  }

  /**
   * Send expiry notifications (placeholder - would integrate with email service)
   */
  static async sendExpiryNotifications() {
    try {
      const expiringDocs = await this.getExpiringDocuments();
      const userNotifications = {};

      // Group documents by user
      expiringDocs.forEach(doc => {
        if (!userNotifications[doc.user_id]) {
          userNotifications[doc.user_id] = {
            user: {
              id: doc.user_id,
              name: `${doc.first_name} ${doc.last_name}`,
              email: doc.email
            },
            documents: []
          };
        }
        userNotifications[doc.user_id].documents.push(doc);
      });

      let notificationsSent = 0;
      for (const [userId, notification] of Object.entries(userNotifications)) {
        // In a real implementation, this would send an email
        console.log(`📧 Expiry notification for ${notification.user.email}:`);
        console.log(`   Documents expiring: ${notification.documents.length}`);
        notification.documents.forEach(doc => {
          console.log(`   - ${doc.document_type}: expires in ${doc.days_until_expiry} days`);
        });

        // Log notification
        await KYCAuditService.logAction({
          userId: parseInt(userId),
          action: 'EXPIRY_NOTIFICATION_SENT',
          entityType: 'kyc_record',
          entityId: parseInt(userId),
          metadata: {
            documentsExpiring: notification.documents.length,
            notificationType: 'email'
          },
          ipAddress: 'system',
          userAgent: 'KYC Expiry Service'
        });

        notificationsSent++;
      }

      console.log(`Sent ${notificationsSent} expiry notifications`);
      return notificationsSent;
    } catch (error) {
      console.error('Failed to send expiry notifications:', error);
      return 0;
    }
  }

  /**
   * Run daily expiry check (to be called by cron job)
   */
  static async runDailyExpiryCheck() {
    console.log('🔍 Running daily KYC expiry check...');
    
    const expiredUpdated = await this.updateExpiredKYCStatus();
    const notificationsSent = await this.sendExpiryNotifications();

    console.log(`✅ Daily expiry check complete: ${expiredUpdated} expired, ${notificationsSent} notifications sent`);
    
    return {
      expiredUpdated,
      notificationsSent
    };
  }

  /**
   * Get expiry summary for admin dashboard
   */
  static async getExpirySummary() {
    try {
      const [expiringDocs, expiredDocs] = await Promise.all([
        this.getExpiringDocuments(),
        this.getExpiredDocuments()
      ]);

      return {
        expiring_soon: expiringDocs.length,
        expired: expiredDocs.length,
        expiring_users: [...new Set(expiringDocs.map(doc => doc.user_id))].length,
        expired_users: [...new Set(expiredDocs.map(doc => doc.user_id))].length
      };
    } catch (error) {
      console.error('Failed to get expiry summary:', error);
      return {
        expiring_soon: 0,
        expired: 0,
        expiring_users: 0,
        expired_users: 0
      };
    }
  }
}

module.exports = KYCExpiryService;