import React from 'react';
import { Routes, Route } from 'react-router-dom';

// --- Impor Halaman ---
// Layout & Auth
import MainLayout from './components/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Halaman Publik (L01-L03)
import WelcomePage from './pages/WelcomePage';
import SignUpPage from './pages/SignUpPage';
import SignInPage from './pages/SignInPage';

// Halaman Privat (yang dilindungi)
import HomePage from './pages/HomePage'; // L04 / L21
import CreateProjectPage from './pages/CreateProjectPage'; // L27
import ProjectDashboardPage from './pages/ProjectDashboardPage'; // L22
import ProjectMembersPage from './pages/ProjectMembersPage'; // L26
import ProjectFileHubPage from './pages/ProjectFileHubPage'; // F4
import ProjectChatPage from './pages/ProjectChatPage'; // F3
import EditProfilePage from './pages/EditProfilePage'; // L55
import PublicProfilePage from './pages/PublicProfilePage';
import CuratePortfolioPage from './pages/CuratePortfolioPage';
import TalentDiscoveryPage from './pages/TalentDiscoveryPage';
import NotificationsPage from './pages/NotificationsPage';

function App() {
  return (
    <Routes>
      {/* ====================================================== */}
      {/* --- Rute Publik --- */}
      {/* Rute ini TIDAK memiliki header/navigasi global */}
      {/* ====================================================== */}
      <Route path="/" element={<WelcomePage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/profile/:userId" element={<PublicProfilePage />} />

      {/* ====================================================== */}
      {/* --- Rute Privat / Terlindungi --- */}
      {/* Semua rute di sini dibungkus oleh 'ProtectedRoute' */}
      {/* dan menggunakan 'MainLayout' (header global) */}
      {/* ====================================================== */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        {/* L04 Homepage (Dashboard Utama) & L21 Ringkasan Proyek */}
        <Route path="/home" element={<HomePage />} />

        {/* F2 - Manajemen Proyek */}
        <Route path="/create-project" element={<CreateProjectPage />} />
        <Route path="/projects/:projectId" element={<ProjectDashboardPage />} />
        <Route path="/projects/:projectId/members" element={<ProjectMembersPage />} />
        
        {/* F3 - Chat Proyek */}
        <Route path="/projects/:projectId/chat" element={<ProjectChatPage />} />

        {/* F4 - File Hub */}
        <Route path="/projects/:projectId/files" element={<ProjectFileHubPage />} />

        {/* F5 - Profil & Portfolio */}
        <Route path="/profile/edit" element={<EditProfilePage />} />

        <Route path="/portfolio/curate" element={<CuratePortfolioPage />} />

        <Route path="/talent" element={<TalentDiscoveryPage />} />

        <Route path="/notifications" element={<NotificationsPage />} />
        
      </Route>

    </Routes>
  );
}

export default App;