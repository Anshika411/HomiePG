'use client';

import { Container } from '@/components/shared/Container';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FadeUp, StaggerChildren, HoverLift, fadeUpVariants } from '@/components/animations';
import { motion } from 'framer-motion';
import { ShieldCheck, Target, Users2, Building } from 'lucide-react';
import { IconWrapper } from '@/components/shared/IconWrapper';

export default function AboutPage() {
  const pillars = [
    {
      icon: <ShieldCheck className="w-5 h-5 text-brand-green" />,
      title: 'Trust & Verification',
      desc: 'Verification levels may differ by listing. When requested, we physically inspect properties to double-check amenities and safety protocols.',
      color: 'green' as const,
    },
    {
      icon: <Target className="w-5 h-5 text-brand-blue" />,
      title: 'Accurate Availability',
      desc: 'No ghost listings. We show room and bed availability information maintained on HomiePG to help prevent double bookings and streamline operations.',
      color: 'blue' as const,
    },
    {
      icon: <Users2 className="w-5 h-5 text-brand-purple" />,
      title: 'Seamless Community',
      desc: 'PG living is about the people. We foster premium living spaces that bring professionals and students together safely.',
      color: 'purple' as const,
    },
  ];

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-12">
      <Container>
        {/* Intro */}
        <FadeUp className="text-center mb-16 max-w-3xl mx-auto">
          <SectionHeading
            eyebrow="Our Vision"
            title="Redefining PG Stay"
            titleHighlight="Across India"
            subtitle="HomiePG is built to bridge the gap between PG property owners and tenants by digitizing bookings, rent collections, and building management."
          />
        </FadeUp>

        {/* Pillars / Values */}
        <StaggerChildren className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-20">
          {pillars.map((p, i) => (
            <motion.div key={i} variants={fadeUpVariants}>
              <HoverLift>
                <Card hover padding="lg" className="h-full border border-border/50 text-center flex flex-col items-center">
                  <IconWrapper size="lg" variant={p.color} className="mb-5 rounded-full">
                    {p.icon}
                  </IconWrapper>
                  <h3 className="font-heading font-bold text-text-dark text-[0.95rem] mb-2">{p.title}</h3>
                  <p className="text-xs text-text-muted font-medium leading-relaxed">{p.desc}</p>
                </Card>
              </HoverLift>
            </motion.div>
          ))}
        </StaggerChildren>
      </Container>
    </div>
  );
}
