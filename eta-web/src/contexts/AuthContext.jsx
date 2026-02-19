import { createContext, useContext, useState, useEffect } from 'react';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult
} from 'firebase/auth';
import { auth } from '../config/firebase';
import apiClient from '../api/axios.config';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [firebaseUser, setFirebaseUser] = useState(null);

    useEffect(() => {
        const checkRedirect = async () => {
            try {
                const result = await getRedirectResult(auth);
                if (result) {
                    const firebaseToken = await result.user.getIdToken();
                    await handleGoogleBackendAuth(result.user, firebaseToken, 'student');
                }
            } catch (error) {
                console.error('Redirect result error:', error);
            }
        };
        checkRedirect();

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setFirebaseUser(firebaseUser);

            if (firebaseUser) {
                const jwtToken = localStorage.getItem('token');
                if (jwtToken) {
                    try {
                        const response = await apiClient.get('/auth/profile');
                        setUser(response.data.data.user);
                    } catch (error) {
                        console.error('Failed to fetch user profile:', error);
                        localStorage.removeItem('token');
                        setUser(null);
                    }
                }
            } else {
                setUser(null);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const handleGoogleBackendAuth = async (firebaseUser, firebaseToken, role) => {
        try {
            const response = await apiClient.post('/auth/login', { firebaseToken });
            const { user, token } = response.data.data;
            localStorage.setItem('token', token);
            setUser(user);
            toast.success('Logged in with Google!');
            return user;
        } catch (loginError) {
            if (loginError.response?.status === 404) {
                const response = await apiClient.post('/auth/signup', {
                    firebaseUid: firebaseUser.uid,
                    email: firebaseUser.email,
                    name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                    role
                });
                const { user, token } = response.data.data;
                localStorage.setItem('token', token);
                setUser(user);
                toast.success('Account created with Google!');
                return user;
            }
            throw loginError;
        }
    };

    const signup = async (email, password, name, role) => {
        try {
            // Create Firebase user
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const firebaseUid = userCredential.user.uid;

            // Register in backend
            const response = await apiClient.post('/auth/signup', {
                firebaseUid,
                email,
                name,
                role
            });

            const { user, token } = response.data.data;
            localStorage.setItem('token', token);
            setUser(user);

            toast.success('Account created successfully!');
            return user;
        } catch (error) {
            console.error('Signup error:', error);
            toast.error(error.response?.data?.message || 'Signup failed');
            throw error;
        }
    };

    const login = async (email, password) => {
        try {
            // Sign in with Firebase
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const firebaseToken = await userCredential.user.getIdToken();

            // Login to backend
            const response = await apiClient.post('/auth/login', {
                firebaseToken
            });

            const { user, token } = response.data.data;
            localStorage.setItem('token', token);
            setUser(user);

            toast.success('Logged in successfully!');
            return user;
        } catch (error) {
            console.error('Login error:', error);
            toast.error(error.response?.data?.message || 'Login failed');
            throw error;
        }
    };

    const loginWithGoogle = async (role = 'student') => {
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const firebaseToken = await result.user.getIdToken();
            return await handleGoogleBackendAuth(result.user, firebaseToken, role);
        } catch (error) {
            console.error('Google login error:', error);
            toast.error(error.response?.data?.message || 'Google login failed');
            throw error;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            toast.success('Logged out successfully');
        } catch (error) {
            console.error('Logout error:', error);
            toast.error('Logout failed');
        }
    };

    const updateProfile = async (profileData) => {
        try {
            const isFormData = profileData instanceof FormData;
            const response = await apiClient.put('/auth/profile', profileData, {
                headers: {
                    'Content-Type': isFormData ? 'multipart/form-data' : 'application/json'
                }
            });

            const { user: updatedUser } = response.data.data;
            setUser(updatedUser);
            toast.success('Profile updated successfully!');
            return updatedUser;
        } catch (error) {
            console.error('Update profile error:', error);
            toast.error(error.response?.data?.message || 'Failed to update profile');
            throw error;
        }
    };

    const value = {
        user,
        firebaseUser,
        loading,
        signup,
        login,
        loginWithGoogle,
        logout,
        updateProfile,
        updateUser: setUser
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
