// Re-export components that function as pages
// This allows us to import from 'pages' instead of directly from components
import Editor from '../components/Editor';
import ConfigPage from '../components/ConfigPage';
import HistoryView from '../components/HistoryView';
import ReplyView from '../components/ReplyView';
import Todo from '../components/Todo';

export {
  Editor,
  ConfigPage,
  HistoryView,
  ReplyView,
  Todo
};

// For named imports
export default {
  Editor,
  ConfigPage,
  HistoryView,
  ReplyView,
  Todo
}; 