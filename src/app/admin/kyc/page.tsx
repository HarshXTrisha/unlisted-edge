'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../utils/api';

interface KYCSubmission {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
  updated_at: string;
  documentCount: number;
}

interface KYCDocument {
  id: number;
  document_type: string;
  original_filename: string;
  filename: string;
  file_size: number;
  upload_timestamp: string;
}

interface DetailedSubmission {
  kyc: KYCSubmission;
  documents: KYCDocument[];
}

export default function AdminKYCPage() {
  const [submissions, setSubmissions] = useState<KYCSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<DetailedSubmission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [submissionToReject, setSubmissionToReject] = useState<number | null>(null);

  useEffect(() => {
    fetchPendingSubmissions();
  }, []);

  const fetchPendingSubmissions = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/kyc/admin/pending');
      const data = await response.json();
      if (data.success) {
        setSubmissions(data.data.pendingSubmissions);
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
      alert('Failed to load KYC submissions');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubmissionDetails = async (submissionId: number) => {
    try {
      const response = await api.get(`/kyc/admin/submission/${submissionId}`);
      const data = await response.json();
      if (data.success) {
        setSelectedSubmission(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch submission details:', error);
      alert('Failed to load submission details');
    }
  };

  const handleApprove = async (submissionId: number) => {
    if (!confirm('Are you sure you want to approve this KYC submission?')) return;

    try {
      setActionLoading(true);
      const response = await api.post(`/kyc/admin/approve/${submissionId}`, {
        notes: 'Approved by admin'
      });
      const data = await response.json();
      
      if (data.success) {
        alert('KYC approved successfully!');
        fetchPendingSubmissions();
        setSelectedSubmission(null);
      }
    } catch (error) {
      console.error('Failed to approve:', error);
      alert('Failed to approve KYC');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!submissionToReject || !rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      setActionLoading(true);
      const response = await api.post(`/kyc/admin/reject/${submissionToReject}`, {
        reason: rejectionReason
      });
      const data = await response.json();
      
      if (data.success) {
        alert('KYC rejected successfully!');
        fetchPendingSubmissions();
        setSelectedSubmission(null);
        setShowRejectModal(false);
        setRejectionReason('');
        setSubmissionToReject(null);
      }
    } catch (error) {
      console.error('Failed to reject:', error);
      alert('Failed to reject KYC');
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectModal = (submissionId: number) => {
    setSubmissionToReject(submissionId);
    setShowRejectModal(true);
  };

  const viewDocument = async (filename: string) => {
    try {
      const token = localStorage.getItem('demoToken') || btoa(JSON.stringify({ userId: 3, email: 'admin@platform.com' }));
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      
      // Fetch document with Authorization header instead of query param
      const response = await fetch(`${apiBaseUrl}/api/kyc/admin/document/${filename}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Create blob and open in new window
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const newWindow = window.open(url, '_blank');
        
        // Clean up the blob URL after a delay
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else {
        alert('Failed to load document');
      }
    } catch (error) {
      console.error('Error viewing document:', error);
      alert('Failed to load document');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading KYC submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">KYC Review Panel</h1>
          <p className="text-gray-600 mt-2">Review and approve user KYC submissions</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Submissions List */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Pending Submissions ({submissions.length})</h2>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {submissions.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No pending KYC submissions
                </div>
              ) : (
                submissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="p-4 border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() => fetchSubmissionDetails(submission.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {submission.first_name} {submission.last_name}
                        </h3>
                        <p className="text-sm text-gray-600">{submission.email}</p>
                        <p className="text-sm text-gray-500">
                          {submission.documentCount} documents uploaded
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                          PENDING
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(submission.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Submission Details */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Submission Details</h2>
            </div>
            <div className="p-6">
              {!selectedSubmission ? (
                <div className="text-center text-gray-500 py-12">
                  Select a submission to view details
                </div>
              ) : (
                <div className="space-y-6">
                  {/* User Info */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">User Information</h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <p><strong>Name:</strong> {selectedSubmission.kyc.first_name} {selectedSubmission.kyc.last_name}</p>
                      <p><strong>Email:</strong> {selectedSubmission.kyc.email}</p>
                      <p><strong>Phone:</strong> {selectedSubmission.kyc.phone}</p>
                      <p><strong>Submitted:</strong> {new Date(selectedSubmission.kyc.created_at).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Documents */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Uploaded Documents</h3>
                    <div className="space-y-3">
                      {selectedSubmission.documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium capitalize">{doc.document_type.replace('_', ' ')}</p>
                            <p className="text-sm text-gray-600">{doc.original_filename}</p>
                            <p className="text-xs text-gray-500">
                              {(doc.file_size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <button
                            onClick={() => viewDocument(doc.filename)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                          >
                            View
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-4 pt-4">
                    <button
                      onClick={() => handleApprove(selectedSubmission.kyc.id)}
                      disabled={actionLoading}
                      className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400"
                    >
                      {actionLoading ? 'Processing...' : '✅ Approve KYC'}
                    </button>
                    <button
                      onClick={() => openRejectModal(selectedSubmission.kyc.id)}
                      disabled={actionLoading}
                      className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-400"
                    >
                      ❌ Reject KYC
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Reject KYC Submission</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                rows={4}
                placeholder="Please provide a clear reason for rejection..."
                required
              />
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                  setSubmissionToReject(null);
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading || !rejectionReason.trim()}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:bg-gray-400"
              >
                {actionLoading ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}