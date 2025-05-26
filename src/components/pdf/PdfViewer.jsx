// src/components/pdf/PdfViewer.js
'use client';

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

import Button from '../ui/Button';
import LoadingSpinner from '../ui/loadingSpinner';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function PdfViewer({ pdfUrl, className = '' }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scale, setScale] = useState(1.0);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  const onDocumentLoadError = (error) => {
    console.error('PDF load error:', error);
    setError('Failed to load PDF');
    setLoading(false);
  };

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages));
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 2.0));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  if (error) {
    return (
      <div className={`flex items-center justify-center h-96 bg-gray-50 rounded-lg ${className}`}>
        <div className="text-center">
          <svg 
            className="mx-auto h-16 w-16 text-gray-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
          <p className="mt-4 text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* PDF Controls */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {pageNumber} of {numPages || '--'}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
          >
            Next
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={zoomOut}
            disabled={scale <= 0.5}
          >
            -
          </Button>
          <span className="text-sm text-gray-600 min-w-16 text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={zoomIn}
            disabled={scale >= 2.0}
          >
            +
          </Button>
        </div>
      </div>

      {/* PDF Document */}
      <div className="p-4 bg-gray-50 min-h-96">
        {loading && (
          <div className="flex justify-center items-center h-96">
            <LoadingSpinner size="lg" />
          </div>
        )}

        <div className="flex justify-center">
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={<LoadingSpinner size="lg" />}
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>
        </div>
      </div>
    </div>
  );
}