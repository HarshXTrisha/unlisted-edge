const knex = require('../config/database');

/**
 * KYC Audit Service
 * Logs all KYC-related actions for compliance and security
 */
class KYCAuditService {
  
  /**
   * Log KYC action to audit trail
   * @param {Object} auditData - Audit information
   * @param {number} auditData.userId - User ID performing the action
   * @param {string} auditData.action - Action performed (upload, approve, reject, view, etc.)
   * @param {string} auditData.entityType - Type of entity (kyc_record, kyc_document)
   * @param {number} auditData.entityId - ID of the entity
   * @param {Object} auditData.metadata - Additional metadata
   * @param {string} auditData.ipAddress - IP address of the user
   * @param {string} auditData.userAgent - User agent string
   */
  static async logAction(auditData) {
    try {
      const {
        userId,
        action,
        entityType,
        entityId,
        metadata = {},
        ipAddress,
        userAgent
      } = auditData;

      await knex('kyc_audit_logs').insert({
        user_id: userId,
        action: action,
        entity_type: entityType,
        entity_id: entityId,
        metadata: JSON.stringify(metadata),
        ip_address: ipAddress,
        user_agent: userAgent,
        created_at: new Date()
      });

      console.log(`KYC Audit: User ${userId} performed ${action} on ${entityType} ${entityId}`);
    } catch (error) {
      console.error('Failed to log KYC audit action:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  /**
   * Log document upload
   */
  static async logDocumentUpload(userId, kycRecordId, documentIds, ipAddress, userAgent) {
    await this.logAction({
      userId,
      action: 'DOCUMENT_UPLOAD',
      entityType: 'kyc_record',
      entityId: kycRecordId,
      metadata: {
        documentIds,
        documentCount: documentIds.length
      },
      ipAddress,
      userAgent
    });
  }

  /**
   * Log KYC status check
   */
  static async logStatusCheck(userId, kycRecordId, ipAddress, userAgent) {
    await this.logAction({
      userId,
      action: 'STATUS_CHECK',
      entityType: 'kyc_record',
      entityId: kycRecordId,
      metadata: {},
      ipAddress,
      userAgent
    });
  }

  /**
   * Log KYC approval
   */
  static async logApproval(adminId, kycRecordId, notes, ipAddress, userAgent) {
    await this.logAction({
      userId: adminId,
      action: 'KYC_APPROVED',
      entityType: 'kyc_record',
      entityId: kycRecordId,
      metadata: {
        notes,
        approvedBy: adminId
      },
      ipAddress,
      userAgent
    });
  }

  /**
   * Log KYC rejection
   */
  static async logRejection(adminId, kycRecordId, reason, ipAddress, userAgent) {
    await this.logAction({
      userId: adminId,
      action: 'KYC_REJECTED',
      entityType: 'kyc_record',
      entityId: kycRecordId,
      metadata: {
        reason,
        rejectedBy: adminId
      },
      ipAddress,
      userAgent
    });
  }

  /**
   * Log document access/view
   */
  static async logDocumentAccess(userId, documentId, filename, ipAddress, userAgent) {
    await this.logAction({
      userId,
      action: 'DOCUMENT_VIEWED',
      entityType: 'kyc_document',
      entityId: documentId,
      metadata: {
        filename,
        viewedBy: userId
      },
      ipAddress,
      userAgent
    });
  }

  /**
   * Log admin pending submissions view
   */
  static async logAdminPendingView(adminId, submissionCount, ipAddress, userAgent) {
    await this.logAction({
      userId: adminId,
      action: 'ADMIN_PENDING_VIEW',
      entityType: 'admin_action',
      entityId: 0,
      metadata: {
        submissionCount,
        viewedBy: adminId
      },
      ipAddress,
      userAgent
    });
  }

  /**
   * Get audit trail for a specific KYC record
   */
  static async getAuditTrail(kycRecordId, limit = 50) {
    try {
      const auditLogs = await knex('kyc_audit_logs')
        .leftJoin('users', 'kyc_audit_logs.user_id', 'users.id')
        .where('kyc_audit_logs.entity_id', kycRecordId)
        .where('kyc_audit_logs.entity_type', 'kyc_record')
        .select([
          'kyc_audit_logs.*',
          'users.first_name',
          'users.last_name',
          'users.email'
        ])
        .orderBy('kyc_audit_logs.created_at', 'desc')
        .limit(limit);

      return auditLogs.map(log => ({
        ...log,
        metadata: JSON.parse(log.metadata || '{}')
      }));
    } catch (error) {
      console.error('Failed to get audit trail:', error);
      return [];
    }
  }

  /**
   * Get audit statistics
   */
  static async getAuditStats(timeframe = '7 days') {
    try {
      const stats = await knex('kyc_audit_logs')
        .select('action')
        .count('* as count')
        .where('created_at', '>=', knex.raw(`NOW() - INTERVAL '${timeframe}'`))
        .groupBy('action')
        .orderBy('count', 'desc');

      return stats;
    } catch (error) {
      console.error('Failed to get audit stats:', error);
      return [];
    }
  }

  /**
   * Clean old audit logs (retention policy)
   */
  static async cleanOldLogs(retentionDays = 365) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const deletedCount = await knex('kyc_audit_logs')
        .where('created_at', '<', cutoffDate)
        .del();

      console.log(`Cleaned ${deletedCount} old audit logs older than ${retentionDays} days`);
      return deletedCount;
    } catch (error) {
      console.error('Failed to clean old audit logs:', error);
      return 0;
    }
  }
}

module.exports = KYCAuditService;