import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './HistoryView.css';

function HistoryView() {
  const [contentHistory, setContentHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('History feature is temporarily disabled.');
  const [activeContentType, setActiveContentType] = useState('all');
  const [selectedContent, setSelectedContent] = useState(null);

  useEffect(() => {
    setIsLoading(false);
    setError('History feature is temporarily disabled as Supabase is removed.');
    setContentHistory([]);
  }, [activeContentType]);

  const loadContentHistory = async () => {
    setIsLoading(false);
    setError('History feature is temporarily disabled.');
    setContentHistory([]);
  };

  const handleContentTypeChange = (contentType) => {
    setActiveContentType(contentType);
    setSelectedContent(null);
  };

  const handleContentSelect = (content) => {
    setSelectedContent(content);
  };

  const getContentIcon = (contentType) => {
    switch (contentType) {
      case 'outline':
        return '📋';
      case 'optimized':
        return '✨';
      case 'rewritten':
        return '🔄';
      default:
        return '📄';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        alert('Content copied to clipboard!');
      })
      .catch(err => {
        console.error('Could not copy text: ', err);
      });
  };

  return (
    <div className="history-view">
      <div className="content-card">
        <div className="content-nav">
          <h2 className="nav-title">Content History</h2>
        </div>
        
        <div className="history-tabs">
          <button 
            className={`history-tab ${activeContentType === 'all' ? 'active' : ''}`}
            onClick={() => handleContentTypeChange('all')}
          >
            All
          </button>
          <button 
            className={`history-tab ${activeContentType === 'outline' ? 'active' : ''}`}
            onClick={() => handleContentTypeChange('outline')}
          >
            <span>📋</span> Outlines
          </button>
          <button 
            className={`history-tab ${activeContentType === 'optimized' ? 'active' : ''}`}
            onClick={() => handleContentTypeChange('optimized')}
          >
            <span>✨</span> Optimized
          </button>
          <button 
            className={`history-tab ${activeContentType === 'rewritten' ? 'active' : ''}`}
            onClick={() => handleContentTypeChange('rewritten')}
          >
            <span>🔄</span> Rewritten
          </button>
        </div>
        
        {isLoading ? (
          <div className="loading-indicator">
            <div className="loading-spinner"></div>
            <p>Loading content history...</p>
          </div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : contentHistory.length === 0 ? (
          <div className="empty-state">
            <p>No content history found. Start generating content to see it here!</p>
          </div>
        ) : (
          <div className="history-content">
            <div className="history-list">
              {contentHistory.map(content => (
                <div 
                  key={content.id} 
                  className={`history-item ${selectedContent?.id === content.id ? 'selected' : ''}`}
                  onClick={() => handleContentSelect(content)}
                >
                  <div className="history-item-icon">
                    {getContentIcon(content.content_type)}
                  </div>
                  <div className="history-item-details">
                    <h3>{content.title || 'Untitled'}</h3>
                    <div className="history-item-meta">
                      <span className="content-type">{content.content_type}</span>
                      {content.platform && (
                        <span className="platform">{content.platform}</span>
                      )}
                      {content.style && (
                        <span className="style">{content.style}</span>
                      )}
                    </div>
                    <div className="history-item-date">
                      {formatDate(content.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {selectedContent && (
              <div className="content-preview">
                <div className="preview-header">
                  <h3>{selectedContent.title || 'Untitled'}</h3>
                  <button 
                    className="action-button secondary small-button"
                    onClick={() => copyToClipboard(selectedContent.content_text)}
                  >
                    Copy
                  </button>
                </div>
                
                {selectedContent.description && (
                  <div className="content-description">
                    <h4>Original Description:</h4>
                    <p>{selectedContent.description}</p>
                  </div>
                )}
                
                <div className="content-text markdown-preview">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {selectedContent.content_text}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default HistoryView; 