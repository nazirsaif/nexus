import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PasswordProvider } from './context/PasswordContext';
import { Toaster } from 'react-hot-toast';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Layouts
import { DashboardLayout } from './components/layout/DashboardLayout';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Dashboard Pages
import { EntrepreneurDashboard } from './pages/dashboard/EntrepreneurDashboard';
import { InvestorDashboard } from './pages/dashboard/InvestorDashboard';

// Profile Pages
import { EntrepreneurProfile } from './pages/profile/EntrepreneurProfile';
import { InvestorProfile } from './pages/profile/InvestorProfile';
import { EditProfilePage } from './pages/profile/EditProfilePage';

// Feature Pages
import { InvestorsPage } from './pages/investors/InvestorsPage';
import { EntrepreneursPage } from './pages/entrepreneurs/EntrepreneursPage';
import { MessagesPage } from './pages/messages/MessagesPage';
import { NotificationsPage } from './pages/notifications/NotificationsPage';
import { DocumentsPage } from './pages/documents/DocumentsPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { HelpPage } from './pages/help/HelpPage';
import { DealsPage } from './pages/deals/DealsPage';
import { MeetingsPage } from './pages/meetings/MeetingsPage';

// Chat Pages
import { ChatPage } from './pages/chat/ChatPage';

function App() {
  return (
    <AuthProvider>
      <PasswordProvider>
        <Router>
          <Toaster position="top-right" />
        <Routes>
          {/* Authentication Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Dashboard Routes - Protected by role */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route path="entrepreneur" element={
              <ProtectedRoute allowedRoles={['entrepreneur']}>
                <EntrepreneurDashboard />
              </ProtectedRoute>
            } />
            <Route path="investor" element={
              <ProtectedRoute allowedRoles={['investor']}>
                <InvestorDashboard />
              </ProtectedRoute>
            } />
          </Route>
          
          {/* Profile Routes - Protected */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route path="entrepreneur/:id" element={<EntrepreneurProfile />} />
            <Route path="investor/:id" element={<InvestorProfile />} />
            <Route path="edit" element={<EditProfilePage />} />
          </Route>
          
          {/* Feature Routes */}
          <Route path="/investors" element={<DashboardLayout />}>
            <Route index element={<InvestorsPage />} />
          </Route>
          
          <Route path="/entrepreneurs" element={<DashboardLayout />}>
            <Route index element={<EntrepreneursPage />} />
          </Route>
          
          <Route path="/messages" element={<DashboardLayout />}>
            <Route index element={<MessagesPage />} />
          </Route>
          
          <Route path="/notifications" element={<DashboardLayout />}>
            <Route index element={<NotificationsPage />} />
          </Route>
          
          <Route path="/documents" element={<DashboardLayout />}>
            <Route index element={<DocumentsPage />} />
          </Route>
          
          <Route path="/settings" element={<DashboardLayout />}>
            <Route index element={<SettingsPage />} />
          </Route>
          
          <Route path="/help" element={<DashboardLayout />}>
            <Route index element={<HelpPage />} />
          </Route>
          
          <Route path="/deals" element={<DashboardLayout />}>
            <Route index element={<DealsPage />} />
          </Route>
          
          {/* Meetings Routes */}
          <Route path="/meetings" element={<DashboardLayout />}>
            <Route index element={<MeetingsPage />} />
          </Route>
          
          {/* Chat Routes */}
          <Route path="/chat" element={<DashboardLayout />}>
            <Route index element={<ChatPage />} />
            <Route path=":userId" element={<ChatPage />} />
          </Route>
          
          {/* Redirect root to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Catch all other routes and redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
          </Router>
        </PasswordProvider>
    </AuthProvider>
  );
}

export default App;