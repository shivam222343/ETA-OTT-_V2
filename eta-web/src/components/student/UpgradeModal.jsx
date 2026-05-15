import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Check, Zap, Star, ShieldCheck, 
    Crown, Sparkles, Loader2, Rocket,
    Tag
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../api/axios.config';

export default function UpgradeModal({ isOpen, onClose, institutionId, courseId, user }) {
    const [loading, setLoading] = useState(false);
    const [institution, setInstitution] = useState(null);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [validatingCoupon, setValidatingCoupon] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchPricing();
        }
    }, [isOpen, institutionId, courseId]);

    const fetchPricing = async () => {
        setFetchLoading(true);
        try {
            // Even if courseId is provided, we fetch the institution details for pricing
            let id = institutionId;
            if (!id && courseId) {
                const courseRes = await apiClient.get(`/courses/${courseId}`);
                id = courseRes.data.data.course.institutionId._id || courseRes.data.data.course.institutionId;
            }

            if (id) {
                const response = await apiClient.get(`/institutions/${id}`);
                setInstitution(response.data.data.institution);
            }
        } catch (error) {
            console.error('Fetch pricing error:', error);
            toast.error('Failed to load plan details');
        } finally {
            setFetchLoading(false);
        }
    };
    
    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        setValidatingCoupon(true);
        try {
            const response = await apiClient.post('/coupons/validate', {
                code: couponCode,
                courseId: courseId || undefined,
                institutionId: institution?._id || institutionId
            });
            setAppliedCoupon(response.data.data);
            toast.success('Coupon applied successfully!');
        } catch (error) {
            console.error('Coupon validation error:', error);
            toast.error(error.response?.data?.message || 'Invalid coupon code');
            setAppliedCoupon(null);
        } finally {
            setValidatingCoupon(false);
        }
    };

    const handleUpgrade = async () => {
        setLoading(true);
        try {
            const response = await apiClient.post('/payments/create-order', {
                institutionId: institution?._id || institutionId,
                courseId,
                amount: pricingAmount,
                couponCode: appliedCoupon?.code || null
            });

            if (response.data.success) {
                if (response.data.isFree) {
                    // Handle Free Upgrade
                    try {
                        const claimRes = await apiClient.post('/payments/claim-free-membership', {
                            institutionId: institution?._id || institutionId,
                            courseId,
                            couponCode: appliedCoupon?.code
                        });
                        
                        if (claimRes.data.success) {
                            toast.success('Premium activated successfully!');
                            onClose();
                            window.location.reload();
                        }
                    } catch (claimError) {
                        console.error('Free claim error:', claimError);
                        toast.error(claimError.response?.data?.message || 'Failed to claim free membership');
                    }
                    return;
                }

                const { orderId, amount, currency, key } = response.data.data;

                const options = {
                    key: key,
                    amount: amount,
                    currency: currency,
                    name: "ETA-OTT Premium",
                    description: `Upgrade to ${institution?.name || 'Institution'} Premium`,
                    order_id: orderId,
                    handler: async function (response) {
                        try {
                            const verifyRes = await apiClient.post('/payments/verify-payment', {
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                institutionId: institution?._id || institutionId,
                                courseId
                            });

                            if (verifyRes.data.success) {
                                toast.success('Welcome to Premium!');
                                onClose();
                                window.location.reload();
                            }
                        } catch (error) {
                            console.error('Verification error:', error);
                            toast.error('Payment verification failed.');
                        }
                    },
                    prefill: {
                        name: user?.profile?.name || '',
                        email: user?.email || '',
                    },
                    theme: {
                        color: "#D4AF37"
                    },
                    modal: {
                        ondismiss: function() {
                            setLoading(false);
                        }
                    }
                };

                const rzp = new window.Razorpay(options);
                rzp.open();
            }
        } catch (error) {
            console.error('Razorpay init error:', error);
            toast.error('Failed to initialize payment');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const pricingType = institution?.pricing?.type || 'one-time';
    let pricingAmount = institution?.pricing?.amount || 4999;
    let savings = 0;

    if (appliedCoupon) {
        if (appliedCoupon.discountType === 'percentage') {
            savings = pricingAmount * (appliedCoupon.discountValue / 100);
            pricingAmount = pricingAmount - savings;
        } else if (appliedCoupon.discountType === 'fixed') {
            savings = Math.min(pricingAmount, appliedCoupon.discountValue);
            pricingAmount = pricingAmount - savings;
        }
    }

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />
                
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative w-full max-w-sm bg-card border-2 border-yellow-500/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
                >
                    {/* Header */}
                    <div className="p-6 text-center border-b border-yellow-500/10 bg-gradient-to-b from-yellow-500/10 to-transparent">
                        <div className="w-12 h-12 bg-yellow-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <Crown className="w-6 h-6 text-yellow-600" />
                        </div>
                        <h2 className="text-xl font-bold">Premium Membership</h2>
                        <p className="text-xs text-muted-foreground mt-1">Unlock all premium content in {institution?.name || 'this institution'}</p>
                    </div>

                    {/* Features List */}
                    <div className="p-6 space-y-4">
                        {[
                            "Unlimited AI Credits",
                            "Unlock All Premium Content",
                            "High-Speed Processing",
                            "Verified Excellence Certificate"
                        ].map((text, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center text-green-600">
                                    <Check className="w-3 h-3" />
                                </div>
                                <span className="text-sm font-medium">{text}</span>
                            </div>
                        ))}

                        <div className="pt-6 border-t border-border/50">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Plan Cost</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-black text-foreground">₹{pricingAmount.toLocaleString()}</span>
                                        <span className="text-[10px] text-muted-foreground">
                                            {pricingType === 'monthly' ? '/ month' : '/ lifetime'}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-green-500 uppercase">
                                        <ShieldCheck className="w-3 h-3" />
                                        Secure
                                    </div>
                                    <p className="text-[9px] text-muted-foreground mt-0.5">UPI / Cards / Net Banking</p>
                                </div>
                            </div>

                            {/* Coupon Input */}
                            <div className="mb-6 space-y-2">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Have a Coupon?</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                        placeholder="CODE"
                                        className="flex-1 bg-secondary/50 border-none rounded-xl px-4 py-2 text-sm font-bold tracking-widest placeholder:text-muted-foreground/30 focus:ring-1 focus:ring-yellow-500/30 transition-all uppercase"
                                    />
                                    <button 
                                        onClick={handleApplyCoupon}
                                        disabled={validatingCoupon || !couponCode}
                                        className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                                    >
                                        {validatingCoupon ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Apply'}
                                    </button>
                                </div>
                                {appliedCoupon && (
                                    <div className="flex items-center justify-between px-1">
                                        <p className="text-[10px] font-bold text-green-500 uppercase tracking-tighter flex items-center gap-1">
                                            <Tag className="w-3 h-3" />
                                            {appliedCoupon.code} Applied (-₹{savings.toLocaleString()})
                                        </p>
                                        <button onClick={() => {setAppliedCoupon(null); setCouponCode('');}} className="text-[9px] font-bold text-red-500 hover:underline">Remove</button>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleUpgrade}
                                disabled={loading || fetchLoading}
                                className="w-full h-12 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-xl shadow-lg shadow-yellow-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                    <>
                                        UPGRADE NOW
                                        <Zap className="w-4 h-4 fill-current" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 p-1.5 hover:bg-secondary rounded-full text-muted-foreground transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
