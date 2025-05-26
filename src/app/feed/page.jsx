'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';



import PdfFeedCard from '@/components/pdf/PdfFeedCard';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/loadingSpinner';

export default function MainFeedPage() {
  const router = useRouter();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    checkSession();
    fetchPublicFiles();
  }, []);

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/session', {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setSession({ user: data.user });
      }
    } catch (err) {
      console.error('Session check failed:', err);
    }
  };

  const fetchPublicFiles = async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const response = await fetch(`/api/public-files?page=${pageNum}&limit=10`);
      const data = await response.json();

      if (data.success) {
        if (append) {
          setFiles(prev => [...prev, ...data.files]);
        } else {
          setFiles(data.files);
        }
        setHasMore(data.hasMore);
        setPage(pageNum);
      } else {
        throw new Error(data.error || 'Failed to fetch files');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchPublicFiles(page + 1, true);
    }
  };

  const handleLike = async (fileId) => {
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    try {
      const response = await fetch('/api/files/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId }),
        credentials: 'include',
      });

      const data = await response.json();
      if (data.success) {
        setFiles(prev => prev.map(file => 
          file._id === fileId 
            ? { ...file, likes: data.likes, isLiked: data.isLiked }
            : file
        ));
      }
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  const handleShare = (file) => {
    if (navigator.share) {
      navigator.share({
        title: file.originalName,
        text: `Check out this PDF: ${file.originalName}`,
        url: `${window.location.origin}/share/${file.shareToken}`
      });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/share/${file.shareToken}`);
      alert('Share link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">PDF Community</h1>
            <div className="flex items-center space-x-4">
              {session ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/dashboard')}
                  >
                    My Dashboard
                  </Button>
                  <span className="text-sm text-gray-600">
                    {session.user.name || session.user.email}
                  </span>
                </>
              ) : (
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/auth/signin')}
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={() => router.push('/auth/signup')}
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {files.length === 0 && !loading ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No PDFs shared yet</h3>
            <p className="text-gray-600 mb-4">Be the first to share a PDF with the community!</p>
            {session && (
              <Button onClick={() => router.push('/dashboard')}>
                Upload Your First PDF
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {files.map((file) => (
              <PdfFeedCard
                key={file._id}
                file={file}
                currentUser={session?.user}
                onLike={handleLike}
                onShare={handleShare}
              />
            ))}

            {hasMore && (
              <div className="text-center py-6">
                <Button
                  onClick={loadMore}
                  disabled={loadingMore}
                  variant="outline"
                >
                  {loadingMore ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
