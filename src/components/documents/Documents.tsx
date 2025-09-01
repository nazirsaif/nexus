import React, { useState, useEffect } from 'react';
import { Upload, FileText, Search, Filter, Plus } from 'lucide-react';
import DocumentUpload from './DocumentUpload';
import DocumentsList from './DocumentsList';
import DocumentViewer from './DocumentViewer';
import ESignature from './ESignature';
import { API_URL } from '../../config/api';

interface Document {
  _id: string;
  title: string;
  description: string;
  originalName: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  uploadedBy: {
    _id: string;
    name: string;
    email: string;
  };
  version: number;
  status: 'draft' | 'review' | 'approved' | 'signed';
  category: string;
  tags: string[];
  isPublic: boolean;
  requiresSignature: boolean;
  signatures: Array<{
    signedBy: {
      _id: string;
      name: string;
      email: string;
    };
    signatureImageUrl: string;
    signedAt: string;
    ipAddress: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

const Documents: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showViewer, setShowViewer] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('business_nexus_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/documents`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      } else {
        throw new Error('Failed to fetch documents');
      }
    } catch (error) {
      console.error('Fetch documents error:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = (documents?: any[]) => {
    setShowUpload(false);
    fetchDocuments();
  };

  const handleViewDocument = (document: Document) => {
    setSelectedDocument(document);
    setShowViewer(true);
  };

  const handleSignDocument = (document: Document) => {
    setSelectedDocument(document);
    setShowSignature(true);
  };

  const handleSignatureAdded = () => {
    fetchDocuments();
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      const token = localStorage.getItem('business_nexus_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchDocuments();
      } else {
        throw new Error('Failed to delete document');
      }
    } catch (error) {
      console.error('Delete document error:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete document');
    }
  };

  const handleApproveDocument = async (document: Document) => {
    if (!confirm(`Are you sure you want to approve "${document.title}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('business_nexus_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/documents/${document._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'approved'
        })
      });

      if (response.ok) {
        fetchDocuments();
        alert('Document approved successfully!');
      } else {
        throw new Error('Failed to approve document');
      }
    } catch (error) {
      console.error('Approve document error:', error);
      alert(error instanceof Error ? error.message : 'Failed to approve document');
    }
  };

  // Filter documents based on search and filters
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.originalName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || doc.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || doc.category === filterCategory;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Get unique categories for filter
  const categories = Array.from(new Set(documents.map(doc => doc.category).filter(Boolean)));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading documents...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchDocuments}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Documents</h2>
          <p className="text-gray-600">Manage your documents, signatures, and file sharing</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="review">Review</option>
                <option value="approved">Approved</option>
                <option value="signed">Signed</option>
              </select>
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Documents Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <FileText className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Documents</p>
              <p className="text-2xl font-semibold text-gray-900">{documents.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-yellow-600 font-semibold text-sm">R</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Under Review</p>
              <p className="text-2xl font-semibold text-gray-900">
                {documents.filter(doc => doc.status === 'review').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 font-semibold text-sm">A</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Approved</p>
              <p className="text-2xl font-semibold text-gray-900">
                {documents.filter(doc => doc.status === 'approved').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 font-semibold text-sm">S</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Signed</p>
              <p className="text-2xl font-semibold text-gray-900">
                {documents.filter(doc => doc.status === 'signed').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Documents List */}
      <DocumentsList
        documents={filteredDocuments}
        onView={handleViewDocument}
        onSign={handleSignDocument}
        onDelete={handleDeleteDocument}
        onApprove={handleApproveDocument}
        onRefresh={fetchDocuments}
      />

      {/* Modals */}
      {showUpload && (
        <DocumentUpload
          onClose={() => setShowUpload(false)}
          onUploadSuccess={handleUploadSuccess}
        />
      )}

      {showViewer && selectedDocument && (
        <DocumentViewer
          document={selectedDocument}
          onClose={() => {
            setShowViewer(false);
            setSelectedDocument(null);
          }}
        />
      )}

      {showSignature && selectedDocument && (
        <ESignature
          document={selectedDocument}
          onClose={() => {
            setShowSignature(false);
            setSelectedDocument(null);
          }}
          onSignatureAdded={handleSignatureAdded}
        />
      )}
    </div>
  );
};

export default Documents;