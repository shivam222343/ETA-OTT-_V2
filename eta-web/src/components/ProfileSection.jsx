import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Mail, Phone, Camera, Sparkles,
    Upload, RefreshCw, Check, X,
    ChevronRight, Shield, Globe, Award, Edit2,
    GraduationCap, Briefcase, MapPin, Calendar,
    Book, Code, Heart
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfileSection() {
    const { user, updateProfile } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [variationLoading, setVariationLoading] = useState(false);
    const [variations, setVariations] = useState([]);
    const [selectedVariation, setSelectedVariation] = useState(null);
    const fileInputRef = useRef(null);
    const bannerInputRef = useRef(null);

    const [formData, setFormData] = useState({
        name: user?.profile?.name || '',
        bio: user?.profile?.bio || '',
        phone: user?.profile?.phone || '',
        department: user?.profile?.department || '',
        designation: user?.profile?.designation || '',
        specialization: user?.profile?.specialization || '',
        semester: user?.profile?.semester || '',
        prnNumber: user?.profile?.prnNumber || '',
        interests: user?.profile?.interests || ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateProfile(formData);
            setIsEditing(false);
        } catch (error) {
            console.error('Update profile error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size should be less than 5MB');
            return;
        }

        const data = new FormData();
        data.append('avatar', file);

        setLoading(true);
        try {
            await updateProfile(data);
        } catch (error) {
            console.error('File upload error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBannerUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size should be less than 5MB');
            return;
        }

        const data = new FormData();
        data.append('banner', file);

        setLoading(true);
        try {
            await updateProfile(data);
        } catch (error) {
            console.error('Banner upload error:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateDiceBearVariations = () => {
        setVariationLoading(true);
        const newVariations = [];
        const seeds = Array.from({ length: 12 }, () => Math.random().toString(36).substring(7));

        // Mix of different avatar styles for variety
        const styles = [
            'adventurer',      // Adventurous characters
            'avataaars',       // Cartoon avatars
            'bottts',          // Robot avatars
            'fun-emoji',       // Fun emoji faces
            'lorelei',         // Illustrated portraits
            'micah',           // Bubble style
            'notionists',      // Professional style
            'pixel-art'        // Retro pixel art
        ];

        seeds.forEach((seed, index) => {
            const style = styles[index % styles.length];
            newVariations.push(`https://api.dicebear.com/9.x/${style}/png?seed=${seed}&backgroundColor=ffd5dc,ffdfbf,f1f4ff,e8f5e9,d5f5dc,ffe5dc&radius=50`);
        });

        setVariations(newVariations);
        setVariationLoading(false);
    };

    const handleSelectVariation = async (url) => {
        setSelectedVariation(url);
        setLoading(true);
        try {
            await updateProfile({ avatarUrl: url });
            setVariations([]);
            setSelectedVariation(null);
        } catch (error) {
            console.error('DiceBear selection error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            {/* Header / Banner */}
            <div className="relative h-56 rounded-3xl overflow-visible group/banner">
                {/* Banner Background */}
                <div className="absolute inset-0 rounded-3xl overflow-hidden">
                    {user?.profile?.banner ? (
                        <img src={user.profile.banner} alt="Banner" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-r from-primary/20 via-purple-500/20 to-blue-500/20 backdrop-blur-3xl" />
                    )}
                </div>

                {/* Banner Edit Button */}
                <button
                    onClick={() => bannerInputRef.current?.click()}
                    className="absolute top-4 right-4 p-2.5 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white rounded-xl shadow-lg opacity-0 group-hover/banner:opacity-100 transition-all hover:scale-110 z-10"
                >
                    <Edit2 className="w-4 h-4" />
                </button>

                {/* Profile Image - Positioned at bottom with high z-index */}
                <div className="absolute -bottom-16 left-8 z-20">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-3xl bg-card border-4 border-background shadow-2xl overflow-hidden">
                            {user?.profile?.avatar ? (
                                <img src={user.profile.avatar} alt={user.profile.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                                    <User className="w-12 h-12" />
                                </div>
                            )}
                            {loading && (
                                <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
                                    <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-2 right-2 p-2 bg-primary text-white rounded-xl shadow-lg hover:scale-110 transition-transform"
                        >
                            <Camera className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*"
                />
                <input
                    type="file"
                    ref={bannerInputRef}
                    onChange={handleBannerUpload}
                    className="hidden"
                    accept="image/*"
                />
            </div>

            <div className="pt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="card p-8 space-y-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-2xl font-bold">{user?.profile?.name}</h1>
                                <p className="text-muted-foreground">{user?.role} Profile</p>
                            </div>
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors text-sm font-medium"
                            >
                                {isEditing ? 'Cancel' : 'Edit Profile'}
                            </button>
                        </div>

                        {isEditing ? (
                            <form onSubmit={handleUpdateProfile} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Full Name</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <input
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                className="input pl-10 w-full bg-secondary/50 border-none"
                                                placeholder="Enter your name"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Phone Number</label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <input
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                className="input pl-10 w-full bg-secondary/50 border-none"
                                                placeholder="Enter phone number"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {user?.role === 'faculty' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Department</label>
                                            <div className="relative">
                                                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <input
                                                    name="department"
                                                    value={formData.department}
                                                    onChange={handleInputChange}
                                                    className="input pl-10 w-full bg-secondary/50 border-none"
                                                    placeholder="e.g., Computer Science"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Designation</label>
                                            <div className="relative">
                                                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <input
                                                    name="designation"
                                                    value={formData.designation}
                                                    onChange={handleInputChange}
                                                    className="input pl-10 w-full bg-secondary/50 border-none"
                                                    placeholder="e.g., Assistant Professor"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-sm font-medium">Specialization</label>
                                            <div className="relative">
                                                <Book className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <input
                                                    name="specialization"
                                                    value={formData.specialization}
                                                    onChange={handleInputChange}
                                                    className="input pl-10 w-full bg-secondary/50 border-none"
                                                    placeholder="e.g., Machine Learning, Data Science"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {user?.role === 'student' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">PRN Number (Admission ID)</label>
                                            <div className="relative">
                                                <Code className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <input
                                                    name="prnNumber"
                                                    value={formData.prnNumber}
                                                    onChange={handleInputChange}
                                                    className="input pl-10 w-full bg-secondary/50 border-none"
                                                    placeholder="Enter PRN number"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Semester</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <input
                                                    name="semester"
                                                    value={formData.semester}
                                                    onChange={handleInputChange}
                                                    className="input pl-10 w-full bg-secondary/50 border-none"
                                                    placeholder="e.g., 5th Semester"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-sm font-medium">Interests</label>
                                            <div className="relative">
                                                <Heart className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <input
                                                    name="interests"
                                                    value={formData.interests}
                                                    onChange={handleInputChange}
                                                    className="input pl-10 w-full bg-secondary/50 border-none"
                                                    placeholder="e.g., Web Development, AI, Robotics"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Bio</label>
                                    <textarea
                                        name="bio"
                                        value={formData.bio}
                                        onChange={handleInputChange}
                                        className="input w-full bg-secondary/50 border-none min-h-[100px]"
                                        placeholder="Tell us about yourself..."
                                    />
                                </div>
                                <button type="submit" className="btn-primary w-full py-3 rounded-xl" disabled={loading}>
                                    {loading ? <RefreshCw className="w-5 h-5 animate-spin mx-auto" /> : 'Save Changes'}
                                </button>
                            </form>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/30 border border-border/50">
                                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-muted-foreground">Email Address</p>
                                            <p className="font-medium truncate">{user?.email}</p>
                                        </div>
                                    </div>
                                    {user?.profile?.phone && (
                                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/30 border border-border/50">
                                            <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                                                <Phone className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Phone Number</p>
                                                <p className="font-medium">{user.profile.phone}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Role-specific fields */}
                                {user?.role === 'faculty' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {user?.profile?.department && (
                                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/30 border border-border/50">
                                                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                                                    <Briefcase className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Department</p>
                                                    <p className="font-medium">{user.profile.department}</p>
                                                </div>
                                            </div>
                                        )}
                                        {user?.profile?.designation && (
                                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/30 border border-border/50">
                                                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                                                    <GraduationCap className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Designation</p>
                                                    <p className="font-medium">{user.profile.designation}</p>
                                                </div>
                                            </div>
                                        )}
                                        {user?.profile?.specialization && (
                                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/30 border border-border/50 md:col-span-2">
                                                <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                                                    <Book className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Specialization</p>
                                                    <p className="font-medium">{user.profile.specialization}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {user?.role === 'student' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {user?.profile?.prnNumber && (
                                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/30 border border-border/50">
                                                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                                                    <Code className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">PRN Number (Admission ID)</p>
                                                    <p className="font-medium">{user.profile.prnNumber}</p>
                                                </div>
                                            </div>
                                        )}
                                        {user?.profile?.semester && (
                                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/30 border border-border/50">
                                                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                                                    <Calendar className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Semester</p>
                                                    <p className="font-medium">{user.profile.semester}</p>
                                                </div>
                                            </div>
                                        )}
                                        {user?.profile?.interests && (
                                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/30 border border-border/50 md:col-span-2">
                                                <div className="p-2 bg-pink-500/10 rounded-lg text-pink-500">
                                                    <Heart className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Interests</p>
                                                    <p className="font-medium">{user.profile.interests}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <p className="text-sm font-medium">About</p>
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        {user?.profile?.bio || 'No bio provided yet. Add a bio to tell others about yourself!'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Avatar Generation Section */}
                    <div className="card p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-primary" />
                                <h2 className="text-xl font-bold">Generate Avatar</h2>
                            </div>
                            <button
                                onClick={generateDiceBearVariations}
                                className="text-primary hover:underline text-sm font-medium flex items-center gap-1"
                                disabled={variationLoading}
                            >
                                <RefreshCw className={`w-4 h-4 ${variationLoading ? 'animate-spin' : ''}`} />
                                Generate New
                            </button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Not feeling like uploading a photo? Generate a unique artistic avatar with AI.
                        </p>

                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                            {variations.length > 0 ? variations.map((url, i) => (
                                <motion.button
                                    key={i}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleSelectVariation(url)}
                                    className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all ${selectedVariation === url ? 'border-primary shadow-lg ring-2 ring-primary/20' : 'border-transparent hover:border-primary/50'
                                        }`}
                                >
                                    <img src={url} alt={`Variation ${i}`} className="w-full h-full object-cover" />
                                    {selectedVariation === url && (
                                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                            <Check className="w-6 h-6 text-white" />
                                        </div>
                                    )}
                                </motion.button>
                            )) : (
                                <div className="col-span-full py-8 text-center border-2 border-dashed rounded-3xl border-border/50">
                                    <button
                                        onClick={generateDiceBearVariations}
                                        className="btn-primary px-6 py-2 rounded-xl inline-flex items-center gap-2"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        Generate Options
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column - Stats & Badges */}
                <div className="space-y-6">
                    <div className="card p-6 space-y-4">
                        <h3 className="font-bold flex items-center gap-2">
                            <Shield className="w-5 h-5 text-primary" />
                            Account Status
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm p-3 rounded-xl bg-secondary/30">
                                <span className="text-muted-foreground">Role</span>
                                <span className="font-bold capitalize">{user?.role}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm p-3 rounded-xl bg-secondary/30">
                                <span className="text-muted-foreground">Joined</span>
                                <span className="font-bold">{new Date(user?.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm p-3 rounded-xl bg-secondary/30">
                                <span className="text-muted-foreground">Status</span>
                                <span className="text-green-500 font-bold flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                    Active
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="card p-6 space-y-4">
                        <h3 className="font-bold flex items-center gap-2">
                            <Award className="w-5 h-5 text-yellow-500" />
                            Achievements
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50 flex flex-col items-center text-center gap-2 opacity-50">
                                <Globe className="w-6 h-6" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Early Adopter</span>
                            </div>
                            <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50 flex flex-col items-center text-center gap-2 opacity-50">
                                <Check className="w-6 h-6" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Verified</span>
                            </div>
                        </div>
                        <p className="text-[10px] text-center text-muted-foreground italic">More achievements coming soon!</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
