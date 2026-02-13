import { Building2, MapPin, Users, BookOpen, Edit, Trash2, Globe, Settings, Key, Copy, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function InstitutionCard({ institution, onEdit, onDelete, onManage, onLeave, user }) {
    const [showAccessKey, setShowAccessKey] = useState(false);

    // Check if current user is the creator
    const isCreator = institution.createdBy?._id === user?._id || institution.createdBy === user?._id;

    const copyAccessKey = () => {
        if (institution.facultyAccessKey) {
            navigator.clipboard.writeText(institution.facultyAccessKey);
            toast.success('Access key copied to clipboard!');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6 hover:shadow-lg transition-all"
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    {institution.metadata?.logo ? (
                        <img
                            src={institution.metadata.logo}
                            alt={institution.name}
                            className="w-12 h-12 rounded-lg object-cover"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-primary" />
                        </div>
                    )}
                    <div>
                        <h3 className="text-lg font-semibold">{institution.name}</h3>
                        <p className="text-xs text-muted-foreground">
                            Created {new Date(institution.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => onManage(institution)}
                        className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                        title="Manage"
                    >
                        <Settings className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onEdit(institution)}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                        title="Edit"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    {isCreator ? (
                        <button
                            onClick={() => onDelete(institution._id)}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded-lg transition-colors"
                            title="Delete Institution"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={() => onLeave(institution._id)}
                            className="p-2 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-orange-600 rounded-lg transition-colors"
                            title="Leave Institution"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            <div className="space-y-3 mb-4">
                {institution.metadata?.address && (
                    <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <span className="text-muted-foreground">{institution.metadata.address}</span>
                    </div>
                )}
                {institution.metadata?.website && (
                    <div className="flex items-center gap-2 text-sm">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <a
                            href={institution.metadata.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                        >
                            {institution.metadata.website}
                        </a>
                    </div>
                )}
            </div>

            {/* Faculty Access Key */}
            {institution.facultyAccessKey && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Key className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-xs font-medium text-blue-900 dark:text-blue-100">
                                Faculty Access Key
                            </span>
                        </div>
                        <button
                            onClick={() => setShowAccessKey(!showAccessKey)}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            {showAccessKey ? 'Hide' : 'Show'}
                        </button>
                    </div>
                    {showAccessKey && (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={institution.facultyAccessKey}
                                readOnly
                                className="input flex-1 font-mono text-xs bg-white dark:bg-gray-800"
                            />
                            <button
                                onClick={copyAccessKey}
                                className="p-2 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-lg transition-colors"
                                title="Copy"
                            >
                                <Copy className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 pt-4 border-t text-sm">
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>{institution.facultyIds?.length || 0} Faculty</span>
                </div>
                <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                    <span>{institution.stats?.totalBranches || 0} Branches</span>
                </div>
            </div>
        </motion.div>
    );
}
