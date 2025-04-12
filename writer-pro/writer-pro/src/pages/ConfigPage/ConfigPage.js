import React from 'react';
import ConfigPageComponent from '../../components/ConfigPage';
import '../../App.css';

function ConfigPage() {
  return (
    <div className="config-page fade-in">
      <div className="page-header mb-4">
        <h1>Settings</h1>
        <p className="text-secondary">Configure your AI writing assistant preferences</p>
      </div>
      <div className="card">
        <ConfigPageComponent />
      </div>
    </div>
  );
}

export default ConfigPage; 