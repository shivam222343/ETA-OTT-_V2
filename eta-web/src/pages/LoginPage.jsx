import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, GraduationCap, Users, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student');
    const [loading, setLoading] = useState(false);
    const { login, loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            toast.error('Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (error) {
            console.error('Login failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            await loginWithGoogle(role);
            navigate('/dashboard');
        } catch (error) {
            console.error('Google login failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
            {/* Left Section - Branding & Role Selection */}
            <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 to-purple-500/10 dark:from-primary/20 dark:to-purple-500/20 p-12 flex-col justify-center items-center relative overflow-hidden"
            >
                {/* Decorative elements */}
                <div className="absolute top-20 left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>

                <div className="relative z-10 max-w-md">
                    <Link to="/" className="inline-flex items-center space-x-3 mb-8">
                        <GraduationCap className="w-16 h-16 text-primary" />
                        <span className="text-5xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Eta</span>
                    </Link>

                    <h1 className="text-4xl font-bold mb-4">Welcome Back!</h1>
                    <p className="text-lg text-muted-foreground mb-8">
                        Continue your learning journey with AI-powered education platform
                    </p>

                    {/* Role Selection */}
                    <div className="space-y-4">
                        <label className="block text-sm font-medium mb-3">I am a</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setRole('student')}
                                className={`p-6 rounded-xl border-2 transition-all ${role === 'student'
                                        ? 'border-primary bg-primary/10 shadow-lg scale-105'
                                        : 'border-border hover:border-primary/50 hover:bg-secondary'
                                    }`}
                            >
                                <GraduationCap className="w-8 h-8 mx-auto mb-3 text-primary" />
                                <div className="font-semibold text-lg">Student</div>
                                <div className="text-xs text-muted-foreground mt-1">Learn & Grow</div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole('faculty')}
                                className={`p-6 rounded-xl border-2 transition-all ${role === 'faculty'
                                        ? 'border-primary bg-primary/10 shadow-lg scale-105'
                                        : 'border-border hover:border-primary/50 hover:bg-secondary'
                                    }`}
                            >
                                <Users className="w-8 h-8 mx-auto mb-3 text-primary" />
                                <div className="font-semibold text-lg">Faculty</div>
                                <div className="text-xs text-muted-foreground mt-1">Teach & Guide</div>
                            </button>
                        </div>
                    </div>

                    {/* Features */}
                    <div className="mt-12 space-y-4">
                        <div className="flex items-center gap-3">
                            <Sparkles className="w-5 h-5 text-primary" />
                            <span className="text-sm">AI-Powered Doubt Resolution</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Sparkles className="w-5 h-5 text-primary" />
                            <span className="text-sm">Interactive Learning Experience</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Sparkles className="w-5 h-5 text-primary" />
                            <span className="text-sm">Track Your Progress</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Right Section - Login Form */}
            <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-full lg:w-1/2 flex items-center justify-center p-8"
            >
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <Link to="/" className="inline-flex items-center space-x-2 mb-4">
                            <GraduationCap className="w-10 h-10 text-primary" />
                            <span className="text-3xl font-bold">Eta</span>
                        </Link>
                    </div>

                    <div className="card p-8">
                        <h2 className="text-2xl font-bold mb-2">Sign In</h2>
                        <p className="text-muted-foreground mb-6">Enter your credentials to access your account</p>

                        {/* Mobile Role Selection */}
                        <div className="lg:hidden mb-6">
                            <label className="block text-sm font-medium mb-3">I am a</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setRole('student')}
                                    className={`p-4 rounded-lg border-2 transition-all ${role === 'student'
                                            ? 'border-primary bg-primary/10'
                                            : 'border-border hover:border-primary/50'
                                        }`}
                                >
                                    <GraduationCap className="w-6 h-6 mx-auto mb-2" />
                                    <div className="font-medium text-sm">Student</div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole('faculty')}
                                    className={`p-4 rounded-lg border-2 transition-all ${role === 'faculty'
                                            ? 'border-primary bg-primary/10'
                                            : 'border-border hover:border-primary/50'
                                        }`}
                                >
                                    <Users className="w-6 h-6 mx-auto mb-2" />
                                    <div className="font-medium text-sm">Faculty</div>
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium mb-2">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="input pl-10 w-full"
                                        placeholder="you@example.com"
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="input pl-10 w-full"
                                        placeholder="••••••••"
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary w-full"
                            >
                                {loading ? 'Signing in...' : 'Sign In'}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-border"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-card text-muted-foreground">Or</span>
                            </div>
                        </div>

                        {/* Google Sign-In Button */}
                        <button
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-border rounded-lg hover:bg-secondary transition-colors"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            <span className="font-medium">Continue with Google</span>
                        </button>

                        <div className="mt-6 text-center">
                            <p className="text-sm text-muted-foreground">
                                Don't have an account?{' '}
                                <Link to="/signup" className="text-primary hover:underline font-medium">
                                    Sign up
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
