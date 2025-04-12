import React, { useState, useEffect } from 'react';
import OpenAIService from '../services/openai';
import { getReplyInstruction } from './ConfigPage'; // Import the getter
import './ReplyView.css';

// Helper to get next ID for thread items
let nextId = 0;

function ReplyView() {
  // Replace individual states with a context thread array
  const [contextThread, setContextThread] = useState([{ id: nextId++, author: 'original', text: '' }]);
  const [newMessageText, setNewMessageText] = useState(''); // State for the new message input
  
  const [replyTone, setReplyTone] = useState('helpful'); // e.g., helpful, appreciative, critical, funny
  const [generatedReply, setGeneratedReply] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Function to handle changes in any textarea within the thread
  const handleThreadTextChange = (id, newText) => {
    setContextThread(currentThread => 
      currentThread.map(item => 
        item.id === id ? { ...item, text: newText } : item
      )
    );
  };

  // Function to add a new message to the thread
  const addMessageToThread = (author) => {
    if (!newMessageText.trim()) return; // Don't add empty messages
    setContextThread(currentThread => [
      ...currentThread,
      { id: nextId++, author: author, text: newMessageText }
    ]);
    setNewMessageText(''); // Clear the input field
  };

  // Function to remove a message from the thread (except the original post)
  const removeMessageFromThread = (idToRemove) => {
    setContextThread(currentThread => 
      currentThread.filter(item => item.id !== idToRemove && item.author !== 'original')
    );
  };

  const handleGenerateReply = async () => {
    // Find the original post
    const originalPostItem = contextThread.find(item => item.author === 'original');
    if (!originalPostItem || !originalPostItem.text.trim()) return; // Require original post text

    // Find the last message from 'other' to reply to
    const lastOtherComment = [...contextThread].reverse().find(item => item.author === 'other');

    setIsLoading(true);
    setError('');
    setGeneratedReply('');

    try {
      // Format the context thread for the AI
      const formattedContext = contextThread.map(item => 
        `[${item.author === 'me' ? 'My Reply' : item.author === 'other' ? 'Comment' : 'Original Post'}]\n${item.text}`
      ).join('\n\n---\n\n');
      
      let actionDescription = '';
      if (lastOtherComment) {
        // Replying to the last comment from 'other'
        actionDescription = `Generate a ${replyTone} reply to the last [Comment] in the following thread, considering the full context.`;
      } else {
        // Commenting on the original post
        actionDescription = `Generate a ${replyTone} comment on the [Original Post] in the following thread.`;
      }

      const finalPrompt = `Context Thread:\n${formattedContext}\n\n---\n\nTask: ${actionDescription}`;

      const customInstruction = getReplyInstruction(); 
      
      // TODO: Update backend to accept structured context 
      const reply = await OpenAIService.generateReply(finalPrompt, replyTone, customInstruction);
      setGeneratedReply(reply);
    } catch (err) {
      console.error("Error generating reply:", err);
      setError(`Failed to generate reply. ${err.message || 'API error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="reply-view">
      <div className="content-card">
        <div className="content-nav">
          <h2 className="nav-title">Comment / Reply Thread</h2>
        </div>

        {/* Display the Context Thread */}
        <div className="reply-thread-display">
          {contextThread.map((item, index) => (
            <div key={item.id} className={`thread-item thread-item-${item.author}`}>
              <label htmlFor={`thread-input-${item.id}`}>
                {item.author === 'original' ? 'Original Post / Post to Comment On:' : item.author === 'other' ? 'Comment from Other:' : 'My Previous Reply:'}
              </label>
              <textarea
                id={`thread-input-${item.id}`}
                className="content-textarea thread-textarea"
                value={item.text}
                onChange={(e) => handleThreadTextChange(item.id, e.target.value)}
                placeholder={`Enter ${item.author === 'original' ? 'original post' : 'comment / reply'}...`}
                rows={item.author === 'original' ? 4 : 3} 
              />
              {item.author !== 'original' && (
                <button 
                  className="remove-item-button"
                  onClick={() => removeMessageFromThread(item.id)}
                  title="Remove this item"
                >
                  &times;
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add New Message Section */}
        <div className="add-message-section">
          <textarea
            className="content-textarea new-message-input"
            value={newMessageText}
            onChange={(e) => setNewMessageText(e.target.value)}
            placeholder="Type new comment or your reply here..."
            rows={3}
          />
          <div className="add-message-buttons">
            <button 
              className="action-button secondary small-button" 
              onClick={() => addMessageToThread('other')} 
              disabled={!newMessageText.trim()}
            >
              Add Comment from Other
            </button>
            <button 
              className="action-button secondary small-button" 
              onClick={() => addMessageToThread('me')} 
              disabled={!newMessageText.trim()}
            >
              Add My Reply
            </button>
          </div>
        </div>

        {/* Reply Generation Section */}
        <div className="reply-generation-section">
          <div className="form-group tone-selector">
            <label htmlFor="reply-tone">Desired Tone for Generated Reply/Comment:</label>
            <select 
              id="reply-tone"
              value={replyTone}
              onChange={(e) => setReplyTone(e.target.value)}
            >
              <option value="helpful">Helpful</option>
              <option value="appreciative">Appreciative</option>
              <option value="critical">Addressing Criticism</option>
              <option value="funny">Funny / Witty</option>
              <option value="formal">Formal</option>
              <option value="casual">Casual</option>
              <option value="agreeable">Agreeable</option>
              <option value="disagreeable">Disagreeable</option>              
            </select>
          </div>

          <div className="action-container">
            <button 
              className="action-button primary" 
              onClick={handleGenerateReply}
              // Enable if original post has text
              disabled={!(contextThread.find(item => item.author === 'original')?.text.trim()) || isLoading} 
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner small"></div>
                  Generating...
                </>
              ) : (contextThread.some(item => item.author === 'other') ? 'Generate Reply' : 'Generate Comment')}
            </button>
          </div>
        </div>

        {error && (
          <div className="api-error-message">
            <p>⚠️ {error}</p>
          </div>
        )}

        {generatedReply && (
          <div className="reply-result">
            <h3>Generated Reply / Comment:</h3>
            <textarea
              className="content-textarea result-textarea"
              value={generatedReply}
              readOnly
              rows={5}
            />
            <button 
              className="action-button secondary small-button copy-button"
              onClick={() => navigator.clipboard.writeText(generatedReply)}
            >
              Copy
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReplyView; 