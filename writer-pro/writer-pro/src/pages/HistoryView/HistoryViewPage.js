import React from 'react';
import HistoryView from '../../components/HistoryView';
import '../../App.css';

function HistoryViewPage() {
  return (
    <div className="history-view-page fade-in">
      <div className="page-header mb-4">
        <h1>Content History</h1>
        <p className="text-secondary">View and manage your previously created content</p>
      </div>
      <div className="card">
        <HistoryView />
      </div>
    </div>
  );
}

export default HistoryViewPage; 