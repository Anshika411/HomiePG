'use client';

import { useState } from 'react';
import { Container } from '@/components/shared/Container';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FadeUp } from '@/components/animations';
import { Mail, Phone, MapPin, CheckCircle } from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-12">
      <Container>
        <FadeUp className="text-center mb-12">
          <SectionHeading
            eyebrow="Get In Touch"
            title="Have Questions? Contact Our"
            titleHighlight="Support Team"
            subtitle="Need help booking a room or setting up the property ERP dashboard? We are here to help."
          />
        </FadeUp>

        <div className="grid lg:grid-cols-12 gap-8 max-w-5xl mx-auto items-start">
          {/* Info cards */}
          <div className="lg:col-span-5 space-y-4">
            <Card padding="md" className="border border-border/50 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand-blue-light text-brand-blue flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-text-dark text-sm">Email Address</h4>
                <p className="text-xs text-text-muted mt-1 font-semibold">support@homiepg.com</p>
              </div>
            </Card>

            <Card padding="md" className="border border-border/50 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand-green-light text-brand-green-dark flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-text-dark text-sm">Phone Hotline</h4>
                <p className="text-xs text-text-muted mt-1 font-semibold">+91 98765 43210</p>
              </div>
            </Card>

            <Card padding="md" className="border border-border/50 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand-purple-light text-brand-purple-dark flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-text-dark text-sm">Headquarters</h4>
                <p className="text-xs text-text-muted mt-1 font-semibold">Electronic City Phase 1, Bangalore, KA</p>
              </div>
            </Card>
          </div>

          {/* Form */}
          <div className="lg:col-span-7">
            <Card padding="lg" className="border border-border/50 bg-white">
              {submitted ? (
                <div className="text-center py-10">
                  <div className="w-12 h-12 rounded-full bg-brand-green-light text-brand-green flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h3 className="font-heading font-bold text-text-dark text-lg mb-1">Inquiry Submitted</h3>
                  <p className="text-caption text-text-muted font-medium">
                    Thank you! Our PG coordination desk will review your inquiry and get back to you shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-text-dark mb-1.5 uppercase tracking-wide">Your Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Suhas Patel"
                      className="w-full h-11 px-4 rounded-xl border border-border text-sm text-text-dark placeholder:text-text-light font-medium focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-dark mb-1.5 uppercase tracking-wide">Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="suhas@gmail.com"
                      className="w-full h-11 px-4 rounded-xl border border-border text-sm text-text-dark placeholder:text-text-light font-medium focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-dark mb-1.5 uppercase tracking-wide">Your Message</label>
                    <textarea
                      required
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Ask about room bookings, setup, or subscriptions..."
                      className="w-full p-4 rounded-xl border border-border text-sm text-text-dark placeholder:text-text-light font-medium focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-all resize-none"
                    />
                  </div>

                  <Button type="submit" variant="primary" className="w-full h-11 font-bold text-sm">
                    Submit Inquiry Message
                  </Button>
                </form>
              )}
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
}
