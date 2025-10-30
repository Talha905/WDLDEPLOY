import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { PrivateRoute } from './components/common/PrivateRoute';
import { AdminRoute } from './components/common/AdminRoute';
import { RoleRoute } from './components/common/RoleRoute';
import Navbar from './components/layout/Navbar';
import Header from './components/layout/Header';
import Homepage from './pages/Homepage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import SessionDetail from './pages/sessions/SessionDetail';
import VideoRoom from './pages/sessions/VideoRoom';
import Room from './pages/sessions/Room';
import Whiteboard from './pages/sessions/Whiteboard';
import Goals from './pages/goals/Goals';
import GoalDetail from './pages/goals/GoalDetail';
import CreateGoal from './pages/goals/CreateGoal';
import EditGoal from './pages/goals/EditGoal';
import SearchMentors from './pages/search/SearchMentors';
import Sessions from './pages/sessions/Sessions';
import Disputes from './pages/disputes/Disputes';
import Forums from './pages/community/Forums';
import ThreadDetail from './pages/community/ThreadDetail';
import CategoryDetail from './pages/community/CategoryDetail';
import AdminDashboard from './pages/admin/AdminDashboard';
import './styles/App.css';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <AppContent />
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="App">
      {isAuthenticated ? <Navbar /> : <Header />}
      <main className={isAuthenticated ? "main-content" : "homepage-content"}>
        <Routes>
          <Route path="/" element={isAuthenticated ? <PrivateRoute><Dashboard /></PrivateRoute> : <Homepage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/sessions" element={<PrivateRoute><Sessions /></PrivateRoute>} />
          <Route path="/sessions/:id" element={<PrivateRoute><SessionDetail /></PrivateRoute>} />
          <Route path="/video/:sessionId" element={<PrivateRoute><VideoRoom /></PrivateRoute>} />
          <Route path="/room/:roomID" element={<PrivateRoute><Room /></PrivateRoute>} />
          <Route path="/:sessionId/whiteboard" element={<PrivateRoute><Whiteboard /></PrivateRoute>} />
          <Route path="/goals" element={<RoleRoute allowed={["Mentee"]}><Goals /></RoleRoute>} />
          <Route path="/goals/new" element={<RoleRoute allowed={["Mentee"]}><CreateGoal /></RoleRoute>} />
          <Route path="/goals/:id/edit" element={<RoleRoute allowed={["Mentee"]}><EditGoal /></RoleRoute>} />
          <Route path="/goals/:id" element={<RoleRoute allowed={["Mentee"]}><GoalDetail /></RoleRoute>} />
          <Route path="/search" element={<RoleRoute allowed={["Mentee"]}><SearchMentors /></RoleRoute>} />
          <Route path="/disputes" element={<PrivateRoute><Disputes /></PrivateRoute>} />
          <Route path="/community" element={<PrivateRoute><Forums /></PrivateRoute>} />
          <Route path="/forums/thread/:threadId" element={<PrivateRoute><ThreadDetail /></PrivateRoute>} />
          <Route path="/forums/category/:categoryId" element={<PrivateRoute><CategoryDetail /></PrivateRoute>} />
          <Route path="/admin/*" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;