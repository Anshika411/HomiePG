'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Building, Users, CreditCard, ClipboardList, ShieldAlert, BarChart3,
  Check, ArrowRight, ShieldCheck, Mail, Phone, User, MessageSquare,
  Sparkles, Layers, Landmark
} from 'lucide-react';
import { Container } from '@/components/shared/Container';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { IconWrapper } from '@/components/shared/IconWrapper';
import { FadeUp, StaggerChildren, HoverLift, fadeUpVariants } from '@/components/animations';

export default function OwnersPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const erpFeatures = [
    {
      icon: <Building className="w-5 h-5 text-brand-blue" />,
      title: 'Property Inventory',
      desc: 'Map buildings, floors, rooms, and individual beds with Vacant, Occupied, and Maintenance statuses.',
      color: 'blue' as const,
    },
    {
      icon: <Users className="w-5 h-5 text-brand-green" />,
      title: 'Occupancy Tracking',
      desc: 'Track resident timelines, expected exit dates, emergency contacts, and remaining stay days.',
      color: 'green' as const,
    },
    {
      icon: <CreditCard className="w-5 h-5 text-brand-purple" />,
      title: 'Rent & Auto Reminders',
      desc: 'Generate automated invoices on the 1st, track receipts, and send dues alerts via SMS & WhatsApp.',
      color: 'purple' as const,
    },
    {
      icon: <ShieldAlert className="w-5 h-5 text-brand-blue" />,
      title: 'Digital KYC Files',
      desc: 'Upload Aadhaar, PAN, and employee IDs to secure storage with approval queues.',
      color: 'blue' as const,
    },
    {
      icon: <ClipboardList className="w-5 h-5 text-[#06B6D4]" />,
      title: 'Staff Salary & Attendance',
      desc: 'Calculate payroll based on attendance grids automatically: payouts = shifts * daily salary.',
      color: 'blue' as const,
    },
    {
      icon: <BarChart3 className="w-5 h-5 text-brand-green" />,
      title: 'P&L Reports Dashboard',
      desc: 'Log operational expenses (electricity, water, repairs) to compute monthly property profits.',
      color: 'green' as const,
    },
  ];

  const plans = [
    {
      name: 'Free Plan',
      price: '₹0',
      period: 'forever',
      desc: 'Perfect for small property operators getting started.',
      features: ['1 Building listing', 'Up to 50 Beds manager', 'Basic Tenant check-ins', 'Community support'],
      buttonText: 'Get Started Free',
      popular: false,
    },
    {
      name: 'Starter Plan',
      price: '₹999',
      period: 'month',
      desc: 'Designed for expanding regional PG businesses.',
      features: ['Up to 3 Buildings', 'Up to 300 Beds manager', 'Auto WhatsApp reminders', 'Digital KYC files', 'Priority Email support'],
      buttonText: 'Start Starter Trial',
      popular: true,
    },
    {
      name: 'Pro Plan',
      price: '₹2,999',
      period: 'month',
      desc: 'For professional operators managing multiple properties.',
      features: ['Unlimited Buildings', 'Unlimited Beds manager', 'Multi-manager access logs', 'Custom P&L analytics', 'Dedicated account executive'],
      buttonText: 'Start Pro Trial',
      popular: false,
    },
  ];

  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      {/* ─── Hero Section ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#EEF4FF] via-[#F5F0FF] to-[#EDFFF5] pt-16 pb-24 md:pt-20 md:pb-32">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#1565FF]/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-[#A855F7]/5 rounded-full blur-[100px] pointer-events-none" />

        <Container>
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <FadeUp>
                <Badge variant="blue" className="mb-4 bg-brand-blue-light text-brand-blue font-bold px-4 py-1.5 text-sm">
                  ✨ The Ultimate PG Operating System
                </Badge>
                <h1 className="sr-only">HomiePG For Owners</h1>
                <h2 className="font-heading font-extrabold text-[2.5rem] sm:text-[3.5rem] leading-[1.1] text-text-dark mb-6 tracking-tight">
                  Manage Occupancy, Rent & Expenses. <br />
                  <span className="text-brand-blue">All In One App.</span>
                </h2>
              </FadeUp>

              <FadeUp delay={0.08}>
                <p className="text-body-lg text-text-muted mb-8 max-w-xl font-medium">
                  Say goodbye to paper ledger books. Automate payments, check digital KYC, calculate staff payroll, and track vacancies dynamically.
                </p>
              </FadeUp>

              <FadeUp delay={0.14}>
                <div className="flex flex-wrap gap-4">
                  <Button variant="primary" size="lg" onClick={() => document.getElementById('demo-section')?.scrollIntoView({ behavior: 'smooth' })}>
                    Request Free Demo <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                  <Button variant="outline" size="lg" onClick={() => document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' })}>
                    View Subscription Plans
                  </Button>
                </div>
              </FadeUp>
            </div>

            <div className="lg:col-span-5 relative flex justify-center">
              <FadeUp delay={0.15} className="relative w-full max-w-[380px]">
                {/* Floating aura */}
                <div className="absolute inset-0 bg-brand-blue/10 rounded-[36px] blur-xl -z-10" />
                {/* Owner Tablet/App Mockup design */}
                <div className="bg-text-dark rounded-[36px] border-[6px] border-slate-700 p-4 shadow-card-hover aspect-[3/4] w-full flex flex-col overflow-hidden text-white">
                  <div className="w-16 h-4 bg-slate-700 rounded-full mx-auto mb-4" />
                  {/* Dashboard Mockup Content */}
                  <div className="flex-1 bg-[#1E293B] rounded-2xl p-4 flex flex-col gap-4 text-xs font-semibold">
                    <div className="flex justify-between items-center pb-3 border-b border-white/5">
                      <span className="text-[0.8rem] font-bold text-white">PGBooker ERP</span>
                      <Badge className="bg-brand-green/20 text-brand-green font-bold">Live</Badge>
                    </div>

                    {/* Dashboard metrics */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                        <div className="text-[0.6rem] text-text-light">OCCUPANCY RATE</div>
                        <div className="text-sm font-bold text-brand-blue mt-1">94%</div>
                      </div>
                      <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                        <div className="text-[0.6rem] text-text-light">ACTIVE BEDS</div>
                        <div className="text-sm font-bold text-brand-green mt-1">142/150</div>
                      </div>
                    </div>

                    {/* List rows */}
                    <div className="flex-1 bg-white/5 rounded-xl p-3 flex flex-col gap-2 border border-white/5 overflow-hidden">
                      <div className="text-[0.65rem] text-text-light uppercase tracking-wider mb-1">Recent Invoices</div>
                      {[
                        { name: 'Amit Kumar', bed: 'Rm 102 - Bed B', amt: '₹7,500', status: 'Paid', color: 'text-brand-green bg-brand-green-light/10' },
                        { name: 'Suhail Khan', bed: 'Rm 204 - Bed A', amt: '₹8,200', status: 'Pending', color: 'text-amber-500 bg-amber-500/10' },
                      ].map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2 rounded-lg bg-white/5 border border-white/5 text-[0.65rem]">
                          <div>
                            <div>{item.name}</div>
                            <div className="text-[0.55rem] text-text-light mt-0.5">{item.bed}</div>
                          </div>
                          <div className="text-right">
                            <div>{item.amt}</div>
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[0.5rem] mt-1 font-bold ${item.color}`}>{item.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </FadeUp>
            </div>
          </div>
        </Container>
      </section>

      {/* ─── Feature Matrix Grid ───────────────────────────────────────── */}
      <section className="section-padding bg-white">
        <Container>
          <FadeUp>
            <SectionHeading
              eyebrow="PG ERP Features"
              title="All-In-One"
              titleHighlight="Operations Suite"
              subtitle="Everything your managers and onsite staff need to control property inventory, verify records, and track accounts."
            />
          </FadeUp>

          <StaggerChildren className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {erpFeatures.map((f, i) => (
              <motion.div key={i} variants={fadeUpVariants}>
                <HoverLift>
                  <Card hover padding="lg" className="h-full border border-border/50">
                    <IconWrapper size="lg" variant={f.color} className="mb-5">
                      {f.icon}
                    </IconWrapper>
                    <h3 className="font-heading font-bold text-text-dark text-base mb-2">{f.title}</h3>
                    <p className="text-caption text-text-muted font-medium leading-relaxed">{f.desc}</p>
                  </Card>
                </HoverLift>
              </motion.div>
            ))}
          </StaggerChildren>
        </Container>
      </section>

      {/* ─── Pricing Section ───────────────────────────────────────────── */}
      <section id="pricing-section" className="section-padding bg-[#F8FAFC] border-t border-border/50">
        <Container>
          <FadeUp>
            <SectionHeading
              eyebrow="Pricing Plans"
              title="Predictable Plans for"
              titleHighlight="Any Scale"
              subtitle="Select a platform pricing plan based on the number of beds and buildings you manage. No hidden commissions."
            />
          </FadeUp>

          <StaggerChildren className="mt-12 grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div key={i} variants={fadeUpVariants} className="h-full">
                <HoverLift className="h-full">
                  <div
                    className={[
                      'h-full flex flex-col rounded-3xl bg-white border p-6 sm:p-8',
                      plan.popular ? 'border-brand-blue shadow-glow relative ring-2 ring-brand-blue/10' : 'border-border/80 shadow-sm',
                    ].join(' ')}
                  >
                    {plan.popular && (
                      <span className="absolute -top-3 right-6 bg-brand-blue text-white px-3 py-1 rounded-full text-[0.65rem] font-bold uppercase tracking-wider">
                        Most Popular
                      </span>
                    )}

                    <div className="mb-5">
                      <h3 className="font-heading font-bold text-text-dark text-lg">{plan.name}</h3>
                      <p className="text-xs text-text-muted mt-1 font-semibold">{plan.desc}</p>
                    </div>

                    <div className="flex items-baseline gap-1.5 mb-6 pb-6 border-b border-border/60">
                      <span className="text-3xl sm:text-4xl font-heading font-extrabold text-text-dark">{plan.price}</span>
                      <span className="text-xs text-text-muted font-bold">/ {plan.period}</span>
                    </div>

                    {/* Plan features */}
                    <ul className="flex-1 space-y-3.5 mb-8" role="list">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs font-semibold text-text-muted">
                          <Check className="w-4 h-4 text-brand-green flex-shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      variant={plan.popular ? 'primary' : 'ghost'}
                      className={[
                        'w-full h-11 text-xs font-bold rounded-xl',
                        !plan.popular && 'border border-border/85 hover:border-brand-blue hover:text-brand-blue',
                      ].join(' ')}
                      onClick={() => document.getElementById('demo-section')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                      {plan.buttonText}
                    </Button>
                  </div>
                </HoverLift>
              </motion.div>
            ))}
          </StaggerChildren>
        </Container>
      </section>

      {/* ─── Lead Capture Demo Form ────────────────────────────────────── */}
      <section id="demo-section" className="section-padding bg-white border-t border-border/50">
        <Container size="sm">
          <FadeUp>
            <div className="bg-bg-light/40 border border-border/70 rounded-[32px] p-6 sm:p-10 shadow-sm">
              <div className="text-center mb-8">
                <Badge variant="purple" className="mb-3 px-3 py-1 font-bold">
                  ⚡ Schedule a walkthrough
                </Badge>
                <h2 className="font-heading font-bold text-2xl sm:text-3xl text-text-dark mb-3">
                  Start Managing Smartly
                </h2>
                <p className="text-caption text-text-muted font-semibold max-w-sm mx-auto">
                  Fill in your details below. Our customer onboarding team will coordinate a complete walkthrough demo of the ERP features.
                </p>
              </div>

              {submitted ? (
                <div className="text-center py-10">
                  <div className="w-12 h-12 rounded-full bg-brand-green-light flex items-center justify-center text-brand-green mx-auto mb-4">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="font-heading font-bold text-text-dark text-lg mb-1">Demo Request Received</h3>
                  <p className="text-caption text-text-muted font-medium">
                    Thank you! Our platform representative will contact you on your registered phone number within 24 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-text-dark mb-1.5 uppercase tracking-wide">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light pointer-events-none" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Ramesh Sharma"
                          className="w-full h-11 pl-9 pr-4 rounded-xl border border-border text-sm text-text-dark placeholder:text-text-light font-medium focus:outline-none focus:ring-2 focus:ring-brand-purple/30 focus:border-brand-purple transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-text-dark mb-1.5 uppercase tracking-wide">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light pointer-events-none" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="ramesh@sharmapg.com"
                          className="w-full h-11 pl-9 pr-4 rounded-xl border border-border text-sm text-text-dark placeholder:text-text-light font-medium focus:outline-none focus:ring-2 focus:ring-brand-purple/30 focus:border-brand-purple transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-text-dark mb-1.5 uppercase tracking-wide">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light pointer-events-none" />
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="98765 43210"
                          className="w-full h-11 pl-9 pr-4 rounded-xl border border-border text-sm text-text-dark placeholder:text-text-light font-medium focus:outline-none focus:ring-2 focus:ring-brand-purple/30 focus:border-brand-purple transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-text-dark mb-1.5 uppercase tracking-wide">PG City</label>
                      <div className="relative">
                        <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light pointer-events-none" />
                        <input
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="e.g. Noida / Gurgaon"
                          className="w-full h-11 pl-9 pr-4 rounded-xl border border-border text-sm text-text-dark placeholder:text-text-light font-medium focus:outline-none focus:ring-2 focus:ring-brand-purple/30 focus:border-brand-purple transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <Button type="submit" variant="primary" className="w-full h-11 bg-brand-purple hover:bg-brand-purple-dark shadow-glow font-bold text-sm">
                    Request Setup Walkthrough
                  </Button>
                </form>
              )}
            </div>
          </FadeUp>
        </Container>
      </section>
    </div>
  );
}
