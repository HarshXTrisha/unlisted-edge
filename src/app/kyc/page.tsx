'use client';

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { uploadKYCDocuments, fetchKYCStatus, clearError } from '../../store/slices/simpleKycSlice';

const documentTypes = [
    { value: 'aadhaar', label: 'Aadhaar Card' },
    { value: 'pan', label: 'PAN Card' },
    { value: 'bank_statement', label: 'Bank Statement' }
];

export default function KYCPage() {
    const dispatch = useDispatch<AppDispatch>();
    const { status, isLoading, error, uploadProgress } = useSelector((state: RootState) => state.kyc);

    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [uploadError, setUploadError] = useState<string>('');

    useEffect(() => {
        dispatch(fetchKYCStatus());
    }, [dispatch]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setSelectedFiles(files);
            // Initialize document types array
            setSelectedTypes(new Array(files.length).fill('aadhaar'));
        }
    };

    const handleTypeChange = (index: number, type: string) => {
        const newTypes = [...selectedTypes];
        newTypes[index] = type;
        setSelectedTypes(newTypes);
    };

    const handleUpload = async () => {
        // Client-side validation
        if (selectedFiles.length === 0) {
            setUploadError('Please select files to upload');
            return;
        }

        if (selectedFiles.length > 5) {
            setUploadError('Maximum 5 files allowed');
            return;
        }

        // Check file sizes
        const maxSize = 5 * 1024 * 1024; // 5MB
        const oversizedFiles = selectedFiles.filter(file => file.size > maxSize);
        if (oversizedFiles.length > 0) {
            setUploadError(`Files too large. Maximum size is 5MB per file. Oversized files: ${oversizedFiles.map(f => f.name).join(', ')}`);
            return;
        }

        // Clear any previous errors
        setUploadError('');

        try {
            // Create FormData directly instead of using DataTransfer
            const formData = new FormData();
            selectedFiles.forEach(file => {
                formData.append('documents', file);
            });
            formData.append('documentTypes', JSON.stringify(selectedTypes));

            await dispatch(uploadKYCDocuments({
                files: selectedFiles,
                documentTypes: selectedTypes
            })).unwrap();

            // Refresh status after upload
            dispatch(fetchKYCStatus());

            // Clear form
            setSelectedFiles([]);
            setSelectedTypes([]);

            // Show success message (replace alert with proper UI feedback)
            setError(''); // Clear any errors
            // In a real app, you'd set a success state here instead of alert
            alert('Documents uploaded successfully! Waiting for admin approval.');
        } catch (error) {
            console.error('Upload failed:', error);
            setUploadError(error.message || 'Upload failed. Please try again.');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'verified': return 'text-green-600 bg-green-100';
            case 'pending': return 'text-yellow-600 bg-yellow-100';
            case 'rejected': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'verified': return '✅';
            case 'pending': return '⏳';
            case 'rejected': return '❌';
            default: return '📄';
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading KYC status...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-6">KYC Verification</h1>

                    {error && (
                        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                            <div className="flex justify-between items-center">
                                <span>{error}</span>
                                <button
                                    onClick={() => dispatch(clearError())}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Current Status */}
                    {status && (
                        <div className="mb-8 p-6 border rounded-lg">
                            <h2 className="text-xl font-semibold mb-4">Current Status</h2>
                            <div className="flex items-center space-x-4">
                                <span className="text-2xl">{getStatusIcon(status.status)}</span>
                                <div>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status.status)}`}>
                                        {status.status.toUpperCase()}
                                    </span>
                                    <p className="text-gray-600 mt-2">{status.message}</p>
                                    {status.rejectionReason && (
                                        <p className="text-red-600 mt-2">
                                            <strong>Rejection Reason:</strong> {status.rejectionReason}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {status.documents && status.documents.length > 0 && (
                                <div className="mt-4">
                                    <h3 className="font-medium mb-2">Uploaded Documents:</h3>
                                    <ul className="space-y-1">
                                        {status.documents.map((doc, index) => (
                                            <li key={index} className="text-sm text-gray-600">
                                                • {doc.document_type}: {doc.original_filename}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {!status.canTrade && (
                                <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
                                    <strong>⚠️ Trading Restricted:</strong> Complete KYC verification to start trading.
                                </div>
                            )}
                        </div>
                    )}

                    {/* Upload Form */}
                    {(!status || status.status === 'rejected' || status.status === 'not_started') && (
                        <div className="border rounded-lg p-6">
                            <h2 className="text-xl font-semibold mb-4">
                                {status?.status === 'rejected' ? 'Resubmit Documents' : 'Upload KYC Documents'}
                            </h2>

                            {uploadError && (
                                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                                    {uploadError}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select Documents (Max 5 files, 5MB each)
                                    </label>
                                    <input
                                        type="file"
                                        multiple
                                        accept=".jpg,.jpeg,.png,.pdf"
                                        onChange={handleFileChange}
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        disabled={uploadProgress}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Accepted formats: JPG, PNG, PDF
                                    </p>
                                </div>

                                {selectedFiles.length > 0 && (
                                    <div className="space-y-3">
                                        <h3 className="font-medium">Selected Files:</h3>
                                        {selectedFiles.map((file, index) => (
                                            <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded">
                                                <span className="text-sm text-gray-600 flex-1">{file.name}</span>
                                                <select
                                                    value={selectedTypes[index] || 'aadhaar'}
                                                    onChange={(e) => handleTypeChange(index, e.target.value)}
                                                    className="text-sm border rounded px-2 py-1"
                                                    disabled={uploadProgress}
                                                >
                                                    {documentTypes.map(type => (
                                                        <option key={type.value} value={type.value}>
                                                            {type.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <button
                                    onClick={handleUpload}
                                    disabled={selectedFiles.length === 0 || uploadProgress}
                                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {uploadProgress ? (
                                        <span className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Uploading...
                                        </span>
                                    ) : (
                                        'Upload Documents'
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Trading Status */}
                    <div className="mt-8 p-4 border rounded-lg">
                        <h3 className="font-semibold mb-2">Trading Access</h3>
                        {status?.canTrade ? (
                            <div className="flex items-center text-green-600">
                                <span className="mr-2">✅</span>
                                <span>You can now trade on the platform!</span>
                            </div>
                        ) : (
                            <div className="flex items-center text-red-600">
                                <span className="mr-2">🚫</span>
                                <span>Trading is restricted until KYC verification is complete.</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}