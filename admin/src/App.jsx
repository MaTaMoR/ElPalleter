import React from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate
} from 'react-router-dom';

import AuthProvider from './auth/AuthProvider';
import LoginPage from './pages/login/LoginPage';
import ProtectedRoute from './route/ProtectedRoute';
import AdminLayout from './layout/AdminLayout';

import DashboardPage from './pages/dashboard/DashboardPage';
import MenuPage from './pages/menu/MenuPage';
import ContactPage from './pages/contact/ContactPage';
import UsersPage from './pages/users/UsersPage';
import SettingsPage from './pages/settings/SettingsPage';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/admin/login" element={<LoginPage />} />
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="menu/*" element={<MenuPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
