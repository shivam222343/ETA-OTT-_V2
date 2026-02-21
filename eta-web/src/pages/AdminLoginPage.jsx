import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            toast.error('Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            const user = await login(email, password);

            if (user?.role !== 'admin') {
                toast.error('Access Denied: This is not an admin account.');
                localStorage.removeItem('token');
                return;
            }

            navigate('/admin/dashboard');
        } catch (error) {
            console.error('Admin login failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-background text-foreground">
            {/* Left Section - Branding */}
            <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 via-background to-purple-500/10 p-12 flex-col justify-center items-center relative overflow-hidden border-r border-border"
            >
                {/* Decorative elements */}
                <div className="absolute top-20 left-20 w-72 h-72 bg-primary/20 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] animate-pulse delay-1000"></div>

                <div className="relative z-10 max-w-md">
                    <Link to="/" className="inline-flex items-center space-x-3 mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/20">
                            <ShieldCheck className="w-10 h-10 text-white" />
                        </div>
                        <span className="text-5xl font-black bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent tracking-tighter">Eta Admin</span>
                    </Link>

                    <h1 className="text-4xl font-black mb-4 tracking-tight">System Control</h1>
                    <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                        Welcome back, administrator. Enter your secure credentials to access the Eta management console.
                    </p>

                    {/* Features List */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border backdrop-blur-sm">
                            <Sparkles className="w-5 h-5 text-primary" />
                            <span className="text-sm font-medium">Full Administrative Privileges</span>
                        </div>
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border backdrop-blur-sm">
                            <Sparkles className="w-5 h-5 text-primary" />
                            <span className="text-sm font-medium">Real-time Infrastructure Monitoring</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Right Section - Login Form */}
            <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-full lg:w-1/2 flex items-center justify-center p-8 relative"
            >
                <div className="w-full max-w-md relative z-10">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4 shadow-2xl">
                            <ShieldCheck className="w-8 h-8 text-primary" />
                        </div>
                        <h1 className="text-3xl font-black">Eta <span className="text-primary">Admin</span></h1>
                    </div>

                    <div className="bg-card backdrop-blur-xl border border-border p-8 rounded-[2rem] shadow-2xl">
                        <div className="mb-8">
                            <h2 className="text-2xl font-black mb-2">Secure Sign In</h2>
                            <p className="text-muted-foreground text-sm">Authorize your session to continue</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 ml-1">Internal Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-secondary/50 border border-border rounded-2xl py-4 pl-12 pr-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/30"
                                        placeholder="admin@eta.ai"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 ml-1">Access Key</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-secondary/50 border border-border rounded-2xl py-4 pl-12 pr-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/30"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primary hover:bg-primary/90 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-primary/25 disabled:opacity-50 flex items-center justify-center gap-2 transform hover:scale-[1.02] active:scale-95"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        Authorize Access
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-border text-center">
                            <p className="text-sm text-muted-foreground">
                                Need an admin profile?{' '}
                                <Link to="/admin/signup" className="text-primary hover:underline font-bold">
                                    Register Here
                                </Link>
                            </p>
                        </div>
                    </div>

                    <div className="mt-12 flex items-center justify-center gap-6">
                        <Link to="/login" className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">Student Portal</Link>
                        <div className="w-1 h-1 bg-border rounded-full"></div>
                        <Link to="/login" className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">Faculty Portal</Link>
                    </div>
                </div>
            </motion.div>
        </div>

    );
}
