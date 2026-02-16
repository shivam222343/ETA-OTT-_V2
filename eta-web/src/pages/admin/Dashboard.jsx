import { useAuth } from '../../contexts/AuthContext';
import ThemeToggle from '../../components/ThemeToggle';

export default function AdminDashboard() {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-background">
            <nav className="bg-card border-b px-6 py-4">
                <div className="container mx-auto flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <button onClick={logout} className="btn-ghost">
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            <div className="container mx-auto px-6 py-8">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold mb-2">Admin Panel</h2>
                    <p className="text-muted-foreground">System overview and management</p>
                </div>

                <div className="grid md:grid-cols-4 gap-6">
                    <div className="card p-6">
                        <h3 className="text-lg font-semibold mb-2">Total Users</h3>
                        <p className="text-3xl font-bold text-primary">0</p>
                    </div>
                    <div className="card p-6">
                        <h3 className="text-lg font-semibold mb-2">Institutions</h3>
                        <p className="text-3xl font-bold text-primary">0</p>
                    </div>
                    <div className="card p-6">
                        <h3 className="text-lg font-semibold mb-2">Total Courses</h3>
                        <p className="text-3xl font-bold text-primary">0</p>
                    </div>
                    <div className="card p-6">
                        <h3 className="text-lg font-semibold mb-2">AI Confidence</h3>
                        <p className="text-3xl font-bold text-green-500">85%</p>
                    </div>
                </div>

                <div className="mt-8 card p-6">
                    <h3 className="text-xl font-semibold mb-4">System Management</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                        <button className="btn-primary">User Management</button>
                        <button className="btn-secondary">Analytics</button>
                        <button className="btn-secondary">System Settings</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
