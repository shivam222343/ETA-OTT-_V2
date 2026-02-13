import { GraduationCap, Users, QrCode, Edit, Trash2, Key, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function BranchCard({ branch, onEdit, onDelete, onShowQR }) {
    const [showAccessKey, setShowAccessKey] = useState(false);

    const copyAccessKey = () => {
        navigator.clipboard.writeText(branch.accessKey);
        toast.success('Access key copied!');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6 hover:shadow-lg transition-all"
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <GraduationCap className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">{branch.name}</h3>
                        <p className="text-xs text-muted-foreground">
                            {branch.institutionId?.name || 'Institution'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => onShowQR(branch)}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                        title="Show QR Code"
                    >
                        <QrCode className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onEdit(branch)}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                        title="Edit"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(branch._id)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded-lg transition-colors"
                        title="Delete"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="space-y-2 mb-4">
                {branch.metadata?.semester && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>Semester {branch.metadata.semester}</span>
                        {branch.metadata?.academicYear && (
                            <span className="text-xs">• {branch.metadata.academicYear}</span>
                        )}
                    </div>
                )}
                {branch.metadata?.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                        {branch.metadata.description}
                    </p>
                )}
            </div>

            <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                            {branch.enrolledStudents?.length || 0} Students
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-muted-foreground" />
                        <button
                            onClick={() => setShowAccessKey(!showAccessKey)}
                            className="text-sm text-primary hover:underline"
                        >
                            {showAccessKey ? 'Hide' : 'Show'} Key
                        </button>
                    </div>
                </div>

                {showAccessKey && (
                    <div className="bg-secondary p-3 rounded-lg">
                        <div className="flex items-center justify-between">
                            <code className="text-sm font-mono">{branch.accessKey}</code>
                            <button
                                onClick={copyAccessKey}
                                className="text-xs text-primary hover:underline"
                            >
                                Copy
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
