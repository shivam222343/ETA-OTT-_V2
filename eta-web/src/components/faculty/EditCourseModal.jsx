import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, BookOpen, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../api/axios.config';

export default function EditCourseModal({ isOpen, onClose, onSuccess, course, institutions, branches }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        institutionId: '',
        branchIds: [],
        metadata: {
            credits: '',
            semester: ''
        }
    });

    useEffect(() => {
        if (course) {
            setFormData({
                name: course.name || '',
                code: course.code || '',
                description: course.description || '',
                institutionId: course.institutionId?._id || course.institutionId || '',
                branchIds: course.branchIds?.map(b => b._id || b) || [],
                metadata: {
                    credits: course.metadata?.credits || '',
                    semester: course.metadata?.semester || ''
                }
            });
        }
    }, [course]);

    const handleBranchToggle = (branchId) => {
        setFormData(prev => ({
            ...prev,
            branchIds: prev.branchIds.includes(branchId)
                ? prev.branchIds.filter(id => id !== branchId)
                : [...prev.branchIds, branchId]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name) {
            toast.error('Please enter course name');
            return;
        }

        if (formData.branchIds.length === 0) {
            toast.error('Please select at least one branch');
            return;
        }

        setLoading(true);
        try {
            const response = await apiClient.put(`/courses/${course._id}`, {
                name: formData.name,
                code: formData.code,
                description: formData.description,
                branchIds: formData.branchIds,
                metadata: {
                    credits: formData.metadata.credits ? parseInt(formData.metadata.credits) : undefined,
                    semester: formData.metadata.semester ? parseInt(formData.metadata.semester) : undefined
                }
            });
            toast.success('Course updated successfully!');
            onSuccess(response.data.data.course);
            onClose();
        } catch (error) {
            console.error('Update course error:', error);
            toast.error(error.response?.data?.message || 'Failed to update course');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !course) return null;

    const filteredBranches = branches.filter(b =>
        b.institutionId === formData.institutionId ||
        b.institutionId?._id === formData.institutionId
    );

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-card rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
                <div className="sticky top-0 bg-card border-b px-6 py-4 flex items-center justify-between z-10">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <BookOpen className="w-6 h-6 text-primary" />
                        Edit Course
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Course Name */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Course Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="input w-full"
                            placeholder="e.g., Data Structures and Algorithms"
                            disabled={loading}
                        />
                    </div>

                    {/* Course Code */}
                    <div>
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

                    {/* Credits and Semester */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Credits
                            </label>
                            <input
                                type="number"
                                value={formData.metadata.credits}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    metadata: { ...formData.metadata, credits: e.target.value }
                                })}
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
                                type="number"
                                value={formData.metadata.semester}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    metadata: { ...formData.metadata, semester: e.target.value }
                                })}
                                className="input w-full"
                                placeholder="e.g., 5"
                                min="1"
                                max="12"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* Assign to Branches */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Assign to Branches <span className="text-red-500">*</span>
                        </label>
                        <div className="border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
                            {filteredBranches.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No branches available for this institution
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
                                            onChange={() => handleBranchToggle(branch._id)}
                                            className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-primary"
                                            disabled={loading}
                                        />
                                        <div className="flex-1">
                                            <p className="font-medium">{branch.name}</p>
                                            {branch.description && (
                                                <p className="text-xs text-muted-foreground">{branch.description}</p>
                                            )}
                                        </div>
                                    </label>
                                ))
                            )}
                        </div>
                        {formData.branchIds.length > 0 && (
                            <p className="text-sm text-muted-foreground mt-2">
                                {formData.branchIds.length} branch{formData.branchIds.length !== 1 ? 'es' : ''} selected
                            </p>
                        )}
                    </div>

                    {/* Description */}
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
                            {loading ? 'Updating...' : 'Update Course'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
