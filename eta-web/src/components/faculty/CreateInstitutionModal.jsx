import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Building2, MapPin, Globe, Key, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../api/axios.config';

export default function CreateInstitutionModal({ isOpen, onClose, onSuccess, institution = null }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        logo: '',
        website: '',
        address: ''
    });

    const isEditMode = !!institution;

    useEffect(() => {
        if (institution) {
            setFormData({
                name: institution.name || '',
                description: institution.metadata?.description || '',
                logo: institution.metadata?.logo || '',
                website: institution.metadata?.website || '',
                address: institution.metadata?.address || ''
            });
        } else {
            setFormData({ name: '', description: '', logo: '', website: '', address: '' });
        }
    }, [institution]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name) {
            toast.error('Please enter institution name');
            return;
        }

        setLoading(true);
        try {
            let response;
            if (isEditMode) {
                response = await apiClient.put(`/institutions/${institution._id}`, formData);
                toast.success('Institution updated successfully!');
            } else {
                response = await apiClient.post('/institutions', formData);
                toast.success('Institution created successfully!');
            }
            onSuccess(response.data.data.institution);
            onClose();
            setFormData({ name: '', description: '', logo: '', website: '', address: '' });
        } catch (error) {
            console.error('Institution operation error:', error);
            toast.error(error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} institution`);
        } finally {
            setLoading(false);
        }
    };

    const copyAccessKey = () => {
        if (institution?.facultyAccessKey) {
            navigator.clipboard.writeText(institution.facultyAccessKey);
            toast.success('Access key copied to clipboard!');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-card rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
                <div className="sticky top-0 bg-card border-b px-6 py-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Building2 className="w-6 h-6 text-primary" />
                        {isEditMode ? 'Edit Institution' : 'Create Institution'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Access Key Display (Edit Mode Only) */}
                    {isEditMode && institution?.facultyAccessKey && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Key className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                    Faculty Access Key
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={institution.facultyAccessKey}
                                    readOnly
                                    className="input flex-1 font-mono text-sm bg-white dark:bg-gray-800"
                                />
                                <button
                                    type="button"
                                    onClick={copyAccessKey}
                                    className="btn-secondary flex items-center gap-2"
                                >
                                    <Copy className="w-4 h-4" />
                                    Copy
                                </button>
                            </div>
                            <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                                Share this key with other faculty members to let them join this institution
                            </p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Institution Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="input w-full"
                            placeholder="e.g., Massachusetts Institute of Technology"
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Website
                        </label>
                        <div className="relative">
                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                type="url"
                                value={formData.website}
                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                className="input w-full pl-10"
                                placeholder="https://example.edu"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Address
                        </label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                            <textarea
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="input w-full pl-10 min-h-[80px]"
                                placeholder="Enter full address"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Logo URL
                        </label>
                        <input
                            type="url"
                            value={formData.logo}
                            onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                            className="input w-full"
                            placeholder="https://example.com/logo.png"
                            disabled={loading}
                        />
                        {formData.logo && (
                            <div className="mt-2">
                                <img
                                    src={formData.logo}
                                    alt="Logo preview"
                                    className="w-16 h-16 rounded-lg object-cover border"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="input w-full min-h-[100px]"
                            placeholder="Brief description about the institution..."
                            disabled={loading}
                        />
                    </div>

                    {!isEditMode && (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                            <p className="text-sm text-green-900 dark:text-green-100">
                                <strong>Note:</strong> A unique faculty access key will be generated automatically.
                                You can share this key with other faculty members to let them join your institution.
                            </p>
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-secondary flex-1"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary flex-1"
                            disabled={loading}
                        >
                            {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Institution' : 'Create Institution')}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
