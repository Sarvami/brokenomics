/**
 * App.jsx — root component.
 * Sets up React Router, AuthProvider, LeftPanel, AuthModal.
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import JourneyPage from './pages/JourneyPage';
import LeftPanel from './components/sidebar/LeftPanel';
import AuthModal from './components/auth/AuthModal';
import GlobalChat from './components/chat/GlobalChat';

function AppInner() {
  return (
    <div className="relative min-h-screen" style={{ background: '#0F0F14' }}>
      {/* Persistent sidebar toggle */}
      <LeftPanel />

      {/* Auth modal — controlled by AuthContext */}
      <AuthModal />

      {/* Global floating AI chat — bottom right on every page */}
      <GlobalChat />

      {/* Page routes */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/topic/:topicId/subtopic/:subTopicId"
          element={<JourneyPage />}
        />
        <Route path="*" element={<Home />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </BrowserRouter>
  );
}
