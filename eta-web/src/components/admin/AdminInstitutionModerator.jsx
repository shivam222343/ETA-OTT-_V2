import { useState, useEffect } from 'react';
import {
    Building2, CheckCircle2, XCircle,
    Clock, ExternalLink, ShieldCheck,
    Search, Filter, RefreshCw
} from 'lucide-react';
import apiClient from '../../api/axios.config';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminInstitutionModerator() {
    const [pendingInstitutions, setPendingInstitutions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchPending();
    }, []);

    const fetchPending = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/institutions/admin/pending');
            setPendingInstitutions(response.data.data.institutions);
        } catch (error) {
            console.error('Fetch pending error:', error);
            toast.error('Failed to load pending institutions');
        } finally {
            setLoading(false);
        }
    };

    const handleModerate = async (id, status) => {
        try {
            await apiClient.patch(`/institutions/${id}/moderate`, { status });
            toast.success(`Institution ${status} successfully`);
            setPendingInstitutions(prev => prev.filter(inst => inst._id !== id));
        } catch (error) {
            console.error('Moderation error:', error);
            toast.error('Moderation failed');
        }
    };

    const filtered = pendingInstitutions.filter(inst =>
        inst.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search pending..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-secondary/50 border-none rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20"
                    />
                </div>
                <button
                    onClick={fetchPending}
                    className="btn-secondary flex items-center gap-2 text-xs"
                    disabled={loading}
                >
                    <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                    Refresh List
                </button>
            </div>

            {loading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="card p-6 h-48 animate-pulse bg-muted/20 border-border/50"></div>
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 bg-muted/10 rounded-3xl border-2 border-dashed border-border/50">
                    <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                    <h3 className="text-lg font-bold">No Pending Requests</h3>
                    <p className="text-sm text-muted-foreground mt-1">When faculty create institutions, they will appear here for approval.</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {filtered.map((inst) => (
                            <motion.div
                                key={inst._id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="card p-6 group hover:shadow-2xl hover:shadow-primary/5 transition-all border-border/50"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                        <Building2 className="w-6 h-6" />
                                    </div>
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-black uppercase tracking-wider">
                                        <Clock className="w-3 h-3" />
                                        Pending
                                    </div>
                                </div>

                                <h3 className="text-lg font-black tracking-tight mb-2 group-hover:text-primary transition-colors">
                                    {inst.name}
                                </h3>

                                <div className="space-y-2 mb-6">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span className="font-bold text-foreground/70">Creator:</span>
                                        <span>{inst.createdBy?.profile?.name || 'Unknown'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span className="font-bold text-foreground/70">Email:</span>
                                        <span>{inst.createdBy?.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span className="font-bold text-foreground/70">Requested:</span>
                                        <span>{new Date(inst.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/50">
                                    <button
                                        onClick={() => handleModerate(inst._id, 'approved')}
                                        className="flex items-center justify-center gap-2 py-2.5 bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-green-500/0 hover:shadow-green-500/20"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleModerate(inst._id, 'rejected')}
                                        className="flex items-center justify-center gap-2 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl text-xs font-bold transition-all"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        Reject
                                    </button>
                                </div>

                                <div className="mt-4 flex justify-center">
                                    <button className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                                        <ExternalLink className="w-3 h-3" />
                                        View Details
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
