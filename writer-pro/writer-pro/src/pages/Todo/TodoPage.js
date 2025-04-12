import React from 'react';
import Todo from '../../components/Todo';
import '../../App.css';

function TodoPage() {
  return (
    <div className="todo-page fade-in">
      <div className="page-header mb-4">
        <h1>Task Manager</h1>
        <p className="text-secondary">Manage your content creation tasks</p>
      </div>
      <div className="card">
        <Todo />
      </div>
    </div>
  );
}

export default TodoPage; 