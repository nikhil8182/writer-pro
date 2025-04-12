import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from '../pages/HomePage/HomePage';
import RewritePage from '../pages/RewritePage/RewritePage';
import ConfigPage from '../pages/ConfigPage/ConfigPage';
import HistoryViewPage from '../pages/HistoryView/HistoryViewPage';
import ReplyViewPage from '../pages/ReplyView/ReplyViewPage';
import TodoPage from '../pages/Todo/TodoPage';

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/rewrite" element={<RewritePage />} />
        <Route path="/config" element={<ConfigPage />} />
        <Route path="/history" element={<HistoryViewPage />} />
        <Route path="/reply" element={<ReplyViewPage />} />
        <Route path="/todo" element={<TodoPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router; 