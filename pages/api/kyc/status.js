// KYC Status API route for Vercel
import { authenticateToken } from '../../../server/middleware/auth';
import knex from '../../../server/config/database';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Simple authentication check
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: { type: 'NO_TOKEN', message: 'Access token required' }
      });
    }

    // For now, return a simple response
    return res.json({
      success: true,
      data: {
        status: 'not_started',
        canTrade: false,
        documents: [],
        message: 'Please upload your KYC documents to start trading'
      }
    });

  } catch (error) {
    console.error('KYC status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get KYC status'
    });
  }
}