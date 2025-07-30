import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminPanelPage from './pages/AdminPanelPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();
    const navigate = useNavigate();
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, isLoading, navigate]);
    if (isLoading) {
        return <div className="text-gray-700">Loading authentication...</div>;
    }
    return isAuthenticated ? children : null;
};
const InitialRedirect = () => {
    const { isAuthenticated, isLoading } = useAuth();
    const navigate = useNavigate();
    useEffect(() => {
        if (!isLoading) {
            if (isAuthenticated) {
                navigate('/admin');
            } else {
                navigate('/login');
            }
        }
    }, [isAuthenticated, isLoading, navigate]);
    return null;
};
function App() {
    const location = useLocation();
    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 w-full">
            <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
            />
            <AuthProvider>
                {location.pathname !== '/login' && location.pathname !== '/register' && (
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-6">
                        User Management App
                    </h1>
                )}
                <Routes>
                    <Route path="/" element={<InitialRedirect />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/admin" element={
                        <ProtectedRoute>
                            <AdminPanelPage />
                        </ProtectedRoute>
                    } />
                </Routes>
            </AuthProvider>
        </div>
    );
}
export default App;