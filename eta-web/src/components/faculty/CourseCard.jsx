import { BookOpen, Users, FileText, Edit, Trash2, Award, Calendar, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CourseCard({ course, onEdit, onDelete, onViewContent }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6 hover:shadow-lg transition-all"
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">{course.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {course.code && (
                                <span className="font-mono">{course.code}</span>
                            )}
                            {course.institutionId?.name && (
                                <>
                                    <span>•</span>
                                    <span>{course.institutionId.name}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => onEdit(course)}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                        title="Edit"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(course._id)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded-lg transition-colors"
                        title="Delete"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Assigned Branches */}
            {course.branchIds && course.branchIds.length > 0 && (
                <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <GraduationCap className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Assigned to {course.branchIds.length} branch(es):</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {course.branchIds.map((branch, index) => (
                            <span
                                key={branch._id || index}
                                className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary text-xs"
                            >
                                {branch.name || 'Branch'}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Description */}
            <div className="space-y-2 mb-4">
                {course.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                        {course.description}
                    </p>
                )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 pt-4 border-t flex-wrap">
                {course.metadata?.credits && (
                    <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                            {course.metadata.credits} Credits
                        </span>
                    </div>
                )}
                {course.metadata?.semester && (
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                            Sem {course.metadata.semester}
                        </span>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                        {course.contentIds?.length || 0} Content
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                        {course.facultyIds?.length || 0} Faculty
                    </span>
                </div>
            </div>

            {/* Manage Content Button */}
            <div className="mt-4 pt-4 border-t">
                <button
                    onClick={() => onViewContent(course)}
                    className="btn-primary w-full text-sm flex items-center justify-center gap-2"
                >
                    <FileText className="w-4 h-4" />
                    Manage Content
                </button>
            </div>
        </motion.div>
    );
}
