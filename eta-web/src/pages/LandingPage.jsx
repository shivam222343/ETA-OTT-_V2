import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { GraduationCap, Brain, Users, Sparkles } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function LandingPage() {
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
                <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

                <nav className="relative z-10 container mx-auto px-6 py-6 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <GraduationCap className="w-8 h-8 text-primary" />
                        <span className="text-2xl font-bold">Eta</span>
                    </div>

                    <div className="flex items-center space-x-4">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg hover:bg-secondary transition-colors"
                        >
                            {theme === 'light' ? '🌙' : '☀️'}
                        </button>
                        <Link to="/login" className="btn-ghost">
                            Login
                        </Link>
                        <Link to="/signup" className="btn-primary">
                            Get Started
                        </Link>
                    </div>
                </nav>

                <div className="relative z-10 container mx-auto px-6 py-20 md:py-32">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center max-w-4xl mx-auto"
                    >
                        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            AI-Powered Learning Platform
                        </h1>
                        <p className="text-xl md:text-2xl text-muted-foreground mb-8">
                            Get instant, intelligent answers to your doubts with our advanced AI system.
                            Learn smarter, not harder.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/signup" className="btn-primary text-lg px-8 py-4">
                                Start Learning Free
                            </Link>
                            <Link to="/login" className="btn-secondary text-lg px-8 py-4">
                                Sign In
                            </Link>
                        </div>
                    </motion.div>
                </div>

                {/* Animated Background Elements */}
                <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
                <div className="absolute top-40 right-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-background">
                <div className="container mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl font-bold mb-4">Why Choose Eta?</h2>
                        <p className="text-xl text-muted-foreground">
                            Experience the future of education with AI-assisted learning
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Brain className="w-12 h-12 text-primary" />}
                            title="AI Doubt Resolution"
                            description="Get instant, accurate answers to your questions with our advanced AI system that learns from verified faculty responses."
                        />
                        <FeatureCard
                            icon={<Users className="w-12 h-12 text-primary" />}
                            title="Faculty Escalation"
                            description="Low-confidence answers are automatically escalated to expert faculty for human verification and guidance."
                        />
                        <FeatureCard
                            icon={<Sparkles className="w-12 h-12 text-primary" />}
                            title="Continuous Improvement"
                            description="Our knowledge graph grows smarter with every interaction, providing better answers over time."
                        />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Learning?</h2>
                    <p className="text-xl mb-8 opacity-90">
                        Join thousands of students already learning smarter with Eta
                    </p>
                    <Link to="/signup" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-colors inline-block">
                        Get Started Now
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 bg-secondary">
                <div className="container mx-auto px-6 text-center text-muted-foreground">
                    <p>&copy; 2024 Eta. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, description }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
            className="card p-8 text-center hover:shadow-lg transition-all duration-300"
        >
            <div className="flex justify-center mb-4">{icon}</div>
            <h3 className="text-2xl font-semibold mb-3">{title}</h3>
            <p className="text-muted-foreground">{description}</p>
        </motion.div>
    );
}
