import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, BookOpen, GraduationCap, Building2, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../api/axios.config';

export default function CreateCourseModal({ isOpen, onClose, onSuccess, institutions, branches }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        institutionId: '',
        branchIds: [],
        description: '',
        credits: '',
        semester: ''
    });

    const [filteredBranches, setFilteredBranches] = useState([]);

    const handleInstitutionChange = (institutionId) => {
        setFormData({ ...formData, institutionId, branchIds: [] });
        const filtered = branches.filter(b =>
            (b.institutionId?._id === institutionId || b.institutionId === institutionId)
        );
        setFilteredBranches(filtered);
    };

    const toggleBranch = (branchId) => {
        const currentBranches = [...formData.branchIds];
        const index = currentBranches.indexOf(branchId);

        if (index > -1) {
            currentBranches.splice(index, 1);
        } else {
            currentBranches.push(branchId);
        }

        setFormData({ ...formData, branchIds: currentBranches });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.institutionId || formData.branchIds.length === 0) {
            toast.error('Please fill in all required fields and select at least one branch');
            return;
        }

        setLoading(true);
        try {
            const response = await apiClient.post('/courses', {
                ...formData,
                metadata: {
                    credits: formData.credits,
                    semester: formData.semester
                }
            });
            toast.success('Course created successfully!');
            onSuccess(response.data.data.course);
            onClose();
            setFormData({
                name: '',
                code: '',
                institutionId: '',
                branchIds: [],
                description: '',
                credits: '',
                semester: ''
            });
            setFilteredBranches([]);
        } catch (error) {
            console.error('Create course error:', error);
            toast.error(error.response?.data?.message || 'Failed to create course');
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
                        <BookOpen className="w-6 h-6 text-primary" />
                        Create Course
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Institution Selection */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Institution <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <select
                                value={formData.institutionId}
                                onChange={(e) => handleInstitutionChange(e.target.value)}
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

                    {/* Branch Selection (Multiple) */}
                    {formData.institutionId && (
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Assign to Branches <span className="text-red-500">*</span>
                                <span className="text-xs text-muted-foreground ml-2">
                                    (Select one or more branches)
                                </span>
                            </label>
                            <div className="border rounded-lg p-4 space-y-2 max-h-48 overflow-y-auto">
                                {filteredBranches.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        No branches available. Create a branch first.
                                    </p>
                                ) : (
                                    filteredBranches.map((branch) => (
                                        <label
                                            key={branch._id}
                                            className="flex items-center gap-3 p-3 hover:bg-secondary rounded-lg cursor-pointer transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={formData.branchIds.includes(branch._id)}
                                                onChange={() => toggleBranch(branch._id)}
                                                className="w-4 h-4 text-primary rounded"
                                                disabled={loading}
                                            />
                                            <div className="flex items-center gap-2 flex-1">
                                                <GraduationCap className="w-4 h-4 text-muted-foreground" />
                                                <span className="text-sm">{branch.name}</span>
                                            </div>
                                        </label>
                                    ))
                                )}
                            </div>
                            {formData.branchIds.length > 0 && (
                                <p className="text-xs text-primary mt-2">
                                    {formData.branchIds.length} branch(es) selected
                                </p>
                            )}
                        </div>
                    )}

                    {/* Course Details */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-sm font-medium mb-2">
                                Course Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="input w-full"
                                placeholder="e.g., Data Structures"
                                disabled={loading}
                            />
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-sm font-medium mb-2">
                                Course Code
                            </label>
                            <input
                                type="text"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                className="input w-full"
                                placeholder="e.g., CS201"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Credits
                            </label>
                            <input
                                type="number"
                                value={formData.credits}
                                onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                                className="input w-full"
                                placeholder="e.g., 4"
                                min="1"
                                max="10"
                                disabled={loading}
                            />
                        </div>
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
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="input w-full min-h-[100px]"
                            placeholder="Brief description about the course..."
                            disabled={loading}
                        />
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <p className="text-sm text-blue-900 dark:text-blue-100">
                            <strong>Note:</strong> This course will be available to all selected branches.
                            Any content you upload will be shared across all branches.
                        </p>
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
                            {loading ? 'Creating...' : 'Create Course'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
