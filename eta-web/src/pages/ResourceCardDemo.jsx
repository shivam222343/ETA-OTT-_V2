import ResourceCard from '../components/ResourceCard';
import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';

/**
 * Demo page showcasing the modern academic resource cards
 */
export default function ResourceCardDemo() {
    const [isDark, setIsDark] = useState(true);

    // Sample resources
    const resources = [
        {
            _id: '1',
            title: 'Computer Networks – Lecture Notes',
            type: 'pdf',
            courseId: { name: 'Computer Networks' },
            createdAt: '2026-02-17T00:00:00Z',
            file: { sizeBytes: 4718592 }, // 4.5 MB
        },
        {
            _id: '2',
            title: 'Data Structures and Algorithms – Complete Guide',
            type: 'pdf',
            courseId: { name: 'Data Structures' },
            createdAt: '2026-02-15T00:00:00Z',
            file: { sizeBytes: 8388608 }, // 8 MB
        },
        {
            _id: '3',
            title: 'Introduction to Machine Learning – Video Lecture Series',
            type: 'video',
            courseId: { name: 'Machine Learning' },
            createdAt: '2026-02-10T00:00:00Z',
            file: { sizeBytes: 157286400 }, // 150 MB
        },
        {
            _id: '4',
            title: 'Operating Systems Concepts – Interactive Tutorial',
            type: 'web',
            courseId: { name: 'Operating Systems' },
            createdAt: '2026-02-08T00:00:00Z',
            file: { sizeBytes: 2097152 }, // 2 MB
        },
        {
            _id: '5',
            title: 'Database Management Systems – SQL Fundamentals',
            type: 'pdf',
            courseId: { name: 'Database Systems' },
            createdAt: '2026-02-05T00:00:00Z',
            file: { sizeBytes: 6291456 }, // 6 MB
        },
        {
            _id: '6',
            title: 'Software Engineering Principles – Best Practices',
            type: 'pdf',
            courseId: { name: 'Software Engineering' },
            createdAt: '2026-02-01T00:00:00Z',
            file: { sizeBytes: 3145728 }, // 3 MB
        },
    ];

    return (
        <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'dark bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950' : 'bg-gradient-to-br from-gray-50 via-white to-gray-50'}`}>
            {/* Header */}
            <div className="border-b border-border/50 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-1.5 h-8 bg-primary" />
                                <h1 className="text-3xl font-bold text-foreground dark:text-gray-100">
                                    Academic Repository
                                </h1>
                            </div>
                            <p className="text-sm text-muted-foreground dark:text-gray-400 ml-6">
                                Modern resource card design with sharp corners and clean aesthetics
                            </p>
                        </div>

                        {/* Theme Toggle */}
                        <button
                            onClick={() => setIsDark(!isDark)}
                            className="
                                p-3 
                                bg-card dark:bg-gray-900
                                border border-border dark:border-gray-800
                                hover:border-primary/30 dark:hover:border-primary/30
                                transition-all duration-300
                                shadow-lg
                            "
                        >
                            {isDark ? (
                                <Sun className="w-5 h-5 text-primary" />
                            ) : (
                                <Moon className="w-5 h-5 text-primary" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Resource Grid */}
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {resources.map((resource) => (
                        <ResourceCard
                            key={resource._id}
                            resource={resource}
                            onClick={() => console.log('Clicked:', resource.title)}
                        />
                    ))}
                </div>
            </div>

            {/* Design Specs */}
            <div className="max-w-7xl mx-auto px-6 pb-12">
                <div className="
                    p-6 
                    bg-card/50 dark:bg-gray-900/50
                    border border-border/50 dark:border-gray-800
                ">
                    <h2 className="text-lg font-bold text-foreground dark:text-gray-100 mb-4 flex items-center gap-2">
                        <div className="w-1 h-5 bg-primary" />
                        Design Specifications
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                            <div className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 bg-primary mt-1.5" />
                                <div>
                                    <span className="font-semibold text-foreground dark:text-gray-200">Sharp Corners:</span>
                                    <span className="text-muted-foreground dark:text-gray-400"> No border radius anywhere</span>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 bg-primary mt-1.5" />
                                <div>
                                    <span className="font-semibold text-foreground dark:text-gray-200">Layout:</span>
                                    <span className="text-muted-foreground dark:text-gray-400"> Centered icon, uppercase labels, structured metadata</span>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 bg-primary mt-1.5" />
                                <div>
                                    <span className="font-semibold text-foreground dark:text-gray-200">Typography:</span>
                                    <span className="text-muted-foreground dark:text-gray-400"> Strong hierarchy with modern sans-serif</span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 bg-primary mt-1.5" />
                                <div>
                                    <span className="font-semibold text-foreground dark:text-gray-200">Theme Support:</span>
                                    <span className="text-muted-foreground dark:text-gray-400"> Elegant dark and light modes</span>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 bg-primary mt-1.5" />
                                <div>
                                    <span className="font-semibold text-foreground dark:text-gray-200">Interactions:</span>
                                    <span className="text-muted-foreground dark:text-gray-400"> Smooth hover animations with elevation</span>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 bg-primary mt-1.5" />
                                <div>
                                    <span className="font-semibold text-foreground dark:text-gray-200">Visual Style:</span>
                                    <span className="text-muted-foreground dark:text-gray-400"> Minimal, academic, high-end UI</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
