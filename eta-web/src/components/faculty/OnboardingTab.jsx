import { useState, useEffect } from 'react';
import { 
    FileUp, Key, Mail, CheckCircle2, AlertCircle, 
    Loader2, Copy, ToggleLeft, ToggleRight, Download,
    Users, Clock, ChevronDown, ChevronUp, ChevronLeft, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../api/axios.config';
import { motion, AnimatePresence } from 'framer-motion';

export default function OnboardingTab({ institutionId, branchId }) {
    const targetType = branchId ? 'branch' : 'institution';
    const targetId = branchId || institutionId;
    const basePath = branchId ? '/branches' : '/institutions';
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [universalKey, setUniversalKey] = useState('');
    const [keyEnabled, setKeyEnabled] = useState(true);
    const [loadingKey, setLoadingKey] = useState(true);
    const [allInvitations, setAllInvitations] = useState([]);
    const [loadingInvites, setLoadingInvites] = useState(true);
    const [processedInvites, setProcessedInvites] = useState([]); // Temporary list from latest upload
    const [isHistoryOpen, setIsHistoryOpen] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 25;

    useEffect(() => {
        if (targetId) {
            fetchUniversalKey();
            fetchInvitations();
        }
    }, [targetId]);

    const fetchUniversalKey = async () => {
        setLoadingKey(true);
        try {
            const response = await apiClient.get(`${basePath}/${targetId}/universal-key`);
            setUniversalKey(response.data.data.universalJoinKey);
            setKeyEnabled(response.data.data.universalKeyEnabled);
        } catch (error) {
            console.error('Fetch key error:', error);
        } finally {
            setLoadingKey(false);
        }
    };

    const fetchInvitations = async () => {
        setLoadingInvites(true);
        try {
            const response = await apiClient.get(`${basePath}/${targetId}/invitations`);
            setAllInvitations(response.data.data.invitations || []);
        } catch (error) {
            console.error('Fetch invitations error:', error);
        } finally {
            setLoadingInvites(false);
        }
    };

    const handleToggleKey = async () => {
        try {
            const response = await apiClient.patch(`${basePath}/${targetId}/universal-key/toggle`, {
                enabled: !keyEnabled
            });
            setKeyEnabled(response.data.data.enabled);
            toast.success(keyEnabled ? 'Universal key disabled' : 'Universal key enabled');
        } catch (error) {
            toast.error('Failed to update key status');
        }
    };

    const handleFileUpload = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        if (!selectedFile.name.match(/\.(xlsx|xls|csv)$/)) {
            toast.error('Please upload an Excel or CSV file');
            return;
        }

        setFile(selectedFile);
    };

    const processUpload = async () => {
        if (!file) return;
        
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await apiClient.post(`${basePath}/${targetId}/invite-students`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success(response.data.message);
            setProcessedInvites(response.data.data.invitations || []);
            fetchInvitations(); // Refresh the persistent list
            setFile(null);
        } catch (error) {
            console.error('Upload error:', error);
            const message = error.response?.data?.message || 'Failed to process invitations';
            const details = error.response?.data?.error || '';
            toast.error(`${message}${details ? ': ' + details : ''}`);
        } finally {
            setUploading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(universalKey);
        toast.success('Key copied to clipboard');
    };

    const downloadTemplate = () => {
        // Simple CSV template
        const csvContent = "Name,Email\nJohn Doe,john@example.com\nJane Smith,jane@example.com";
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'eta_student_invitation_template.csv';
        a.click();
    };

    return (
        <div className="space-y-8">
            {/* Universal Key Section */}
            <div className="card p-6 bg-gradient-to-br from-card to-secondary/20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold">Universal Join Key</h3>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${keyEnabled ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                {keyEnabled ? 'Active' : 'Disabled'}
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground max-w-md">
                            Share this key with any student. They can use it to join your {targetType} instantly. Unlike individual keys, this key does not expire after a single use.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <div className={`p-4 rounded-xl border-2 border-dashed font-mono font-bold text-xl tracking-[0.2em] flex items-center gap-4 transition-all ${keyEnabled ? 'border-primary/30 bg-primary/5 text-primary' : 'border-border bg-secondary/5 text-muted-foreground opacity-50'}`}>
                                {loadingKey ? <Loader2 className="w-5 h-5 animate-spin" /> : universalKey}
                                <button 
                                    onClick={copyToClipboard}
                                    disabled={!keyEnabled}
                                    className="p-2 hover:bg-primary/10 rounded-lg transition-colors text-primary"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <button 
                            onClick={handleToggleKey}
                            className={`p-3 rounded-xl transition-all ${keyEnabled ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'}`}
                        >
                            {keyEnabled ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Excel Upload Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <Mail className="w-5 h-5 text-primary" />
                            Invite Students via Excel
                        </h3>
                        <button 
                            onClick={downloadTemplate}
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                            <Download className="w-3 h-3" />
                            Download Template
                        </button>
                    </div>
                    
                    <div className="card p-8 border-2 border-dashed border-border flex flex-col items-center justify-center text-center space-y-4 hover:border-primary/50 transition-colors">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <FileUp className="w-8 h-8 text-primary" />
                        </div>
                        
                        <div>
                            <p className="font-semibold">{file ? file.name : 'Select student list file'}</p>
                            <p className="text-xs text-muted-foreground mt-1">Excel (.xlsx, .xls) or CSV files only</p>
                        </div>

                        <input 
                            type="file" 
                            id="excel-upload" 
                            className="hidden" 
                            accept=".xlsx,.xls,.csv"
                            onChange={handleFileUpload}
                        />
                        
                        {!file ? (
                            <label 
                                htmlFor="excel-upload"
                                className="btn-secondary cursor-pointer"
                            >
                                Browse Files
                            </label>
                        ) : (
                            <div className="flex gap-2 w-full">
                                <button 
                                    onClick={() => setFile(null)}
                                    className="btn-secondary flex-1"
                                    disabled={uploading}
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={processUpload}
                                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                                    disabled={uploading}
                                >
                                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Process & Send Invites'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Info Card */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                        How it works
                    </h3>
                    <div className="card p-6 bg-secondary/10 space-y-4">
                        <div className="flex gap-4">
                            <div className="w-8 h-8 shrink-0 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">1</div>
                            <p className="text-sm">Upload an Excel/CSV file with columns <strong>Name</strong> and <strong>Email</strong>.</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 shrink-0 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">2</div>
                            <p className="text-sm">Our system generates a <strong>unique single-use secret key</strong> for each student in the list.</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 shrink-0 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">3</div>
                            <p className="text-sm">An automated invitation email is sent to every student containing their personal join key.</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 shrink-0 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">4</div>
                            <p className="text-sm">Once a student joins using their key, it becomes <strong>invalid</strong> for everyone else.</p>
                        </div>
                        
                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                            <p className="text-[11px] text-amber-500 leading-relaxed">
                                <strong>Important:</strong> Ensure your SMTP settings are configured in the backend for emails to be successfully delivered to students.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Preview Table */}
            <AnimatePresence>
                {processedInvites.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-4"
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold flex items-center gap-2 text-green-500">
                                <CheckCircle2 className="w-5 h-5" />
                                Processing Complete: {processedInvites.length} Students Invited
                            </h3>
                            <button 
                                onClick={() => setProcessedInvites([])}
                                className="text-xs text-muted-foreground hover:text-foreground"
                            >
                                Clear List
                            </button>
                        </div>

                        <div className="card overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-secondary/50 text-xs font-bold uppercase tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4">Student Name</th>
                                            <th className="px-6 py-4">Email Address</th>
                                            <th className="px-6 py-4">Secret Access Key</th>
                                            <th className="px-6 py-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {processedInvites.map((invite, i) => (
                                            <motion.tr 
                                                key={i}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                className="hover:bg-secondary/20 transition-colors"
                                            >
                                                <td className="px-6 py-4 text-sm font-medium">{invite.name || 'N/A'}</td>
                                                <td className="px-6 py-4 text-sm text-muted-foreground">{invite.email}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-3 py-1 bg-primary/10 text-primary rounded-lg font-mono font-bold text-xs tracking-wider">
                                                            {invite.key}
                                                        </span>
                                                        <button 
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(invite.key);
                                                                toast.success(`Key for ${invite.name || invite.email} copied`);
                                                            }}
                                                            className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-primary transition-colors"
                                                            title="Copy Key"
                                                        >
                                                            <Copy className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-green-500 uppercase tracking-widest">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                        Sent
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Existing Invitations Section */}
            <div className="space-y-4 pt-10 border-t-2 border-border/50 mt-10">
                <button 
                    onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                    className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 hover:bg-secondary/20 rounded-2xl transition-all text-left"
                >
                    <div className="space-y-1">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <Users className="w-6 h-6 text-primary" />
                            Invitation History
                        </h3>
                        <p className="text-xs text-muted-foreground">Persistent record of all students invited to this {targetType}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-secondary/30 px-3 py-1.5 rounded-full border border-border/50">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                Joined: {allInvitations.filter(i => i.isUsed).length}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-secondary/30 px-3 py-1.5 rounded-full border border-border/50">
                                <div className="w-2 h-2 rounded-full bg-amber-500" />
                                Pending: {allInvitations.filter(i => !i.isUsed).length}
                            </div>
                        </div>
                        {isHistoryOpen ? <ChevronUp className="w-6 h-6 text-muted-foreground" /> : <ChevronDown className="w-6 h-6 text-muted-foreground" />}
                    </div>
                </button>

                <AnimatePresence>
                    {isHistoryOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="card overflow-hidden border-primary/10 shadow-lg shadow-primary/5">
                                {loadingInvites ? (
                                    <div className="p-16 flex flex-col items-center justify-center space-y-4 bg-secondary/10">
                                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                                        <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading secure database...</p>
                                    </div>
                                ) : allInvitations.length === 0 ? (
                                    <div className="p-16 text-center space-y-4 bg-secondary/5">
                                        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto">
                                            <Users className="w-8 h-8 text-muted-foreground/30" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-muted-foreground">No invitation history found</p>
                                            <p className="text-xs text-muted-foreground/60 mt-1">Students will appear here once you process an Excel list.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead className="bg-secondary/50 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground border-b border-border/50">
                                                    <tr>
                                                        <th className="px-6 py-5">Student Information</th>
                                                        <th className="px-6 py-5">Secure Access Key</th>
                                                        <th className="px-6 py-5">Onboarding Status</th>
                                                        <th className="px-6 py-5">Date Generated</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border/50">
                                                    {allInvitations
                                                        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                                        .map((invite) => (
                                                        <tr key={invite._id} className="hover:bg-primary/5 transition-colors group">
                                                            <td className="px-6 py-5">
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-bold group-hover:text-primary transition-colors">{invite.studentName || 'Learner'}</span>
                                                                    <span className="text-xs text-muted-foreground font-medium">{invite.studentEmail}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-5">
                                                                <div className="flex items-center gap-3">
                                                                    <code className="px-3 py-1.5 bg-secondary border border-border/50 rounded-lg text-xs font-mono font-bold tracking-widest text-foreground shadow-inner">
                                                                        {invite.key}
                                                                    </code>
                                                                    <button 
                                                                        onClick={() => {
                                                                            navigator.clipboard.writeText(invite.key);
                                                                            toast.success('Key copied to clipboard');
                                                                        }}
                                                                        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                                                                        title="Copy Key"
                                                                    >
                                                                        <Copy className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-5">
                                                                {invite.isUsed ? (
                                                                    <div className="flex items-center gap-2 text-[10px] font-black text-green-500 uppercase tracking-widest bg-green-500/10 px-3 py-1.5 rounded-full w-fit border border-green-500/20 shadow-sm shadow-green-500/10">
                                                                        <CheckCircle2 className="w-3 h-3" />
                                                                        Access Consumed
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center gap-2 text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-3 py-1.5 rounded-full w-fit border border-amber-500/20 shadow-sm shadow-amber-500/10">
                                                                        <Clock className="w-3 h-3" />
                                                                        Awaiting Join
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                                                {new Date(invite.createdAt).toLocaleDateString('en-US', {
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    year: 'numeric'
                                                                })}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Pagination Controls */}
                                        {allInvitations.length > itemsPerPage && (
                                            <div className="px-6 py-4 bg-secondary/20 flex items-center justify-between border-t border-border/50">
                                                <p className="text-xs text-muted-foreground font-medium">
                                                    Showing <span className="text-foreground">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-foreground">{Math.min(currentPage * itemsPerPage, allInvitations.length)}</span> of <span className="text-foreground">{allInvitations.length}</span> invitations
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <button 
                                                        disabled={currentPage === 1}
                                                        onClick={() => setCurrentPage(prev => prev - 1)}
                                                        className="p-2 rounded-lg hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                        <ChevronLeft className="w-5 h-5" />
                                                    </button>
                                                    <div className="flex items-center gap-1">
                                                        {[...Array(Math.ceil(allInvitations.length / itemsPerPage))].map((_, i) => (
                                                            <button
                                                                key={i}
                                                                onClick={() => setCurrentPage(i + 1)}
                                                                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === i + 1 ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-secondary text-muted-foreground'}`}
                                                            >
                                                                {i + 1}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <button 
                                                        disabled={currentPage === Math.ceil(allInvitations.length / itemsPerPage)}
                                                        onClick={() => setCurrentPage(prev => prev + 1)}
                                                        className="p-2 rounded-lg hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                        <ChevronRight className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
