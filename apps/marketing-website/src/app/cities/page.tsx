'use client';

import { Container } from '@/components/shared/Container';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { Card } from '@/components/ui/Card';
import { CITIES } from '@/constants/cities';
import { FadeUp, StaggerChildren, HoverLift, fadeUpVariants } from '@/components/animations';
import { motion } from 'framer-motion';
import { MapPin, ChevronRight, Navigation } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function CitiesPage() {
  const cityImages: Record<string, string> = {
    bangalore: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=500&q=80',
    delhi: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=500&q=80',
    mumbai: 'https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=500&q=80',
    hyderabad: 'https://images.unsplash.com/photo-1561361058-c24cecae35ca?w=500&q=80',
    pune: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=500&q=80',
    chennai: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=500&q=80',
    gurgaon: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=500&q=80',
    noida: 'https://images.unsplash.com/photo-1629125134241-11810199753e?w=500&q=80',
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-12">
      <Container>
        <FadeUp className="text-center mb-12">
          <SectionHeading
            eyebrow="Explore Locations"
            title="Cities We Are"
            titleHighlight="Live In"
            subtitle="Browse verified Paying Guest accommodations across India's largest tech hubs."
          />
        </FadeUp>

        <StaggerChildren className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {CITIES.map((city, i) => (
            <motion.div key={i} variants={fadeUpVariants}>
              <HoverLift>
                <Link
                  href={`/search?city=${city.name}`}
                  className="block bg-white rounded-2xl border border-border/50 p-3 shadow-card hover:shadow-card-hover transition-all"
                  aria-label={`Search stays in ${city.name}`}
                >
                  <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden mb-4 bg-slate-100">
                    <Image
                      src={cityImages[city.slug] ?? cityImages.bangalore}
                      alt={city.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 300px"
                    />
                  </div>

                  <div className="flex items-center justify-between px-1 pb-1">
                    <div>
                      <h3 className="font-heading font-bold text-text-dark text-base">{city.name}</h3>
                      <p className="text-xs text-text-muted mt-1 font-semibold flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-text-light" />
                        {city.state}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2.5 py-1 bg-brand-blue-light text-brand-blue text-[0.65rem] font-bold rounded-lg uppercase tracking-wide">
                        {city.pgCount} Stays
                      </span>
                    </div>
                  </div>
                </Link>
              </HoverLift>
            </motion.div>
          ))}
        </StaggerChildren>
      </Container>
    </div>
  );
}
