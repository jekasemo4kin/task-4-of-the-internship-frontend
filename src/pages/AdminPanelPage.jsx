import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
const AdminPanelPage = () => {
    const { token, isAuthenticated, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const decodeBase64Url = (str) => {
        str = str.replace(/-/g, '+').replace(/_/g, '/');
        while (str.length % 4) {
            str += '=';
        }
        try {
            const binary = atob(str);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
            return new TextDecoder('utf-8').decode(bytes);
        } catch (e) {
            console.error("Failed to decode Base64Url:", e, "Input string:", str);
            return null;
        }
    };
    const fetchUsers = useCallback(async () => {
        if (!isAuthenticated || !token) {
            setLoading(false);
            return;
        }
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/admin/users`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.status === 401 || response.status === 403) {
                const errorData = await response.json().catch(() => ({ message: 'Authentication required or session expired.' }));
                setError(errorData.message);
                toast.error(errorData.message);
                logout();
                return;
            }
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `HTTP Error! Status: ${response.status}` }));
                throw new Error(errorData.message);
            }
            const data = await response.json();
            setUsers(data);
            setLoading(false);
        } catch (err) {
            console.error('Error getting users:', err);
            setError(err.message || 'Unable to load users. Please try again.');
            setLoading(false);
        }
    }, [isAuthenticated, token, logout]);
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        } else {
            const tokenParts = token ? token.split('.') : [];
            if (tokenParts.length === 3) {
                const decodedPayload = decodeBase64Url(tokenParts[1]);
                if (decodedPayload) {
                    try {
                        const parsedPayload = JSON.parse(decodedPayload);
                        if (parsedPayload.user && parsedPayload.user.username) {
                            setCurrentUser({
                                id: parsedPayload.user.id,
                                username: parsedPayload.user.username
                            });
                        } else {
                            console.warn("Username not found in token payload:", parsedPayload);
                            setCurrentUser({ id: parsedPayload.id || 'unknown', username: 'User' });
                        }
                    } catch (e) {
                        console.error("Unable to parse token payload:", e, "Decoded payload:", decodedPayload);
                        toast.error("Invalid token format. Please log in again.");
                        logout();
                    }
                } else {
                    toast.error("Could not decode token. Please log in again.");
                    logout();
                }
            } else {
                toast.error("Malformed token. Please log in again.");
                logout();
            }
            fetchUsers();
        }
    }, [isAuthenticated, navigate, fetchUsers, token, logout]);
    const handleSelectUser = (userId) => {
        setSelectedUsers(prevSelected => {
            if (prevSelected.includes(userId)) {
                return prevSelected.filter(id => id !== userId);
            } else {
                return [...prevSelected, userId];
            }
        });
    };
    const handleSelectAllUsers = () => {
        if (selectedUsers.length === users.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(users.map(user => user.id));
        }
    };
    const handleDeleteSelected = async () => {
        if (selectedUsers.length === 0) {
            toast.warn('Please select users to delete.');
            return;
        }
        const userIdsToDelete = selectedUsers;
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ userIds: userIdsToDelete }),
            });
            const data = await response.json().catch(() => ({ message: 'Server response error' }));
            if (response.ok) {
                if (data.self_affected) {
                    toast.warn('Your account has been deleted. You will be automatically logged out.');
                    logout();
                } else {
                    toast.success(data.message);
                    setSelectedUsers([]);
                    fetchUsers();
                }
            } else {
                toast.error(`Error: ${data.message || 'Unknown error while deleting.'}`);
                if (response.status === 401 || response.status === 403) {
                    logout();
                }
            }
        } catch (error) {
            console.error('Error deleting users:', error);
            toast.error('Network or server error while deleting users.');
        }
    };
    const handleBlockSelected = async () => {
        if (selectedUsers.length === 0) {
            toast.warn('Please select users to block.');
            return;
        }
        const userIdsToBlock = selectedUsers;
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ userIds: userIdsToBlock, newStatus: 'Blocked' }),
            });
            const data = await response.json().catch(() => ({ message: 'Server response error' }));
            if (response.ok) {
                if (data.self_affected) {
                    toast.warn('Your account has been locked. You will be automatically logged out.');
                    logout();
                } else {
                    toast.success(data.message);
                    setSelectedUsers([]);
                    fetchUsers();
                }
            } else {
                toast.error(`Error: ${data.message || 'Unknown lock error.'}`);
                if (response.status === 401 || response.status === 403) {
                    logout();
                }
            }
        } catch (error) {
            console.error('Error locking users:', error);
            toast.error('Network or server error blocking users.');
        }
    };
    const handleUnblockSelected = async () => {
        if (selectedUsers.length === 0) {
            toast.warn('Please select users to unlock.');
            return;
        }
        const userIdsToUnblock = selectedUsers;
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ userIds: userIdsToUnblock, newStatus: 'Active' }),
            });
            const data = await response.json().catch(() => ({ message: 'Server response error' }));
            if (response.ok) {
                toast.success(data.message);
                setSelectedUsers([]);
                fetchUsers();
            } else {
                toast.error(`Ошибка: ${data.message || 'Unknown error while unlocking.'}`);
                if (response.status === 401 || response.status === 403) {
                    logout();
                }
            }
        } catch (error) {
            console.error('Error unlocking users:', error);
            toast.error('Network or server error unblocking users.');
        }
    };
    const sortedUsers = [...users].sort((a, b) => {
        const dateA = a.last_login ? new Date(a.last_login).getTime() : 0;
        const dateB = b.last_login ? new Date(b.last_login).getTime() : 0;
        if (dateA === 0 && dateB !== 0) return 1;
        if (dateA !== 0 && dateB === 0) return -1;
        if (dateA === 0 && dateB === 0) return 0;
        return dateB - dateA;
    });
    const filteredAndSortedUsers = sortedUsers.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (loading) return <p className="text-gray-700">Loading users...</p>;
    if (error) return <p className="text-red-500">{error}</p>;
    return (
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                    {currentUser ? `Hello, ${currentUser.username} !` : 'Admin Panel'}
                </h2>
                <button
                    onClick={logout}
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                    Log out
                </button>
            </div>
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-2 sm:space-y-0">
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-grow px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                />
                <button
                    onClick={handleDeleteSelected}
                    disabled={selectedUsers.length === 0}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm disabled:opacity-50"
                >
                    Delete
                </button>
                <button
                    onClick={handleBlockSelected}
                    disabled={selectedUsers.length === 0}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-1 px-3 rounded text-sm disabled:opacity-50"
                >
                    Block
                </button>
                <button
                    onClick={handleUnblockSelected}
                    disabled={selectedUsers.length === 0}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded text-sm disabled:opacity-50"
                >
                    Unblock
                </button>
            </div>
            <div >
                <table className="w-full divide-y divide-gray-200 shadow-sm rounded-lg overflow-hidden">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <input
                                    type="checkbox"
                                    onChange={handleSelectAllUsers}
                                    checked={users.length > 0 && selectedUsers.length === users.length}
                                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                />
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">Username</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">Last login</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">Registration date</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredAndSortedUsers.map(user => (
                            <tr key={user.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.includes(user.id)}
                                        onChange={() => handleSelectUser(user.id)}
                                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.username}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.status}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {user.last_login ? new Date(user.last_login).toLocaleString() : 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(user.registration_date).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
export default AdminPanelPage;