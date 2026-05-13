import { useState, useEffect } from 'react';
import { 
    Plus, Trash2, Edit3, Tag, 
    Calendar, Users, Check, X, 
    Search, Filter, Loader2, AlertCircle,
    Percent, BadgeIndianRupee
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../api/axios.config';
import { motion, AnimatePresence } from 'framer-motion';

export default function CouponManager({ courseId }) {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [formData, setFormData] = useState({
        code: '',
        discountType: 'percentage',
        discountValue: '',
        expiryDate: '',
        maxUses: ''
    });

    useEffect(() => {
        if (courseId) {
            fetchCoupons();
        }
    }, [courseId]);

    const fetchCoupons = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get(`/coupons/course/${courseId}`);
            setCoupons(response.data.data.coupons);
        } catch (error) {
            console.error('Fetch coupons error:', error);
            toast.error('Failed to load coupons');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                courseId,
                discountValue: Number(formData.discountValue),
                maxUses: Number(formData.maxUses) || 0,
                expiryDate: formData.expiryDate || null
            };

            if (editingCoupon) {
                await apiClient.patch(`/coupons/${editingCoupon._id}`, payload);
                toast.success('Coupon updated successfully');
            } else {
                await apiClient.post('/coupons/add', payload);
                toast.success('Coupon created successfully');
            }
            
            setShowModal(false);
            setEditingCoupon(null);
            resetForm();
            fetchCoupons();
        } catch (error) {
            console.error('Submit coupon error:', error);
            toast.error(error.response?.data?.message || 'Failed to save coupon');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this coupon?')) return;
        try {
            await apiClient.delete(`/coupons/${id}`);
            toast.success('Coupon deleted');
            fetchCoupons();
        } catch (error) {
            console.error('Delete coupon error:', error);
            toast.error('Failed to delete coupon');
        }
    };

    const handleEdit = (coupon) => {
        setEditingCoupon(coupon);
        setFormData({
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            expiryDate: coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().split('T')[0] : '',
            maxUses: coupon.maxUses || ''
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            code: '',
            discountType: 'percentage',
            discountValue: '',
            expiryDate: '',
            maxUses: ''
        });
    };

    const toggleStatus = async (coupon) => {
        try {
            await apiClient.patch(`/coupons/${coupon._id}`, { isActive: !coupon.isActive });
            fetchCoupons();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary shadow-sm ring-1 ring-primary/20">
                        <Tag className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tight text-foreground italic">COURSE COUPONS</h2>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Manage discounts for this course</p>
                    </div>
                </div>

                <button 
                    onClick={() => {
                        setEditingCoupon(null);
                        resetForm();
                        setShowModal(true);
                    }}
                    className="h-12 px-6 bg-primary text-primary-foreground font-black text-xs rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                >
                    <Plus className="w-4 h-4" />
                    Create Coupon
                </button>
            </div>

            {loading ? (
                <div className="h-64 flex flex-col items-center justify-center gap-4 bg-card/50 border border-dashed border-border rounded-[2rem]">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Syncing Coupons...</p>
                </div>
            ) : coupons.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {coupons.map((coupon) => (
                        <motion.div
                            layout
                            key={coupon._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`group bg-card border border-border rounded-[2rem] p-6 hover:border-primary/50 transition-all shadow-sm hover:shadow-xl relative overflow-hidden ${!coupon.isActive ? 'opacity-60 grayscale' : ''}`}
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl font-black tracking-tighter text-primary italic uppercase">{coupon.code}</span>
                                        <button 
                                            onClick={() => toggleStatus(coupon)}
                                            className={`w-8 h-4 rounded-full transition-colors relative ${coupon.isActive ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                                        >
                                            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${coupon.isActive ? 'right-0.5' : 'left-0.5'}`} />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                        {coupon.discountType === 'percentage' ? <Percent className="w-3 h-3" /> : <BadgeIndianRupee className="w-3 h-3" />}
                                        {coupon.discountValue} {coupon.discountType === 'percentage' ? '%' : 'Flat'} OFF
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(coupon)} className="p-2 hover:bg-secondary rounded-xl text-muted-foreground hover:text-foreground"><Edit3 className="w-4 h-4" /></button>
                                    <button onClick={() => handleDelete(coupon._id)} className="p-2 hover:bg-red-500/10 rounded-xl text-red-500"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-secondary/30 p-3 rounded-2xl space-y-1">
                                    <div className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">
                                        <Users className="w-3 h-3" /> Usage
                                    </div>
                                    <p className="text-sm font-black">{coupon.currentUses} <span className="text-[10px] text-muted-foreground">/ {coupon.maxUses || '∞'}</span></p>
                                </div>
                                <div className="bg-secondary/30 p-3 rounded-2xl space-y-1">
                                    <div className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">
                                        <Calendar className="w-3 h-3" /> Expiry
                                    </div>
                                    <p className="text-sm font-black">{coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString() : 'Never'}</p>
                                </div>
                            </div>

                            <div className="absolute -bottom-6 -right-6 opacity-[0.03] rotate-12 group-hover:scale-110 transition-transform">
                                <Tag className="w-24 h-24" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="h-64 flex flex-col items-center justify-center gap-4 bg-card/50 border border-dashed border-border rounded-[2rem] text-center p-8">
                    <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center text-muted-foreground">
                        <Tag className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                        <h4 className="font-bold">No coupons found</h4>
                        <p className="text-sm text-muted-foreground max-w-xs mx-auto">Create discount codes to help students join your premium memberships.</p>
                    </div>
                    <button 
                        onClick={() => setShowModal(true)}
                        className="h-10 px-6 bg-secondary text-foreground font-black text-[10px] rounded-xl shadow-sm hover:bg-secondary/80 transition-all uppercase tracking-widest mt-4"
                    >
                        Create First Coupon
                    </button>
                </div>
            )}

            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowModal(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative w-full max-w-md bg-card border border-border rounded-[2.5rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-8 space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-2xl font-black tracking-tight italic">
                                        {editingCoupon ? 'EDIT COUPON' : 'NEW COUPON'}
                                    </h3>
                                    <button onClick={() => setShowModal(false)} className="p-2 hover:bg-secondary rounded-full"><X className="w-5 h-5" /></button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Coupon Code</label>
                                        <input 
                                            type="text" 
                                            value={formData.code}
                                            onChange={(e) => setFormData({...formData, code: e.target.value})}
                                            placeholder="E.G. WELCOME50"
                                            className="w-full bg-secondary/50 border-none rounded-2xl px-6 py-4 font-black tracking-widest placeholder:text-muted-foreground/30 focus:ring-2 focus:ring-primary/20 transition-all uppercase"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Type</label>
                                            <select 
                                                value={formData.discountType}
                                                onChange={(e) => setFormData({...formData, discountType: e.target.value})}
                                                className="w-full bg-secondary/50 border-none rounded-2xl px-6 py-4 font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                                            >
                                                <option value="percentage">Percentage (%)</option>
                                                <option value="fixed">Fixed (₹)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Value</label>
                                            <input 
                                                type="number" 
                                                value={formData.discountValue}
                                                onChange={(e) => setFormData({...formData, discountValue: e.target.value})}
                                                placeholder="Amount"
                                                className="w-full bg-secondary/50 border-none rounded-2xl px-6 py-4 font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Expiry (Optional)</label>
                                            <input 
                                                type="date" 
                                                value={formData.expiryDate}
                                                onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                                                className="w-full bg-secondary/50 border-none rounded-2xl px-6 py-4 font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Max Uses (0 = ∞)</label>
                                            <input 
                                                type="number" 
                                                value={formData.maxUses}
                                                onChange={(e) => setFormData({...formData, maxUses: e.target.value})}
                                                placeholder="0"
                                                className="w-full bg-secondary/50 border-none rounded-2xl px-6 py-4 font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <button 
                                        type="submit"
                                        className="w-full bg-primary text-white font-black py-5 rounded-[1.5rem] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4 tracking-widest"
                                    >
                                        {editingCoupon ? 'UPDATE COUPON' : 'CREATE COUPON'}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
