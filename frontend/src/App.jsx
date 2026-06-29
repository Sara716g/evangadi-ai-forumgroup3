/**
 * Route map: public pages live outside `Layout`; forum tools use `Layout` + `ProtectedRoute`.
 * Add new `<Route>` entries here, then wire navigation in `Sidebar.jsx` and
 * `Layout.jsx` (`getTitle` / `getSubtitle`) so the shell stays in sync.
 */
import React, { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  Outlet,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Layout from "./components/Layout/Layout";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import Auth from "./pages/Auth/Auth";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import ResetPassword from "./pages/Auth/ResetPassword";
import Dashboard from "./pages/Dashboard/Dashboard";
import Landing from "./pages/Landing/Landing";
import QuestionDetail from "./pages/QuestionDetail/QuestionDetail";
import PostQuestion from "./pages/PostQuestion/PostQuestion";
import MyQuestions from "./pages/MyQuestions/MyQuestions";
import RagDocuments from "./pages/RagDocuments/RagDocuments";
import Notifications from "./pages/Notifications/Notifications";
import Profile from "./pages/Profile/Profile";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import ManageUsers from "./pages/Admin/ManageUsers";
import ManageQuestions from "./pages/Admin/ManageQuestions";
import ExternalSearch from "./pages/ExternalSearch/ExternalSearch";
import AIAssistant from "./pages/AI-Assistant/AI-Assistant";
import About from "./pages/StaticPages/About";
import Privacy from "./pages/StaticPages/Privacy";
import Terms from "./pages/StaticPages/Terms";
import Contact from "./pages/StaticPages/Contact";
import "prismjs/themes/prism-tomorrow.css";

import styles from "./AiCascade.module.css";

// --- Smart Wrapper that handles the cascade, scrolling, and AI state ---
const AiCascadeLayout = () => {
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const location = useLocation();

  // Logic to allow the widget on any route that isn't the landing or auth page
  const isProtected = !["/", "/auth"].includes(location.pathname);
  const showWidget = isProtected;

  if (!showWidget && isAiOpen) setIsAiOpen(false);

  useEffect(() => {
    let scrollTimeout;
    const handleScroll = () => {
      setIsScrolling(true);
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => setIsScrolling(false), 1500);
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  return (
    <div
      className={`${styles.globalAppShell} ${isAiOpen ? styles.aiActive : ""}`}
    >
      <div className={styles.routeViewportPane}>
        <Outlet />
      </div>
      {showWidget && (
        <div className={styles.floatingAnchorUnit}>
          {isAiOpen && (
            <div className={styles.ergonomicAiBox}>
              <AIAssistant />
            </div>
          )}
          <div className={styles.buttonHitArea}>
            <button
              className={`${styles.squaredActionButton} ${
                !isScrolling && !isAiOpen ? styles.buttonHidden : ""
              }`}
              onClick={() => setIsAiOpen(!isAiOpen)}
            >
              {isAiOpen ? "Hide Assistant" : "Ask Evan"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main App Component ---
function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/contact" element={<Contact />} />

            {/* Protected routes wrapped in our new AiCascadeLayout */}
            <Route element={<AiCascadeLayout />}>
              <Route element={<Layout />}>
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/questions/ask"
                  element={
                    <ProtectedRoute>
                      <PostQuestion />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-questions"
                  element={
                    <ProtectedRoute>
                      <MyQuestions />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/question/:id"
                  element={
                    <ProtectedRoute>
                      <QuestionDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/rag-documents"
                  element={
                    <ProtectedRoute>
                      <RagDocuments />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute>
                      <Notifications />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute>
                      <ManageUsers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/questions"
                  element={
                    <ProtectedRoute>
                      <ManageQuestions />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/community-search"
                  element={
                    <ProtectedRoute>
                      <ExternalSearch />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ai-assistant"
                  element={
                    <ProtectedRoute>
                      <AIAssistant />
                    </ProtectedRoute>
                  }
                />
              </Route>
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
