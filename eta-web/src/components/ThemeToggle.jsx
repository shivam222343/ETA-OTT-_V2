import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { motion } from 'framer-motion';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.1 }}
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/50 text-foreground transition-all flex items-center justify-center relative group overflow-hidden"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            <div className="relative w-5 h-5">
                <motion.div
                    initial={false}
                    animate={{
                        scale: theme === 'light' ? 1 : 0,
                        rotate: theme === 'light' ? 0 : 90,
                        opacity: theme === 'light' ? 1 : 0
                    }}
                    transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                    className="absolute inset-0 flex items-center justify-center text-orange-500"
                >
                    <Sun className="w-5 h-5 fill-orange-500/20" />
                </motion.div>
                <motion.div
                    initial={false}
                    animate={{
                        scale: theme === 'dark' ? 1 : 0,
                        rotate: theme === 'dark' ? 0 : -90,
                        opacity: theme === 'dark' ? 1 : 0
                    }}
                    transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                    className="absolute inset-0 flex items-center justify-center text-blue-400"
                >
                    <Moon className="w-5 h-5 fill-blue-400/20" />
                </motion.div>
            </div>

            {/* Subtle glow effect */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity blur-lg ${theme === 'light' ? 'bg-orange-400' : 'bg-blue-400'}`}></div>
        </motion.button>
    );
}
