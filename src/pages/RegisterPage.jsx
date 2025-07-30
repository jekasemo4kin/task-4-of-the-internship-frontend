import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
const RegisterPage = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [repeatPassword, setRepeatPassword] = useState('');
    const navigate = useNavigate();
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== repeatPassword) {
            toast.error("Passwords don't match!");
            return;
        }
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password }),
            });
            if (response.ok) {
                const data = await response.json();
                toast.success(data.message);
                navigate('/login');
            } else {
                const errorData = await response.json().catch(() => ({ message: 'Registration error: Unknown error' }));
                toast.error(errorData.message || 'Registration failed. Please try again.');
            }
        } catch (error) {
            console.error('Registration error details:', error);
            toast.error('An error occurred during registration. Please try again later.');
        }
    };
    return (
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md mx-auto">
            <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">Create your account</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="username" className="sr-only">Username</label>
                    <input
                        id="username"
                        name="username"
                        type="text"
                        required
                        className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="email" className="sr-only">Email address</label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="password" className="sr-only">Password</label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <div className="mb-6">
                    <label htmlFor="repeat-password" className="sr-only">Repeat password</label>
                    <input
                        id="repeat-password"
                        name="repeat-password"
                        type="password"
                        required
                        className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                        placeholder="Repeat password"
                        value={repeatPassword}
                        onChange={(e) => setRepeatPassword(e.target.value)}
                    />
                </div>
                <div>
                    <button
                        type="submit"
                        className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Register
                    </button>
                </div>
            </form>
            <p className="mt-4 text-center text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                    Login here
                </Link>
            </p>
        </div>
    );
};
export default RegisterPage;