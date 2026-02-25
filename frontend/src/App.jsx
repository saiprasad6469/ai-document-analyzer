import React, { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Register from "./pages/Register.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import { setAuthToken } from "./services/api";

function getValidToken() {
  const t = localStorage.getItem("token");
  if (!t) return null;

  const bad = ["null", "undefined", "false", "NaN", ""];
  if (bad.includes(String(t).trim())) return null;

  return t;
}

function ProtectedRoute({ children }) {
  const token = getValidToken();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  // ✅ DO NOT memoize with [] — token can change after login/register
  const token = getValidToken();

  useEffect(() => {
    const t = getValidToken();
    if (t) {
      setAuthToken(t);
    } else {
      localStorage.removeItem("token");
      setAuthToken(null);
    }
  }, []);

  return (
    <Routes>
      {/* default route */}
      <Route path="/" element={<Navigate to={token ? "/dashboard" : "/login"} replace />} />

      {/* block login/register if already logged in */}
      <Route path="/login" element={token ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/register" element={token ? <Navigate to="/dashboard" replace /> : <Register />} />

      {/* protected dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}