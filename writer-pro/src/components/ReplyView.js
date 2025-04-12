import React, { useState, useEffect } from 'react';
import OpenAIService from '../services/openai';
import { getReplyInstruction } from './ConfigPage'; // Import the getter
import './ReplyView.css';

function ReplyView() {
  const [originalPost, setOriginalPost] = useState(''); // New state for original post
  const [commentText, setCommentText] = useState('');
  const [followUpComment, setFollowUpComment] = useState(''); // New state for follow-up
  const [replyTone, setReplyTone] = useState('helpful'); // e.g., helpful, appreciative, critical, funny
  const [generatedReply, setGeneratedReply] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateReply = async () => {
    // Require either original post (to comment on) or a comment (to reply to)
    if (!originalPost && !commentText) return; 

    setIsLoading(true);
    setError('');
    setGeneratedReply('');

    try {
      let detailedContext = '';
      let actionDescription = '';

      if (commentText) {
        // --- Replying to a comment --- 
        actionDescription = `Generate a ${replyTone} reply to the "Comment to Reply To", considering the context provided.`;
        if (originalPost) {
          detailedContext += `Original Post:\n"${originalPost}"\n\n`;
        }
        detailedContext += `Comment to Reply To:\n"${commentText}"\n\n`;
        if (followUpComment) {
          detailedContext += `Follow-up Comment:\n"${followUpComment}"\n\n`;
        }
      } else {
        // --- Commenting on the original post --- 
        actionDescription = `Generate a ${replyTone} comment on the "Original Post".`;
        detailedContext += `Original Post:\n"${originalPost}"\n\n`;
        // Ignore followUpComment if we are commenting directly on the post
      }
      
      const finalPrompt = `${detailedContext}${actionDescription}`;

      // Get custom instruction from ConfigPage
      const customInstruction = getReplyInstruction(); 
      
      // TODO: Update backend to accept structured context 
      // Sending the combined context/prompt in the 'comment' field.
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
          <h2 className="nav-title">Comment on Post / Reply to Comment</h2>
        </div>

        <div className="reply-thread-container">
          {/* Original Post Input */}
          <div className="thread-item original-post-input">
            <label htmlFor="original-post">Original Post / Post to Comment On:</label>
            <textarea
              id="original-post"
              className="content-textarea"
              value={originalPost}
              onChange={(e) => setOriginalPost(e.target.value)}
              placeholder="Paste the original post here for context..."
              rows={4}
            />
          </div>

          {/* Comment to Reply To Input */}
          <div className="thread-item comment-to-reply-input">
            <label htmlFor="comment-text">Comment to Reply To (Optional):</label>
            <textarea
              id="comment-text"
              className="content-textarea"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Paste the specific comment you want to reply to here... Leave blank to comment on the Original Post."
              rows={4}
            />
          </div>

          {/* Follow-up Comment Input */}
          <div className="thread-item followup-comment-input">
            <label htmlFor="followup-comment">Follow-up Comment (Optional Context):</label>
            <textarea
              id="followup-comment"
              className="content-textarea"
              value={followUpComment}
              onChange={(e) => setFollowUpComment(e.target.value)}
              placeholder="Paste any follow-up comment for context..."
              rows={3}
            />
          </div>
        </div>

        {/* Reply Generation Section */}
        <div className="reply-generation-section">
          <div className="form-group tone-selector">
            <label htmlFor="reply-tone">Desired Reply Tone:</label>
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
              disabled={(!originalPost && !commentText) || isLoading}
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner small"></div>
                  Generating Reply...
                </>
              ) : 'Generate Reply'}
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
            <h3>Generated Reply:</h3>
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
              Copy Reply
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReplyView; 