import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Standard components (not lazy to ensure fast initial load of layout)
import ProtectedRoute from "./ProtectedRoute";

// Lazy Loaded Components for Performance
const Home = React.lazy(() => import('../pages/Home'));
const Login = React.lazy(() => import('../pages/Login'));
const Register = React.lazy(() => import('../pages/Register'));
const CitizenDashboard = React.lazy(() => import('../pages/CitizenDashboard'));
const AdminDashboard = React.lazy(() => import('../pages/AdminDashboard'));
const ReportComplaint = React.lazy(() => import('../pages/ReportComplaint'));
const TrackComplaint = React.lazy(() => import('../pages/TrackComplaint'));
const ComplaintDetails = React.lazy(() => import('../pages/ComplaintDetails'));
const AdminComplaintDetails = React.lazy(() => import('../pages/AdminComplaintDetails'));
const MapView = React.lazy(() => import('../pages/MapView'));
const Profile = React.lazy(() => import('../pages/Profile'));
const Settings = React.lazy(() => import('../pages/Settings'));
const NotFound = React.lazy(() => import('../pages/NotFound'));

// Global Fallback Loading Indicator
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-50">
    <div className="flex flex-col items-center">
      <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      <p className="mt-4 text-sm font-medium text-slate-500">Loading UrbanMind AI...</p>
    </div>
  </div>
);

function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>

          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route
            path="/citizen"
            element={
              <ProtectedRoute allowedRoles={['citizen']}>
                <CitizenDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Navigate to="/citizen" replace />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/admin/complaints/:id"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminComplaintDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/report"
            element={
              <ProtectedRoute allowedRoles={['citizen']}>
                <ReportComplaint />
              </ProtectedRoute>
            }
          />

          <Route
            path="/report-issue"
            element={<Navigate to="/report" replace />}
          />

          <Route
            path="/track"
            element={
              <ProtectedRoute allowedRoles={['citizen']}>
                <TrackComplaint />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-complaints"
            element={<Navigate to="/track" replace />}
          />

          <Route
            path="/complaints/:id"
            element={
              <ProtectedRoute allowedRoles={['citizen']}>
                <ComplaintDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/map"
            element={
              <ProtectedRoute allowedRoles={['admin', 'citizen']}>
                <MapView />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={['admin', 'citizen']}>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute allowedRoles={['citizen']}>
                <Settings />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />

        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default AppRoutes;