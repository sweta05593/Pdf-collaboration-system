// src/app/dashboard/page.js
'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import PdfUpload from '../../components/pdf/PdfUpload';
import PdfList from '../../components/pdf/PdfList';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import LoadingSpinner from '@/components/ui/loadingSpinner';

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [sessionStatus, setSessionStatus] = useState('loading');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check session on component mount
  useEffect(() => {
    checkSession();
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [sessionStatus, router]);

  const checkSession = async () => {
    try {
      setSessionStatus('loading');
      
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSession({ user: data.user });
        setSessionStatus('authenticated');
      } else {
        setSession(null);
        setSessionStatus('unauthenticated');
      }
    } catch (err) {
      console.error('Session check failed:', err);
      setSession(null);
      setSessionStatus('unauthenticated');
      setError('Failed to verify session');
    }
  };

  const handleUploadSuccess = (file) => {
    try {
      setShowUploadModal(false);
      setRefreshTrigger(prev => prev + 1);
      setError(null);
    } catch (err) {
      console.error('Error handling upload success:', err);
      setError('Failed to refresh file list');
    }
  };

  const handleUploadError = (error) => {
    setError(error.message || 'Upload failed');
    setIsLoading(false);
  };

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        setSession(null);
        setSessionStatus('unauthenticated');
        router.push('/');
      } else {
        throw new Error('Sign out failed');
      }
    } catch (err) {
      console.error('Sign out error:', err);
      setError('Failed to sign out');
    } finally {
      setIsLoading(false);
    }
  };

  const openUploadModal = () => {
    setShowUploadModal(true);
    setError(null);
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setError(null);
  };

  const clearError = () => {
    setError(null);
  };

  // Show loading spinner while checking session
  if (sessionStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!session || sessionStatus !== 'authenticated') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                PDF Collaboration
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {session.user.name || session.user.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                disabled={isLoading}
              >
                {isLoading ? 'Signing Out...' : 'Sign Out'}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
              <button
                onClick={clearError}
                className="text-red-400 hover:text-red-600"
                aria-label="Clear error"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Your Documents</h2>
              <p className="mt-1 text-sm text-gray-600">
                Upload and manage your PDF documents for collaboration
              </p>
            </div>
            <Button
              onClick={openUploadModal}
              className="flex items-center space-x-2"
              disabled={isLoading}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Upload PDF</span>
            </Button>
          </div>
        </div>

        {/* PDF List */}
        <div className="bg-white shadow rounded-lg">
          <PdfList 
            refreshTrigger={refreshTrigger}
            onError={setError}
          />
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <Modal
            isOpen={showUploadModal}
            onClose={closeUploadModal}
            title="Upload PDF Document"
          >
            <div className="mt-4">
              <PdfUpload
                onSuccess={handleUploadSuccess}
                onError={handleUploadError}
                onLoadingChange={setIsLoading}
              />
            </div>
          </Modal>
        )}
      </main>
    </div>
  );
}