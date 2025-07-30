import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { toast } from 'react-toastify';
export const AuthContext = createContext(null);
export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const login = useCallback((jwtToken, rememberMe) => {
        setToken(jwtToken);
        setIsAuthenticated(true);
        if (rememberMe) {
            localStorage.setItem('jwt_token', jwtToken);
            sessionStorage.removeItem('jwt_token');
        } else {
            sessionStorage.setItem('jwt_token', jwtToken);
            localStorage.removeItem('jwt_token');
        }
    }, []);
    const logout = useCallback(() => {
        setToken(null);
        setIsAuthenticated(false);
        localStorage.removeItem('jwt_token');
        sessionStorage.removeItem('jwt_token');
    }, []);
    const getAuthHeader = useCallback(() => {
        return token ? `Bearer ${token}` : '';
    }, [token]);
    useEffect(() => {
        const checkAuthStatus = async () => {
            const storedToken = localStorage.getItem('jwt_token') || sessionStorage.getItem('jwt_token');
            if (storedToken) {
                try {
                    const response = await fetch('http://localhost:5000/api/auth/verify-token', {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${storedToken}`
                        }
                    });
                    if (response.ok) {
                        setIsAuthenticated(true);
                        setToken(storedToken);
                    } else {
                        console.error('Token verification failed:', await response.text());
                        logout();
                    }
                } catch (error) {
                    console.error('Network error during token verification:', error);
                    logout();
                }
            }
            setIsLoading(false);
        };
        checkAuthStatus();
    }, [logout]);
    return (
        <AuthContext.Provider value={{ token, isAuthenticated, isLoading, login, logout, getAuthHeader }}>
            {children}
        </AuthContext.Provider>
    );
};
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};