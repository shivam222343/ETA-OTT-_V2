import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    CreditCard, Zap, Save, AlertCircle, 
    Check, DollarSign, Calendar, Clock,
    Info, Star, Crown
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../api/axios.config';

export default function PricingTab({ institutionId }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [pricing, setPricing] = useState({
        type: 'one-time',
        amount: 4999
    });

    useEffect(() => {
        fetchPricing();
    }, [institutionId]);

    const fetchPricing = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get(`/institutions/${institutionId}`);
            const inst = response.data.data.institution;
            if (inst.pricing) {
                setPricing({
                    type: inst.pricing.type || 'one-time',
                    amount: inst.pricing.amount || 4999
                });
            }
        } catch (error) {
            console.error('Fetch pricing error:', error);
            toast.error('Failed to load pricing data');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await apiClient.patch(`/institutions/${institutionId}/pricing`, pricing);
            toast.success('Pricing configuration updated successfully!');
        } catch (error) {
            console.error('Save pricing error:', error);
            toast.error(error.response?.data?.message || 'Failed to update pricing');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="py-20 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <p className="text-muted-foreground animate-pulse">Loading pricing configuration...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-xl">
                <div className="p-8 bg-gradient-to-br from-primary/5 to-transparent border-b border-border/50">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                            <DollarSign className="w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight">Membership Pricing</h2>
                            <p className="text-sm text-muted-foreground mt-1 font-medium">
                                Configure how students pay for premium access to your institution
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    {/* Membership Type */}
                    <div className="space-y-4">
                        <label className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Billing Cycle
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                { id: 'one-time', label: 'One-time Purchase', desc: 'Students pay once for lifetime access', icon: Zap },
                                { id: 'monthly', label: 'Monthly Subscription', desc: 'Students pay every month to keep access', icon: Calendar }
                            ].map((type) => (
                                <button
                                    key={type.id}
                                    onClick={() => setPricing({ ...pricing, type: type.id })}
                                    className={`flex items-start gap-4 p-6 rounded-3xl border-2 transition-all text-left group ${
                                        pricing.type === type.id
                                            ? 'border-primary bg-primary/5 ring-4 ring-primary/5'
                                            : 'border-border hover:border-primary/30 bg-transparent'
                                    }`}
                                >
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                                        pricing.type === type.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-secondary text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                                    }`}>
                                        <type.icon className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-base">{type.label}</p>
                                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{type.desc}</p>
                                    </div>
                                    {pricing.type === type.id && (
                                        <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow-lg">
                                            <Check className="w-4 h-4" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Amount Configuration */}
                    <div className="space-y-4">
                        <label className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <CreditCard className="w-4 h-4" />
                            Pricing Amount (INR)
                        </label>
                        <div className="relative group">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                                <span className="text-3xl font-black text-primary">₹</span>
                            </div>
                            <input
                                type="number"
                                value={pricing.amount}
                                onChange={(e) => setPricing({ ...pricing, amount: parseInt(e.target.value) || 0 })}
                                className="w-full h-20 pl-12 pr-8 bg-secondary/30 border-2 border-border focus:border-primary rounded-3xl text-3xl font-black transition-all outline-none"
                                placeholder="0"
                            />
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
                                <span className="text-xs font-black text-muted-foreground uppercase tracking-widest bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border">
                                    {pricing.type === 'monthly' ? 'per month' : 'lifetime'}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-start gap-2 px-2 text-[10px] text-muted-foreground italic">
                            <Info className="w-3 h-3 mt-0.5" />
                            <p>This is the total amount students will see during checkout. All transactions are processed securely via Razorpay.</p>
                        </div>
                    </div>

                    {/* Preview Card */}
                    <div className="pt-4 border-t border-border/50">
                        <div className="bg-secondary/30 rounded-3xl p-6 border border-dashed border-primary/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-xs font-black text-primary uppercase tracking-widest mb-1">Student Preview</h4>
                                    <p className="text-xl font-bold italic">"Join {pricing.type === 'monthly' ? 'monthly' : 'for life'} at ₹{pricing.amount.toLocaleString()}"</p>
                                </div>
                                <div className="flex -space-x-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-8 h-8 rounded-full border-2 border-card bg-secondary flex items-center justify-center overflow-hidden">
                                            <div className="w-full h-full bg-gradient-to-tr from-primary/20 to-blue-500/20 flex items-center justify-center text-[10px] font-bold">
                                                {String.fromCharCode(64 + i)}
                                            </div>
                                        </div>
                                    ))}
                                    <div className="w-8 h-8 rounded-full border-2 border-card bg-primary text-white flex items-center justify-center text-[10px] font-black">
                                        +
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-secondary/10 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground bg-background px-4 py-2 rounded-2xl border border-border shadow-sm">
                        <AlertCircle className="w-4 h-4 text-orange-500" />
                        <span>Changes will reflect immediately for all students.</span>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full sm:w-auto h-14 px-8 bg-primary text-primary-foreground font-black text-sm rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {saving ? (
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                SAVE CONFIGURATION
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Premium Gating Tip */}
            <div className="bg-gradient-to-br from-yellow-500/10 to-transparent p-8 rounded-[2rem] border border-yellow-500/20 space-y-4">
                <div className="flex items-center gap-3">
                    <Crown className="w-6 h-6 text-yellow-500" />
                    <h3 className="font-black text-lg">Premium Access Tip</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    Once you've set your pricing, you can gate specific content (Videos, Notes, etc.) as "Premium" in your course settings. Only students with an active membership will be able to access that content.
                </p>
                <div className="flex flex-wrap gap-4 pt-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 text-yellow-600 rounded-xl text-[10px] font-black border border-yellow-500/20">
                        <Check className="w-3 h-3" />
                        AUTO-GENERATED PREMIUM BADGES
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 text-yellow-600 rounded-xl text-[10px] font-black border border-yellow-500/20">
                        <Check className="w-3 h-3" />
                        UNLIMITED AI CREDITS FOR PROS
                    </div>
                </div>
            </div>
        </div>
    );
}
