'use client';

import { useState } from 'react';
import { Container } from '@/components/shared/Container';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Check, ChevronDown, Sparkles } from 'lucide-react';
import { FadeUp, StaggerChildren, HoverLift } from '@/components/animations';

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annually'>('monthly');

  const plans = [
    {
      name: 'Free Plan',
      price: { monthly: '₹0', annually: '₹0' },
      desc: 'Get your property listed and start managing basic guest entry.',
      features: [
        '1 Building listing',
        'Up to 50 Beds manager',
        'Basic Tenant logs',
        'Manual receipt uploads',
        'Community forum support',
      ],
      cta: 'Get Started Free',
      popular: false,
    },
    {
      name: 'Starter Plan',
      price: { monthly: '₹999', annually: '₹799' },
      desc: 'Ideal for regional operators with expanding portfolios.',
      features: [
        'Up to 3 Buildings',
        'Up to 300 Beds manager',
        'Automatic WhatsApp & SMS reminders',
        'Digital KYC document vaults',
        'Daily expense tracking ledger',
        'Standard email support',
      ],
      cta: 'Start 14-Day Free Trial',
      popular: true,
    },
    {
      name: 'Pro Plan',
      price: { monthly: '₹2,999', annually: '₹2,399' },
      desc: 'For professional co-living chains requiring full automation.',
      features: [
        'Unlimited Buildings',
        'Unlimited Beds manager',
        'Multi-user manager roles',
        'Staff payroll & attendance calculation',
        'Custom profit & loss reports',
        'Direct API backend logs access',
        '24x7 phone support callback',
      ],
      cta: 'Start Pro Free Trial',
      popular: false,
    },
  ];

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-12">
      <Container>
        {/* Header */}
        <FadeUp className="text-center mb-12">
          <SectionHeading
            eyebrow="Subscription Plans"
            title="Flexible Pricing built for"
            titleHighlight="PG Operators"
            subtitle="Choose a plan that fits your co-living business size. Upgrade or downgrade at any time."
          />

          {/* Billing Switcher */}
          <div className="inline-flex items-center gap-1.5 p-1 bg-white border border-border/80 rounded-xl mt-8">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={[
                'px-4 py-2 rounded-lg text-xs font-bold transition-all',
                billingPeriod === 'monthly' ? 'bg-brand-blue text-white shadow-sm' : 'text-text-muted hover:text-text-dark',
              ].join(' ')}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annually')}
              className={[
                'px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5',
                billingPeriod === 'annually' ? 'bg-brand-blue text-white shadow-sm' : 'text-text-muted hover:text-text-dark',
              ].join(' ')}
            >
              Annually
              <span className="bg-brand-green/20 text-brand-green px-1.5 py-0.5 rounded text-[0.6rem] font-bold">
                Save 20%
              </span>
            </button>
          </div>
        </FadeUp>

        {/* Pricing Cards Grid */}
        <StaggerChildren className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto mb-20">
          {plans.map((plan, i) => (
            <HoverLift key={i} className="h-full">
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
                  <p className="text-xs text-text-muted mt-1 font-semibold leading-relaxed">{plan.desc}</p>
                </div>

                <div className="flex items-baseline gap-1.5 mb-6 pb-6 border-b border-border/60">
                  <span className="text-3xl sm:text-4xl font-heading font-extrabold text-text-dark">
                    {billingPeriod === 'monthly' ? plan.price.monthly : plan.price.annually}
                  </span>
                  <span className="text-xs text-text-muted font-bold">/ month</span>
                </div>

                {/* Plan Features */}
                <ul className="flex-1 space-y-4 mb-8" role="list">
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
                    !plan.popular && 'border border-border/80 hover:border-brand-blue hover:text-brand-blue',
                  ].join(' ')}
                >
                  {plan.cta}
                </Button>
              </div>
            </HoverLift>
          ))}
        </StaggerChildren>
      </Container>
    </div>
  );
}
