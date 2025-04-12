import React from 'react';
import ReplyView from '../../components/ReplyView';
import '../../App.css';

function ReplyViewPage() {
  return (
    <div className="reply-view-page fade-in">
      <div className="page-header mb-4">
        <h1>Reply Assistant</h1>
        <p className="text-secondary">Generate professional replies to messages</p>
      </div>
      <div className="card">
        <ReplyView />
      </div>
    </div>
  );
}

export default ReplyViewPage; 