import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard"; // Admin Dashboard
import Register from "./pages/Register";
import Customers from "./pages/Customers";
import ManagerDashboard from "./pages/ManagerDashboard";
import SalesDashboard from "./pages/SalesDashboard";

// Helper function to extract user object from storage
const getCurrentUser = () => {
    try {
        const userStr = localStorage.getItem("user") || localStorage.getItem("userInfo");
        if (!userStr) return null;
        return JSON.parse(userStr);
    } catch (error) {
        return null;
    }
};

// Guard component requiring active login session
const ProtectedRoute = ({ children }) => {
    const user = getCurrentUser();
    const token = localStorage.getItem("token") || (user && user.token);

    if (!user && !token) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

// Guard component checking explicit role authorization
const RoleRoute = ({ allowedRoles, children }) => {
    const user = getCurrentUser();
    const role = user?.role;

    if (!role) {
        return <Navigate to="/login" replace />;
    }

    if (!allowedRoles.includes(role)) {
        // Redirect to their assigned default dashboard if unauthorized for this route
        if (role === "Manager") return <Navigate to="/manager/dashboard" replace />;
        if (role === "Sales") return <Navigate to="/sales/dashboard" replace />;
        return <Navigate to="/admin/dashboard" replace />;
    }

    return children;
};

// Switcher component for default /dashboard route
const DynamicDashboardRedirect = () => {
    const user = getCurrentUser();
    const role = user?.role;

    switch (role) {
        case "Admin":
            return <Dashboard />;
        case "Manager":
            return <ManagerDashboard />;
        case "Sales":
            return <SalesDashboard />;
        default:
            return <Navigate to="/login" replace />;
    }
};

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Login />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Main Dashboard Route (Role-Aware) */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <DynamicDashboardRedirect />
                        </ProtectedRoute>
                    }
                />

                {/* Explicit Role-Based Dashboard Routes */}
                <Route
                    path="/admin/dashboard"
                    element={
                        <ProtectedRoute>
                            <RoleRoute allowedRoles={["Admin"]}>
                                <Dashboard />
                            </RoleRoute>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/manager/dashboard"
                    element={
                        <ProtectedRoute>
                            <RoleRoute allowedRoles={["Manager"]}>
                                <ManagerDashboard />
                            </RoleRoute>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/sales/dashboard"
                    element={
                        <ProtectedRoute>
                            <RoleRoute allowedRoles={["Sales"]}>
                                <SalesDashboard />
                            </RoleRoute>
                        </ProtectedRoute>
                    }
                />

                {/* Admin-Only Customer Management Route */}
                <Route
                    path="/customers"
                    element={
                        <ProtectedRoute>
                            <RoleRoute allowedRoles={["Admin"]}>
                                <Customers />
                            </RoleRoute>
                        </ProtectedRoute>
                    }
                />

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;