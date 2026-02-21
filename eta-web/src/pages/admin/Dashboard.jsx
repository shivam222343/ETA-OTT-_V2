import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
    ShieldCheck, Building2, Users,
    Settings, LogOut, LayoutDashboard,
    AlertCircle, Activity, BarChart3,
    Search, Bell, Menu, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from '../../components/ThemeToggle';
import NotificationButton from '../../components/NotificationButton';
import AdminInstitutionModerator from '../../components/admin/AdminInstitutionModerator';

export default function AdminDashboard() {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('institutions');
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const menuItems = [
        { id: 'stats', label: 'System Stats', icon: Activity },
        { id: 'institutions', label: 'Institutions', icon: Building2 },
        { id: 'users', label: 'User Management', icon: Users },
        { id: 'analytics', label: 'Advanced Analytics', icon: BarChart3 },
        { id: 'settings', label: 'System Settings', icon: Settings },
    ];

    return (
        <div className="h-screen bg-background flex relative overflow-hidden text-foreground">
            {/* Sidebar */}
            <aside className={`fixed lg:sticky top-0 left-0 h-screen bg-card border-r border-border z-40 flex flex-col transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
                {/* Logo */}
                <div className="p-6 border-b border-border flex items-center justify-between">
                    <div className={`flex items-center gap-3 ${!sidebarOpen && 'hidden'}`}>
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                            <ShieldCheck className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-black tracking-tighter">Eta <span className="text-primary">Admin</span></span>
                    </div>
                    {!sidebarOpen && (
                        <ShieldCheck className="w-8 h-8 text-primary mx-auto" />
                    )}
                </div>

                {/* Nav */}
                <nav className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto custom-scrollbar">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all group ${isActive
                                    ? 'bg-primary text-white shadow-xl shadow-primary/20'
                                    : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'group-hover:text-primary transition-colors'}`} />
                                <span className={`font-bold text-sm ${!sidebarOpen && 'hidden'}`}>{item.label}</span>
                                {item.id === 'institutions' && sidebarOpen && (
                                    <span className="ml-auto bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">!</span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-border space-y-2">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-secondary text-muted-foreground group transition-all"
                    >
                        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5 mx-auto" />}
                        <span className={`font-bold text-sm ${!sidebarOpen && 'hidden'}`}>Collapse Menu</span>
                    </button>
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-destructive/10 text-destructive group transition-all"
                    >
                        <LogOut className="w-5 h-5 flex-shrink-0 mx-auto lg:mx-0" />
                        <span className={`font-bold text-sm ${!sidebarOpen && 'hidden'}`}>System Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Header */}
                <header className="sticky top-0 z-30 bg-background/50 backdrop-blur-xl border-b border-border px-8 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                            {menuItems.find(m => m.id === activeTab)?.label}
                        </h2>
                        <p className="text-xs text-muted-foreground">System Control Panel • v2.0.4</p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden lg:flex items-center gap-4 px-4 py-2 bg-secondary/50 rounded-2xl border border-border">
                            <Activity className="w-4 h-4 text-emerald-500" />
                            <div className="text-left">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">System Load</p>
                                <p className="text-xs font-black">Normal (12%)</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <ThemeToggle />
                            <NotificationButton />
                            <div className="w-10 h-10 rounded-full bg-secondary border-2 border-primary/20 flex items-center justify-center font-bold text-primary shadow-lg">
                                {user?.profile?.name?.[0] || 'A'}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {activeTab === 'stats' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {[
                                    { label: 'Total Users', value: '4,281', trend: '+12%', icon: Users, color: 'text-blue-500' },
                                    { label: 'Active Institutions', value: '18', trend: '+2', icon: Building2, color: 'text-purple-500' },
                                    { label: 'Weekly Revenue', value: '$12.4k', trend: '+8%', icon: Activity, color: 'text-emerald-500' },
                                    { label: 'Security Alerts', value: '0', trend: 'Clean', icon: ShieldCheck, color: 'text-primary' },
                                ].map((stat, i) => (
                                    <div key={i} className="card p-6 border-border hover:border-primary/20 transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={`w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center ${stat.color}`}>
                                                <stat.icon className="w-6 h-6" />
                                            </div>
                                            <span className={`text-xs font-black ${stat.trend.startsWith('+') ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                                                {stat.trend}
                                            </span>
                                        </div>
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</p>
                                        <p className="text-2xl font-black">{stat.value}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="card border-border p-8">
                                <h3 className="text-xl font-bold mb-6">Real-time Performance</h3>
                                <div className="h-64 flex items-end gap-2 px-4">
                                    {[...Array(20)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="flex-1 bg-primary/20 rounded-t-lg hover:bg-primary transition-all group relative"
                                            style={{ height: `${Math.random() * 80 + 20}%` }}
                                        >
                                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-card text-foreground text-[10px] font-black px-2 py-1 rounded border border-border opacity-0 group-hover:opacity-100 transition-opacity">
                                                {Math.floor(Math.random() * 100)}ms
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'institutions' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="mb-8">
                                <h3 className="text-2xl font-black tracking-tight mb-2">Institution Moderation</h3>
                                <p className="text-muted-foreground">Review and approve new institution requests from faculty members.</p>
                            </div>
                            <AdminInstitutionModerator />
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
                            <Users className="w-20 h-20 mb-6 opacity-10" />
                            <h3 className="text-xl font-bold">User Management Module</h3>
                            <p className="mt-2 text-sm">Synchronizing with user database...</p>
                        </div>
                    )}

                    {activeTab === 'analytics' && (
                        <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
                            <BarChart3 className="w-20 h-20 mb-6 opacity-10" />
                            <h3 className="text-xl font-bold">Advanced Analytics Hub</h3>
                            <p className="mt-2 text-sm">Processing cross-platform data streams...</p>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
                            <Settings className="w-20 h-20 mb-6 opacity-10" />
                            <h3 className="text-xl font-bold">System Configuration</h3>
                            <p className="mt-2 text-sm">Fetching cloud environment variables...</p>
                        </div>
                    )}
                </div>
            </main>
        </div>

    );
}
