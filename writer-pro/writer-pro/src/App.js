import './App.css';
import { ThemeProvider } from './contexts/ThemeContext';
import Router from './components/Router';

function App() {
  return (
    <ThemeProvider>
      <Router />
    </ThemeProvider>
  );
}

export default App; 