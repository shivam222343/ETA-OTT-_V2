import { useState, useEffect } from 'react';
import {
    Users, Search, Filter, Award,
    MessageSquare, CheckCircle2, ChevronRight,
    SearchX
} from 'lucide-react';
import apiClient from '../../api/axios.config';
import Loader from '../Loader';

export default function FacultyStudentData() {
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('all');

    const fetchStudentStats = async () => {
        setLoading(true);
        try {
            const { data } = await apiClient.get('/peer/faculty/student-stats');
            setStudents(data.data);
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudentStats();
    }, []);

    const filteredStudents = students.filter(s => {
        const name = s.name?.toString() || '';
        const email = s.email?.toString() || '';
        const query = searchQuery.toLowerCase();

        const matchesSearch = name.toLowerCase().includes(query) ||
            email.toLowerCase().includes(query);
        return matchesSearch;
    }).sort((a, b) => b.credits - a.credits);

    if (loading) return <Loader fullScreen={false} />;

    return (
        <div className="space-y-6">
            <div className="header-dashboard">
                <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                    <Users className="w-6 h-6 text-primary" />
                    Student Peer Learning Stats
                </h2>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search students by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-card border border-border focus:border-primary rounded-2xl pl-12 pr-4 py-4 font-medium outline-none transition-all shadow-sm"
                    />
                </div>
            </div>

            <div className="bg-card border border-border rounded-[32px] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-secondary/30 border-b border-border">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Rank</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Student</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 text-center">Questions Solved</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 text-right">Total Credits</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {filteredStudents.length > 0 ? (
                                filteredStudents.map((student, i) => (
                                    <tr key={student.id} className="hover:bg-secondary/20 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center font-black text-primary text-xs">
                                                #{i + 1}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-xs">
                                                    {student.name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold">{student.name}</span>
                                                    <span className="text-[10px] text-muted-foreground">{student.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-xs font-black">
                                                <CheckCircle2 className="w-3 h-3" />
                                                {student.solved}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl text-sm font-black">
                                                <Award className="w-4 h-4" />
                                                {student.credits}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-20 text-center">
                                        <SearchX className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                                        <p className="text-muted-foreground font-medium">No students found matching your search.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
