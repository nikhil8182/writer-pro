import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from '../pages/HomePage/HomePage';
import RewritePage from '../pages/RewritePage/RewritePage';
import ConfigPage from '../pages/ConfigPage/ConfigPage';
import HistoryViewPage from '../pages/HistoryView/HistoryViewPage';
import ReplyViewPage from '../pages/ReplyView/ReplyViewPage';
import TodoPage from '../pages/Todo/TodoPage';
import Layout from './Layout/Layout';

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <Layout>
            <HomePage />
          </Layout>
        } />
        <Route path="/rewrite" element={
          <Layout>
            <RewritePage />
          </Layout>
        } />
        <Route path="/config" element={
          <Layout>
            <ConfigPage />
          </Layout>
        } />
        <Route path="/history" element={
          <Layout>
            <HistoryViewPage />
          </Layout>
        } />
        <Route path="/reply" element={
          <Layout>
            <ReplyViewPage />
          </Layout>
        } />
        <Route path="/todo" element={
          <Layout>
            <TodoPage />
          </Layout>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router; 