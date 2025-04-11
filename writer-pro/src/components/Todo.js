import React, { useState } from 'react';
import './Todo.css';

function Todo() {
  const [tasks, setTasks] = useState([
    // UI and Layout Tasks
    { id: 1, text: 'Create responsive navbar component', completed: false, category: 'UI' },
    { id: 2, text: 'Implement sidebar navigation', completed: false, category: 'UI' },
    { id: 3, text: 'Design dashboard layout', completed: false, category: 'UI' },
    { id: 4, text: 'Create platform selection UI', completed: false, category: 'UI' },
    { id: 5, text: 'Implement dark/light theme toggle', completed: false, category: 'UI' },
    
    // Platform-specific Content Editors
    { id: 6, text: 'Build Twitter editor with character count', completed: false, category: 'Platform' },
    { id: 7, text: 'Create LinkedIn editor with professional tone analysis', completed: false, category: 'Platform' },
    { id: 8, text: 'Develop Instagram editor with caption generator', completed: false, category: 'Platform' },
    { id: 9, text: 'Build blog editor with SEO recommendations', completed: false, category: 'Platform' },
    { id: 10, text: 'Add hashtag suggestions for social media posts', completed: false, category: 'Platform' },
    
    // User Behavior Analysis
    { id: 11, text: 'Implement content performance tracking', completed: false, category: 'Analytics' },
    { id: 12, text: 'Create user writing style analyzer', completed: false, category: 'Analytics' },
    { id: 13, text: 'Add writing time pattern tracker', completed: false, category: 'Analytics' },
    { id: 14, text: 'Set up topic preference tracking', completed: false, category: 'Analytics' },
    { id: 15, text: 'Design analytics dashboard', completed: false, category: 'Analytics' },
    
    // AI-Powered Assistance
    { id: 16, text: 'Integrate AI for content improvement suggestions', completed: false, category: 'AI' },
    { id: 17, text: 'Add platform-specific tone recommendations', completed: false, category: 'AI' },
    { id: 18, text: 'Implement engagement prediction feature', completed: false, category: 'AI' },
    { id: 19, text: 'Create content calendaring suggestions', completed: false, category: 'AI' },
    { id: 20, text: 'Develop readability analysis tool', completed: false, category: 'AI' },
    
    // Advanced Features
    { id: 21, text: 'Build content scheduling functionality', completed: false, category: 'Advanced' },
    { id: 22, text: 'Implement A/B testing for content variants', completed: false, category: 'Advanced' },
    { id: 23, text: 'Create audience targeting suggestions', completed: false, category: 'Advanced' },
    { id: 24, text: 'Set up social platform integrations', completed: false, category: 'Advanced' },
    { id: 25, text: 'Add export and sharing capabilities', completed: false, category: 'Advanced' }
  ]);

  const [filter, setFilter] = useState('All');

  const toggleComplete = (id) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const filteredTasks = filter === 'All' 
    ? tasks 
    : filter === 'Completed' 
      ? tasks.filter(task => task.completed) 
      : filter === 'Active' 
        ? tasks.filter(task => !task.completed)
        : tasks.filter(task => task.category === filter);

  return (
    <div className="todo-container">
      <h2>Writer Pro Development Tasks</h2>
      
      <div className="todo-filters">
        <button 
          className={filter === 'All' ? 'active' : ''} 
          onClick={() => setFilter('All')}
        >
          All
        </button>
        <button 
          className={filter === 'Active' ? 'active' : ''} 
          onClick={() => setFilter('Active')}
        >
          Active
        </button>
        <button 
          className={filter === 'Completed' ? 'active' : ''} 
          onClick={() => setFilter('Completed')}
        >
          Completed
        </button>
        <button 
          className={filter === 'UI' ? 'active' : ''} 
          onClick={() => setFilter('UI')}
        >
          UI & Layout
        </button>
        <button 
          className={filter === 'Platform' ? 'active' : ''} 
          onClick={() => setFilter('Platform')}
        >
          Platform Editors
        </button>
        <button 
          className={filter === 'Analytics' ? 'active' : ''} 
          onClick={() => setFilter('Analytics')}
        >
          Analytics
        </button>
        <button 
          className={filter === 'AI' ? 'active' : ''} 
          onClick={() => setFilter('AI')}
        >
          AI Features
        </button>
        <button 
          className={filter === 'Advanced' ? 'active' : ''} 
          onClick={() => setFilter('Advanced')}
        >
          Advanced
        </button>
      </div>
      
      <div className="progress-bar">
        <div 
          className="progress" 
          style={{ width: `${(tasks.filter(task => task.completed).length / tasks.length) * 100}%` }}
        ></div>
      </div>
      <div className="progress-text">
        {tasks.filter(task => task.completed).length} of {tasks.length} tasks completed
      </div>
      
      <ul className="todo-list">
        {filteredTasks.map(task => (
          <li key={task.id} className={task.completed ? 'completed' : ''}>
            <input 
              type="checkbox" 
              checked={task.completed} 
              onChange={() => toggleComplete(task.id)} 
            />
            <span className="task-text">{task.text}</span>
            <span className={`task-category ${task.category.toLowerCase()}`}>
              {task.category}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Todo; 