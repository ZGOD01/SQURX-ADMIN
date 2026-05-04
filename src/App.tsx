import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardOverview from './pages/DashboardOverview';
import UserManagement from './pages/UserManagement';
import CMS from './pages/CMS';
import Analytics from './pages/Analytics';
import Moderation from './pages/Moderation';
import Curation from './pages/Curation';
import Quizzes from './pages/Quizzes';
import Domains from './pages/Domains';
import Settings from './pages/Settings';
import Login from './pages/Login';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardOverview />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="cms" element={<CMS />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="moderation" element={<Moderation />} />
          <Route path="curation" element={<Curation />} />
          <Route path="quizzes" element={<Quizzes />} />
          <Route path="domains" element={<Domains />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
