import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { MusicProvider } from './context/MusicContext'
import { SocketProvider } from './context/SocketContext'
import { VibeProvider } from './context/VibeContext'
import ProtectedRoute from './components/common/ProtectedRoute'
import AppShell from './components/common/AppShell'

import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'

import HomePage from './pages/HomePage'
import ChatPage from './pages/ChatPage'
import ConversationPage from './pages/ConversationPage'
import SearchPage from './pages/SearchPage'
import MusicPage from './pages/MusicPage'
import PlaylistPage from './pages/PlaylistPage'
import NowPlayingPage from './pages/NowPlayingPage'
import ProfilePage from './pages/ProfilePage'
import UserProfilePage from './pages/UserProfilePage'

import SettingsPage from './pages/settings/SettingsPage'
import AccountSettingsPage from './pages/settings/AccountSettingsPage'
import PrivacySettingsPage from './pages/settings/PrivacySettingsPage'
import NotificationsSettingsPage from './pages/settings/NotificationsSettingsPage'
import AppearanceSettingsPage from './pages/settings/AppearanceSettingsPage'

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <MusicProvider>
              <VibeProvider>
                <Routes>
                  {/* Public routes */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                  {/* Protected routes inside AppShell */}
                  <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
                    <Route path="/home" element={<HomePage />} />
                    <Route path="/chat" element={<ChatPage />} />
                    <Route path="/chat/:conversationId" element={<ConversationPage />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/music" element={<MusicPage />} />
                    <Route path="/music/playlist/:id" element={<PlaylistPage />} />
                    <Route path="/music/now-playing" element={<NowPlayingPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/profile/:username" element={<UserProfilePage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/settings/account" element={<AccountSettingsPage />} />
                    <Route path="/settings/privacy" element={<PrivacySettingsPage />} />
                    <Route path="/settings/notifications" element={<NotificationsSettingsPage />} />
                    <Route path="/settings/appearance" element={<AppearanceSettingsPage />} />
                  </Route>

                  {/* Default redirect */}
                  <Route path="/" element={<Navigate to="/login" replace />} />
                  <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
              </VibeProvider>
            </MusicProvider>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
