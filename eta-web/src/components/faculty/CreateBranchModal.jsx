import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, GraduationCap, Building2, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../api/axios.config';

export default function CreateBranchModal({ isOpen, onClose, onSuccess, institutions }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        institutionId: '',
        description: '',
        semester: '',
        academicYear: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.institutionId) {
            toast.error('Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            const response = await apiClient.post('/branches', formData);
            toast.success('Branch created successfully!');
            onSuccess(response.data.data.branch);
            onClose();
            setFormData({ name: '', institutionId: '', description: '', semester: '', academicYear: '' });
        } catch (error) {
            console.error('Create branch error:', error);
            toast.error(error.response?.data?.message || 'Failed to create branch');
        } finally {
            setLoading(false);
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
                        <GraduationCap className="w-6 h-6 text-primary" />
                        Create Branch
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Institution <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <select
                                value={formData.institutionId}
                                onChange={(e) => setFormData({ ...formData, institutionId: e.target.value })}
                                className="input w-full pl-10"
                                disabled={loading}
                            >
                                <option value="">Select Institution</option>
                                {institutions.map((inst) => (
                                    <option key={inst._id} value={inst._id}>
                                        {inst.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Branch Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="input w-full"
                            placeholder="e.g., Computer Science - Semester 5"
                            disabled={loading}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Semester
                            </label>
                            <input
                                type="text"
                                value={formData.semester}
                                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                                className="input w-full"
                                placeholder="e.g., 5"
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Academic Year
                            </label>
                            <input
                                type="text"
                                value={formData.academicYear}
                                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                                className="input w-full"
                                placeholder="e.g., 2024-2025"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="input w-full min-h-[100px]"
                            placeholder="Brief description about the branch..."
                            disabled={loading}
                        />
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <QrCode className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                                    QR Code & Access Key
                                </p>
                                <p className="text-blue-700 dark:text-blue-300">
                                    A unique QR code and access key will be generated automatically for students to join this branch.
                                </p>
                            </div>
                        </div>
                    </div>

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
                            {loading ? 'Creating...' : 'Create Branch'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
