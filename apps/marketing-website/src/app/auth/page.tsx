'use client';

import { useState, useTransition, Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, User, Mail, ArrowLeft, Loader2, CheckCircle, AlertCircle, Phone, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { api } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormState {
    error: string | null;
    success: string | null;
}

// ── Auth Form Component ────────────────────────────────────────────────────────

function AuthForm() {
    const router = useRouter();
    const supabase = createClient();

    const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Enter mobile, 2: Enter signup details, 3: Verify OTP
    const [role, setRole] = useState<'tenant' | 'owner'>('tenant');
    const [phone, setPhone] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [verificationToken, setVerificationToken] = useState('');
    const [devOtp, setDevOtp] = useState('');
    const [resendTimer, setResendTimer] = useState(0);
    const [formState, setFormState] = useState<FormState>({ error: null, success: null });
    const [isPending, startTransition] = useTransition();

    const clearState = () => setFormState({ error: null, success: null });

    // Handle resend countdown timer
    useEffect(() => {
        if (resendTimer <= 0) return;
        const interval = setInterval(() => {
            setResendTimer((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [resendTimer]);

    // Handle change of phone number
    const handleChangeNumber = () => {
        setStep(1);
        setOtp('');
        setVerificationToken('');
        clearState();
    };

    // ── Actions ─────────────────────────────────────────────────────────────────

    // Step 1: Check mobile number and proceed
    const handleContinuePhone = async () => {
        clearState();
        if (phone.length !== 10) {
            setFormState({ error: 'Please enter a valid 10-digit mobile number.', success: null });
            return;
        }

        startTransition(async () => {
            const res = await api.post<{ exists: boolean; role?: string }>('/api/auth/check-mobile', {
                mobile: phone,
                role
            });

            if (res.error) {
                setFormState({ error: res.error, success: null });
                return;
            }

            if (res.data?.exists) {
                // User exists -> directly send OTP and go to verification page
                await triggerSendOtp();
            } else {
                // User does not exist -> alert they are registering and show registration form
                setFormState({
                    error: null,
                    success: 'No account found with this number. Please enter your details below to register.'
                });
                setStep(2);
            }
        });
    };

    // Trigger OTP sending API
    const triggerSendOtp = async () => {
        const res = await api.post<{ success: boolean; verification_token: string; dev_otp: string }>('/api/auth/send-otp', {
            mobile: phone,
            role
        });

        if (res.error) {
            setFormState({ error: res.error, success: null });
            return;
        }

        if (res.data?.success) {
            setVerificationToken(res.data.verification_token);
            setDevOtp(res.data.dev_otp);
            setResendTimer(120); // 2 minutes resend cooldown
            setFormState({ error: null, success: 'OTP Sent!' });
            setStep(3);
        }
    };

    // Step 2: Register details & Send OTP
    const handleRegisterDetails = () => {
        clearState();
        if (!name || !email) {
            setFormState({ error: 'Please enter your name and email address to continue.', success: null });
            return;
        }

        // Email format check
        if (!/\S+@\S+\.\S+/.test(email)) {
            setFormState({ error: 'Please enter a valid email address.', success: null });
            return;
        }

        startTransition(async () => {
            await triggerSendOtp();
        });
    };

    // Step 3: Verify OTP code (Triggered automatically on entering 6th digit or manually)
    const triggerVerify = async (otpCode: string) => {
        clearState();
        startTransition(async () => {
            const res = await api.post<{ token: string; user: any; profile: any }>('/api/auth/verify-otp', {
                mobile: phone,
                otp: otpCode,
                verification_token: verificationToken,
                role,
                name,
                email
            });

            if (res.error) {
                setFormState({ error: res.error, success: null });
                return;
            }

            if (res.data?.token) {
                localStorage.setItem('token', res.data.token);
                // Sync session inside Supabase Browser Client
                const { error: sessionError } = await supabase.auth.setSession({
                    access_token: res.data.token,
                    refresh_token: res.data.token
                });

                if (sessionError) {
                    setFormState({ error: `Session sync failed: ${sessionError.message}`, success: null });
                    return;
                }

                setFormState({ error: null, success: 'Authentication successful! Redirecting...' });
                router.push('/');
                router.refresh();
            }
        });
    };

    // Handle OTP input digits
    const handleOtpChange = (val: string) => {
        const cleanVal = val.replace(/\D/g, '').slice(0, 6);
        setOtp(cleanVal);
        if (cleanVal.length === 6) {
            triggerVerify(cleanVal);
        }
    };

    // Submit handler routing depending on step
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (step === 1) handleContinuePhone();
        else if (step === 2) handleRegisterDetails();
        else if (step === 3) triggerVerify(otp);
    };

    return (
        <main className="min-h-screen flex bg-slate-50">
            {/* Left Panel — Premium Branding (hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-[#1E40AF] via-[#2563EB] to-[#4F46E5] text-white relative overflow-hidden">
                {/* Decorative glowing blobs */}
                <div className="absolute top-[-20%] right-[-20%] w-[500px] h-[500px] bg-white/10 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-[-15%] left-[-15%] w-96 h-96 bg-indigo-500/20 rounded-full blur-[90px] pointer-events-none" />

                {/* Header Logo */}
                <Link href="/" className="flex items-center gap-2.5 relative z-10 select-none group">
                    <div className="w-9 h-9 bg-white text-[#2563EB] rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 duration-300">
                        <span className="font-heading font-black text-lg">H</span>
                    </div>
                    <span className="font-heading font-extrabold text-xl tracking-tight">HomiePG</span>
                </Link>

                {/* Premium Copy/Marketing Cards */}
                <div className="relative z-10 space-y-8 max-w-lg my-auto">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-bold shadow-inner">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        India&apos;s Premium Unified Stay Platform
                    </div>
                    <div className="space-y-4">
                        <h2 className="font-heading font-extrabold text-5xl leading-tight">
                            Find your home,<br />
                            <span className="text-blue-200">not just another stay.</span>
                        </h2>
                        <p className="text-blue-100 text-sm leading-relaxed max-w-sm font-medium">
                            Step into the smartest PG system. Zero brokerage, instant location-based checkins, automated digital KYC, and accurate bed occupancy tracking.
                        </p>
                    </div>

                    {/* Trust badging grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
                        {[
                            { icon: ShieldCheck, title: 'Verified Profiles Only', desc: 'Secure database verification' },
                            { icon: Zap, title: 'Instant Mobile Onboarding', desc: 'KYC verified in under 2 minutes' },
                            { icon: Sparkles, title: 'Zero Brokerage Assured', desc: 'Direct owner contact always' },
                            { icon: CheckCircle, title: 'Bed Options Matrix', desc: 'Detailed room and bed availability' }
                        ].map((item) => (
                            <div key={item.title} className="flex gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors duration-300">
                                <item.icon className="w-5 h-5 text-blue-200 flex-shrink-0 mt-0.5" />
                                <div className="space-y-0.5">
                                    <h4 className="text-xs font-bold text-white">{item.title}</h4>
                                    <p className="text-[0.65rem] text-blue-200 font-medium">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <p className="text-white/40 text-xs relative z-10">© {new Date().getFullYear()} HomiePG. All rights reserved.</p>
            </div>

            {/* Right Panel — Interactive Clerk/Stripe Style Form Card */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
                {/* Background decorative accent lines */}
                <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] pointer-events-none" />

                <div className="w-full max-w-md relative z-10">
                    {/* Mobile Branding (Header only on small viewports) */}
                    <Link href="/" className="flex items-center gap-2 mb-10 lg:hidden">
                        <div className="w-8 h-8 bg-[#2563EB] rounded-xl flex items-center justify-center shadow-md">
                            <span className="text-white font-heading font-black text-sm">H</span>
                        </div>
                        <span className="font-heading font-extrabold text-lg text-slate-900">HomiePG</span>
                    </Link>

                    {/* Role Selector Tabs (Unified Tenant / Owner Switcher) */}
                    {step === 1 && (
                        <div className="inline-flex p-1 bg-slate-100 rounded-2xl mb-8 w-full border border-slate-200">
                            <button
                                type="button"
                                onClick={() => setRole('tenant')}
                                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${role === 'tenant'
                                        ? 'bg-white text-[#2563EB] shadow-sm font-extrabold'
                                        : 'text-slate-500 hover:text-slate-800'
                                    }`}
                            >
                                Tenant Login
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole('owner')}
                                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${role === 'owner'
                                        ? 'bg-white text-[#2563EB] shadow-sm font-extrabold'
                                        : 'text-slate-500 hover:text-slate-800'
                                    }`}
                            >
                                Owner / Manager
                            </button>
                        </div>
                    )}

                    {/* Dynamic Headings */}
                    <div className="mb-8">
                        <h1 className="font-heading font-extrabold text-3xl text-slate-900 tracking-tight">
                            {step === 1 && 'Welcome to HomiePG'}
                            {step === 2 && 'Complete Profile'}
                            {step === 3 && 'Verification Code'}
                        </h1>
                        <p className="mt-2 text-sm font-medium text-slate-500">
                            {step === 1 && 'Enter your mobile number to sign in or create an account.'}
                            {step === 2 && 'Fill in your basic details to create your secure stay account.'}
                            {step === 3 && `We have sent a verification code to +91 ${phone}.`}
                        </p>
                    </div>

                    {/* Feedback Alert Banners */}
                    {formState.success && (
                        <div className="mb-6 flex items-start gap-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl px-4 py-3 shadow-sm">
                            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-600" />
                            <p className="text-xs font-semibold leading-relaxed">{formState.success}</p>
                        </div>
                    )}
                    {formState.error && (
                        <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-100 text-red-700 rounded-2xl px-4 py-3 shadow-sm">
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-600" />
                            <p className="text-xs font-semibold leading-relaxed">{formState.error}</p>
                        </div>
                    )}

                    {/* Unified Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Step 1: Mobile Phone input */}
                        {step === 1 && (
                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 mb-2 uppercase tracking-wider">Mobile Number</label>
                                <div className="relative flex rounded-2xl border border-slate-200 overflow-hidden bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-[#2563EB] transition-all duration-200 shadow-sm">
                                    <span className="flex items-center justify-center px-4 bg-slate-50 border-r border-slate-200 text-sm font-bold text-slate-500 select-none">
                                        +91
                                    </span>
                                    <input
                                        type="tel"
                                        pattern="[0-9]{10}"
                                        maxLength={10}
                                        placeholder="9876543210"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                        disabled={isPending}
                                        className="w-full h-13 px-4 outline-none text-sm font-medium text-slate-800 disabled:opacity-60 placeholder:text-slate-400 bg-transparent"
                                        required
                                    />
                                </div>
                                <p className="mt-2 text-xs text-slate-500 font-medium">
                                    Demo: Use <span className="font-semibold text-slate-700">{role === 'owner' ? '9876543210' : '9876543211'}</span> for seeded {role === 'owner' ? 'owner' : 'tenant'}, or any new number to register.
                                </p>
                            </div>
                        )}

                        {/* Step 2: New Register Profile Fields */}
                        {step === 2 && (
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-xs font-extrabold text-slate-700 mb-2 uppercase tracking-wider">Full Name</label>
                                    <div className="relative rounded-2xl border border-slate-200 overflow-hidden bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-[#2563EB] transition-all duration-200 shadow-sm">
                                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                        <input
                                            type="text"
                                            placeholder="Rahul Sharma"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            disabled={isPending}
                                            className="w-full h-13 pl-10 pr-4 outline-none text-sm font-medium text-slate-800 placeholder:text-slate-400 bg-transparent"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-extrabold text-slate-700 mb-2 uppercase tracking-wider">Email Address</label>
                                    <div className="relative rounded-2xl border border-slate-200 overflow-hidden bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-[#2563EB] transition-all duration-200 shadow-sm">
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                        <input
                                            type="email"
                                            placeholder="rahul@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            disabled={isPending}
                                            className="w-full h-13 pl-10 pr-4 outline-none text-sm font-medium text-slate-800 placeholder:text-slate-400 bg-transparent"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: 6-digit OTP entry */}
                        {step === 3 && (
                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 mb-2 uppercase tracking-wider">One-Time Password (OTP)</label>
                                <div className="relative rounded-2xl border border-slate-200 overflow-hidden bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-[#2563EB] transition-all duration-200 shadow-sm mb-4">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                    <input
                                        type="text"
                                        maxLength={6}
                                        placeholder="123456"
                                        value={otp}
                                        onChange={(e) => handleOtpChange(e.target.value)}
                                        disabled={isPending}
                                        className="w-full h-13 pl-10 pr-4 outline-none text-sm font-bold tracking-[0.3em] text-slate-800 placeholder:text-slate-400 bg-transparent"
                                        required
                                    />
                                </div>

                                {/* Dev / Sandbox OTP Banner indicator */}
                                {devOtp && (
                                    <div className="mb-4 text-xs bg-blue-50 border border-blue-100 text-blue-800 rounded-xl px-3 py-2 font-medium flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                        <span>Demo Mode: Use test OTP <strong>{devOtp}</strong></span>
                                    </div>
                                )}

                                <p className="text-xs text-slate-500 font-semibold flex justify-between items-center">
                                    <span>Didn&apos;t receive code?</span>
                                    <button
                                        type="button"
                                        onClick={triggerSendOtp}
                                        disabled={resendTimer > 0 || isPending}
                                        className={`font-bold text-[#2563EB] hover:underline disabled:opacity-60 disabled:hover:no-underline cursor-pointer`}
                                    >
                                        {resendTimer > 0 ? `Resend OTP (${resendTimer}s)` : 'Resend OTP'}
                                    </button>
                                </p>
                            </div>
                        )}

                        {/* Back / Change number links placed before the button */}
                        {step !== 1 && (
                            <div className="flex justify-between items-center text-xs">
                                <button
                                    type="button"
                                    onClick={handleChangeNumber}
                                    className="font-bold text-[#2563EB] hover:underline inline-flex items-center gap-1 cursor-pointer"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" /> Change Phone Number
                                </button>
                            </div>
                        )}

                        {/* Submission Action Button */}
                        <button
                            type="submit"
                            disabled={isPending || (step === 1 && phone.length !== 10)}
                            className="w-full h-13 rounded-2xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-sm transition-all duration-200 shadow-lg hover:shadow-blue-500/10 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer"
                        >
                            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                            {step === 1 && (isPending ? 'Checking details…' : 'Continue')}
                            {step === 2 && (isPending ? 'Sending code…' : 'Send OTP')}
                            {step === 3 && (isPending ? 'Verifying OTP…' : 'Verify & Sign In')}
                        </button>

                    </form>

                </div>
            </div>
        </main>
    );
}

// ── Page Export ───────────────────────────────────────────────────────────────

export default function AuthPage() {
    return (
        <Suspense
            fallback={
                <main className="min-h-screen bg-gradient-to-br from-[#EEF4FF] via-[#F5F0FF] to-[#EDFFF5] flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-brand-blue animate-spin" />
                        <p className="text-xs font-semibold text-text-muted">Loading…</p>
                    </div>
                </main>
            }
        >
            <AuthForm />
        </Suspense>
    );
}