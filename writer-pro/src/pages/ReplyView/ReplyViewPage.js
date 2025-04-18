import React, { useState } from 'react';
import OpenAIService from '../../services/openai';
import { getReplyInstruction } from '../../components/ConfigPage';
import '../../App.css';
import './ReplyViewPage.css';

// Helper to get next ID for thread items
let nextId = 0;

function ReplyViewPage() {
  // State management
  const [contextThread, setContextThread] = useState([{ id: nextId++, author: 'original', text: '' }]);
  const [newMessageText, setNewMessageText] = useState('');
  const [replyTone, setReplyTone] = useState('helpful');
  const [generatedReply, setGeneratedReply] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Functions
  const handleThreadTextChange = (id, newText) => {
    setContextThread(currentThread => 
      currentThread.map(item => 
        item.id === id ? { ...item, text: newText } : item
      )
    );
  };

  const addMessageToThread = (author) => {
    if (!newMessageText.trim()) return;
    setContextThread(currentThread => [
      ...currentThread,
      { id: nextId++, author: author, text: newMessageText }
    ]);
    setNewMessageText('');
  };

  const removeMessageFromThread = (idToRemove) => {
    setContextThread(currentThread => 
      currentThread.filter(item => !(item.id === idToRemove || (idToRemove === 'original' && item.author === 'original')))
    );
  };

  const resetThread = () => {
    setContextThread([{ id: nextId++, author: 'original', text: '' }]);
    setGeneratedReply('');
    setError('');
  };

  const handleGenerateReply = async () => {
    const originalPostItem = contextThread.find(item => item.author === 'original');
    if (!originalPostItem || !originalPostItem.text.trim()) {
      setError('Please add an original post to reply to.');
      return;
    }

    setIsLoading(true);
    setError('');
    setGeneratedReply('');

    try {
      const formattedContext = contextThread.map(item => 
        `[${item.author === 'me' ? 'My Reply' : item.author === 'other' ? 'Comment' : 'Original Post'}]\n${item.text}`
      ).join('\n\n---\n\n');
      
      const lastOtherComment = [...contextThread].reverse().find(item => item.author === 'other');
      
      let actionDescription = lastOtherComment
        ? `Generate a ${replyTone} reply to the last [Comment] in the following thread, considering the full context.`
        : `Generate a ${replyTone} comment on the [Original Post] in the following thread.`;

      const finalPrompt = `Context Thread:\n${formattedContext}\n\n---\n\nTask: ${actionDescription}`;
      const customInstruction = getReplyInstruction();
      
      const reply = await OpenAIService.generateReply(finalPrompt, replyTone, customInstruction);
      setGeneratedReply(reply);
    } catch (err) {
      console.error("Error generating reply:", err);
      setError(`Failed to generate reply. ${err.message || 'API error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(generatedReply);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="reply-page">
      <div className="content-card">
        <h2>Reply Composer</h2>
        <p className="subtitle">Create perfect responses to comments and posts</p>
        
        <div className="reply-thread-section">
          <h3>Conversation Thread</h3>
          <div className="thread-list">
            {contextThread.map((item) => (
              <div key={item.id} className={`thread-item thread-item-${item.author}`}>
                <div className="thread-item-header">
                  <label>
                    {item.author === 'original' ? 'Original Post' : 
                     item.author === 'other' ? 'Comment from Others' : 'My Reply'}
                  </label>
                  {item.author !== 'original' && (
                    <button
                      className="remove-button"
                      onClick={() => removeMessageFromThread(item.id)}
                      title="Remove this item"
                    >
                      ×
                    </button>
                  )}
                </div>
                <textarea
                  className="thread-textarea"
                  value={item.text}
                  onChange={(e) => handleThreadTextChange(item.id, e.target.value)}
                  placeholder={
                    item.author === 'original' 
                      ? 'Enter the original post content...' 
                      : item.author === 'other' 
                        ? 'Enter a comment from another person...' 
                        : 'Enter your reply...'
                  }
                  rows={3}
                />
              </div>
            ))}
          </div>
          
          <div className="add-message-section">
            <textarea
              className="new-message-input"
              value={newMessageText}
              onChange={(e) => setNewMessageText(e.target.value)}
              placeholder="Write a message to add to the thread..."
              rows={3}
            />
            <div className="add-message-buttons">
              <button 
                className="action-button secondary"
                onClick={() => addMessageToThread('other')}
                disabled={!newMessageText.trim()}
              >
                Add as Comment
              </button>
              <button 
                className="action-button secondary"
                onClick={() => addMessageToThread('me')}
                disabled={!newMessageText.trim()}
              >
                Add as My Reply
              </button>
            </div>
          </div>
        </div>
        
        <div className="tone-section">
          <div className="form-group">
            <label htmlFor="tone-select">Response Tone</label>
            <select 
              id="tone-select" 
              value={replyTone} 
              onChange={e => setReplyTone(e.target.value)}
              className="tone-dropdown"
            >
              <option value="helpful">Helpful</option>
              <option value="appreciative">Appreciative</option>
              <option value="critical">Critical</option>
              <option value="funny">Funny</option>
              <option value="formal">Formal</option>
              <option value="casual">Casual</option>
              <option value="agreeable">Agreeable</option>
              <option value="disagreeable">Disagreeable</option>
              <option value="empathetic">Empathetic</option>
              <option value="professional">Professional</option>
            </select>
          </div>
          
          <div className="action-container">
            <button 
              className="action-button primary"
              onClick={handleGenerateReply}
              disabled={!(contextThread.find(item => item.author === 'original')?.text.trim()) || isLoading}
            >
              {isLoading ? (
                <>
                  <span className="loading-spinner"></span>
                  <span>Generating...</span>
                </>
              ) : (
                <>Generate Reply</>
              )}
            </button>
            <button 
              className="action-button secondary"
              onClick={resetThread}
              title="Reset conversation"
            >
              Reset Thread
            </button>
          </div>
        </div>
        
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}
        
        {generatedReply && (
          <div className="results-section">
            <div className="results-header">
              <h3>Generated Reply</h3>
              <button 
                className="copy-button"
                onClick={handleCopyToClipboard}
              >
                {copySuccess ? 'Copied! ✓' : 'Copy'}
              </button>
            </div>
            <div className="result-content">
              {generatedReply}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReplyViewPage; 