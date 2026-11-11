'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, MapPin, Calendar, Users, Shield, Clock, Star,
  CheckCircle, ChevronRight, Building, ShieldCheck, ArrowRight,
  Play, Quote, Wifi, Zap, UserCheck, Heart, Sparkles, Filter,
  Share2, ShieldAlert, ChevronDown
} from 'lucide-react';
import { FadeUp, StaggerChildren, HoverLift, fadeUpVariants } from '@/components/animations';
import { Container } from '@/components/shared/Container';
import GoogleMap from '@/components/shared/GoogleMap';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { IconWrapper } from '@/components/shared/IconWrapper';
import { CITIES, GENDER_OPTIONS } from '@/constants/cities';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const [city, setCity] = useState('Bangalore');
  const [locality, setLocality] = useState('');
  const [gender, setGender] = useState('');
  const [featuredTab, setFeaturedTab] = useState('Trending');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [genderDropdownOpen, setGenderDropdownOpen] = useState(false);

  const cityDropdownRef = useRef<HTMLDivElement>(null);
  const genderDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleLocationChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setCity(customEvent.detail);
      }
    };

    const saved = localStorage.getItem('homiepg-selected-city');
    if (saved) {
      setCity(saved);
    }

    window.addEventListener('homiepg-location-changed', handleLocationChange);
    return () => {
      window.removeEventListener('homiepg-location-changed', handleLocationChange);
    };
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target as Node)) {
        setCityDropdownOpen(false);
      }
      if (genderDropdownRef.current && !genderDropdownRef.current.contains(e.target as Node)) {
        setGenderDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Exact mock data matching the verified co-living properties layout in pgdekho screenshots
  const popularPGs = [
    {
      id: 'pg-1',
      name: 'Haven Stays PG For Gents',
      ownerName: 'Haven Co-living',
      area: 'Chikkasandra, Jalahalli West, Bengaluru',
      gender: 'Boys',
      rating: 4.6,
      reviews: 142,
      priceSingle: '₹13,000',
      priceDouble: '₹9,000',
      mainImage: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=500&q=80',
      thumbs: [
        'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=150&q=80',
        'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=150&q=80',
        'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=150&q=80',
      ],
      features: ['Fully Furnished', 'Meals Included', 'High Security', 'WiFi'],
      grids: ['Boys', 'Furnished', 'Parking', 'Laundry', 'AC'],
      isPremium: false,
      isBudget: false,
    },
    {
      id: 'pg-2',
      name: 'Innclave Boys PG Residence',
      ownerName: 'Innclave Group',
      area: 'Koramangala 4th Block, Bengaluru',
      gender: 'Boys',
      rating: 4.8,
      reviews: 89,
      priceSingle: '₹12,000',
      priceDouble: '₹8,500',
      mainImage: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=500&q=80',
      thumbs: [
        'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=150&q=80',
        'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=150&q=80',
        'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=150&q=80',
      ],
      features: ['Fully Furnished', 'Meals Included', 'CCTV Security', 'WiFi'],
      grids: ['Boys', 'Furnished', 'Parking', 'Laundry', 'AC'],
      isPremium: false,
      isBudget: false,
    },
    {
      id: 'pg-3',
      name: 'Sree Nilaya Girls PG Stay',
      ownerName: 'Sree Nilaya Properties',
      area: 'Sector 4, HSR Layout, Bengaluru',
      gender: 'Girls',
      rating: 4.7,
      reviews: 72,
      priceSingle: '₹14,000',
      priceDouble: '₹9,500',
      mainImage: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=500&q=80',
      thumbs: [
        'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=150&q=80',
        'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=150&q=80',
        'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=150&q=80',
      ],
      features: ['Meals Included', 'High Speed Wifi', '24/7 Power Backup', 'Biometric Entry'],
      grids: ['Girls', 'Furnished', 'Food', 'AC', 'Power Backup'],
      isPremium: false,
      isBudget: false,
    },
    {
      id: 'pg-4',
      name: 'Stanza Living Tokyo House',
      ownerName: 'Stanza Living',
      area: 'Phase 1, Electronic City, Bengaluru',
      gender: 'Co-Living',
      rating: 4.9,
      reviews: 215,
      priceSingle: '₹18,500',
      priceDouble: '₹12,000',
      mainImage: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=500&q=80',
      thumbs: [
        'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=150&q=80',
        'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=150&q=80',
        'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=150&q=80',
      ],
      features: ['Premium Dining', 'Gaming Zone', 'Gym Access', 'Housekeeping'],
      grids: ['Co-Living', 'Luxury', 'Gym', 'Meals', 'WiFi'],
      isPremium: true,
      isBudget: false,
    },
    {
      id: 'pg-5',
      name: 'Classic Girls Hostel & PG',
      ownerName: 'Classic Accommodations',
      area: 'Mathikere near MSRIT, Bengaluru',
      gender: 'Girls',
      rating: 4.3,
      reviews: 56,
      priceSingle: '₹8,000',
      priceDouble: '₹5,500',
      mainImage: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=500&q=80',
      thumbs: [
        'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=150&q=80',
        'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=150&q=80',
        'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=150&q=80',
      ],
      features: ['Homely Food', '24/7 Water Supply', 'WiFi', 'Laundry Services'],
      grids: ['Girls', 'Semi-Furnished', 'CCTV', 'WiFi', 'Food'],
      isPremium: false,
      isBudget: true,
    },
    {
      id: 'pg-6',
      name: 'Metro Nest Boys PG Stay',
      ownerName: 'Metro Nest Co.',
      area: 'Metro Corridor, Vijayanagar, Bengaluru',
      gender: 'Boys',
      rating: 4.2,
      reviews: 48,
      priceSingle: '₹7,500',
      priceDouble: '₹4,800',
      mainImage: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=500&q=80',
      thumbs: [
        'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=150&q=80',
        'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=150&q=80',
        'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=150&q=80',
      ],
      features: ['Near Metro Station', 'Attached Washroom', 'High Security', 'WiFi'],
      grids: ['Boys', 'Furnished', 'Near Metro', 'WiFi', 'CCTV'],
      isPremium: false,
      isBudget: true,
    },
  ];

  const filteredPGs = popularPGs.filter((pg) => {
    if (featuredTab === 'Girls PG') return pg.gender === 'Girls';
    if (featuredTab === 'Boys PG') return pg.gender === 'Boys';
    if (featuredTab === 'Co-Living PG') return pg.gender === 'Co-Living';
    if (featuredTab === 'Premium') return pg.isPremium;
    if (featuredTab === 'Budget') return pg.isBudget;
    // Default to Trending: show high rated
    return pg.rating >= 4.5;
  });

  return (
    <div className="bg-bg-light/40 min-h-screen">
      {/* ─── Hero Section ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#EEF4FF] via-[#F5F0FF] to-[#EDFFF5] pt-12 pb-24 md:pt-16 md:pb-32">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-blue/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-brand-purple/5 rounded-full blur-[100px] pointer-events-none" />

        <Container className="relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center mb-12">
            {/* Left Column: Headline & copy */}
            <div className="lg:col-span-7">
              <FadeUp>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-purple/10 border border-brand-purple/20 text-xs font-bold text-brand-purple mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-purple animate-pulse" />
                  Trusted by 1L+ users across India
                </div>
                <h1 className="font-heading font-extrabold text-[3rem] sm:text-[4rem] lg:text-[4.2rem] leading-[1.08] text-text-dark tracking-tight mb-4">
                  Discover Your <br />
                  <span className="text-brand-blue">Next Home Effortlessly</span>
                </h1>
                <p className="text-body-lg text-text-muted mb-8 max-w-xl font-semibold">
                  Search verified PGs with zero brokerage.
                </p>
              </FadeUp>
            </div>

            {/* Right Column: Dynamic overlapping photos */}
            <div className="lg:col-span-5 relative flex justify-center lg:justify-end">
              <FadeUp delay={0.15} className="relative w-full max-w-[360px] h-72">
                <div className="absolute right-0 top-0 w-60 h-44 rounded-3xl overflow-hidden border-4 border-white shadow-card-hover z-10">
                  <Image
                    src="https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=400&q=80"
                    alt="Premium co-living PG room stay"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="absolute left-0 bottom-0 w-60 h-44 rounded-3xl overflow-hidden border-4 border-white shadow-card-hover z-0">
                  <Image
                    src="https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&q=80"
                    alt="Co-living bedroom hostel"
                    fill
                    className="object-cover"
                  />
                </div>
              </FadeUp>
            </div>
          </div>

          {/* ─── Search Widget (pgdekho.com UI Style) ────────────────────── */}
          <FadeUp delay={0.25}>
            <div className="bg-white rounded-3xl border border-border/80 shadow-card-hover p-4 sm:p-5 max-w-3xl mx-auto z-20 relative">
              {/* Input Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                {/* Select City */}
                <div className="md:col-span-3 text-left relative" ref={cityDropdownRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setCityDropdownOpen(!cityDropdownOpen);
                      setGenderDropdownOpen(false);
                    }}
                    className="w-full h-12 pl-10 pr-10 rounded-xl border border-border text-xs font-bold text-text-dark bg-bg-light/20 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue flex items-center justify-between cursor-pointer transition-all duration-200"
                  >
                    <span className="truncate">{city}</span>
                    <ChevronDown className={cn("w-3.5 h-3.5 text-text-muted transition-transform duration-200 flex-shrink-0", cityDropdownOpen && "rotate-180")} />
                  </button>

                  <AnimatePresence>
                    {cityDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="absolute left-0 top-full mt-2 w-full min-w-[200px] bg-white rounded-2xl border border-border shadow-card-hover z-[110] overflow-hidden p-2"
                      >
                        <div className="max-h-60 overflow-y-auto space-y-0.5">
                          {(() => {
                            const cityOptions = [...CITIES];
                            const isCitySupported = CITIES.some(
                              (c) => c.name.toLowerCase() === city.toLowerCase()
                            );
                            if (!isCitySupported && city) {
                              cityOptions.push({
                                name: city,
                                slug: city.toLowerCase(),
                                state: '',
                                pgCount: '0 Stays',
                                image: ''
                              });
                            }
                            return cityOptions.map((c) => (
                              <button
                                key={c.slug}
                                type="button"
                                onClick={() => {
                                  setCity(c.name);
                                  setCityDropdownOpen(false);
                                }}
                                className={cn(
                                  "w-full block px-3 py-2.5 text-xs text-text-dark hover:bg-brand-blue-light hover:text-brand-blue rounded-xl transition-colors text-left font-medium",
                                  city === c.name && "text-brand-blue bg-brand-blue-light font-semibold"
                                )}
                              >
                                {c.name}
                              </button>
                            ));
                          })()}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-blue pointer-events-none" />
                </div>

                {/* Locality Input */}
                <div className="md:col-span-4 text-left">
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-blue pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search Location"
                      value={locality}
                      onChange={(e) => setLocality(e.target.value)}
                      className="w-full h-12 pl-10 pr-4 rounded-xl border border-border text-xs font-bold text-text-dark placeholder:text-text-light bg-bg-light/20 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                    />
                  </div>
                </div>

                {/* Preferred Gender */}
                <div className="md:col-span-3 text-left relative" ref={genderDropdownRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setGenderDropdownOpen(!genderDropdownOpen);
                      setCityDropdownOpen(false);
                    }}
                    className="w-full h-12 pl-10 pr-10 rounded-xl border border-border text-xs font-bold text-text-dark bg-bg-light/20 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue flex items-center justify-between cursor-pointer transition-all duration-200"
                  >
                    <span className="truncate">
                      {gender === 'Male' ? 'Boys' : gender === 'Female' ? 'Girls' : gender === 'Co-Living' ? 'Co-Living' : 'Gender'}
                    </span>
                    <ChevronDown className={cn("w-3.5 h-3.5 text-text-muted transition-transform duration-200 flex-shrink-0", genderDropdownOpen && "rotate-180")} />
                  </button>

                  <AnimatePresence>
                    {genderDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="absolute left-0 top-full mt-2 w-full min-w-[180px] bg-white rounded-2xl border border-border shadow-card-hover z-[110] overflow-hidden p-2"
                      >
                        <div className="space-y-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              setGender('');
                              setGenderDropdownOpen(false);
                            }}
                            className={cn(
                              "w-full block px-3 py-2.5 text-xs text-text-dark hover:bg-brand-blue-light hover:text-brand-blue rounded-xl transition-colors text-left font-medium",
                              gender === '' && "text-brand-blue bg-brand-blue-light font-semibold"
                            )}
                          >
                            Gender
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setGender('Male');
                              setGenderDropdownOpen(false);
                            }}
                            className={cn(
                              "w-full block px-3 py-2.5 text-xs text-text-dark hover:bg-brand-blue-light hover:text-brand-blue rounded-xl transition-colors text-left font-medium",
                              gender === 'Male' && "text-brand-blue bg-brand-blue-light font-semibold"
                            )}
                          >
                            Boys
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setGender('Female');
                              setGenderDropdownOpen(false);
                            }}
                            className={cn(
                              "w-full block px-3 py-2.5 text-xs text-text-dark hover:bg-brand-blue-light hover:text-brand-blue rounded-xl transition-colors text-left font-medium",
                              gender === 'Female' && "text-brand-blue bg-brand-blue-light font-semibold"
                            )}
                          >
                            Girls
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setGender('Co-Living');
                              setGenderDropdownOpen(false);
                            }}
                            className={cn(
                              "w-full block px-3 py-2.5 text-xs text-text-dark hover:bg-brand-blue-light hover:text-brand-blue rounded-xl transition-colors text-left font-medium",
                              gender === 'Co-Living' && "text-brand-blue bg-brand-blue-light font-semibold"
                            )}
                          >
                            Co-Living PG
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-blue pointer-events-none" />
                </div>

                {/* Search Button */}
                <div className="md:col-span-2">
                  <Link
                    href={`/search?city=${city}&gender=${gender}&locality=${locality}`}
                    className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-blue hover:bg-brand-blue-dark text-white font-bold text-xs transition-all shadow-glow hover:shadow-glow hover:-translate-y-0.5"
                  >
                    <Search className="w-4 h-4" />
                    Search
                  </Link>
                </div>
              </div>
            </div>
          </FadeUp>

          {/* Quick Statistics below search */}
          <FadeUp delay={0.3}>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 mt-10 text-center font-heading">
              {[
                { value: '50K+', label: 'Listings' },
                { value: '200+', label: 'Cities' },
                { value: '1L+', label: 'Users' },
                { value: '0₹', label: 'Brokerage' },
              ].map((stat, idx) => (
                <div key={idx}>
                  <div className="text-2xl font-extrabold text-brand-blue">{stat.value}</div>
                  <div className="text-[0.65rem] font-bold text-text-muted uppercase tracking-wider mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </FadeUp>
        </Container>
      </section>

      {/* ─── Categories Section (Large Image Cards) ──────────────────── */}
      <section className="section-padding bg-white">
        <Container>
          <FadeUp>
            <div className="text-left mb-8">
              <span className="text-xs font-bold text-brand-blue uppercase tracking-wider">PAYING GUEST</span>
              <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-text-dark mt-1">
                Find PGs Based on Your Need
              </h2>
              <p className="text-caption text-text-muted font-semibold mt-1">
                Browse by category and discover the perfect accommodation for you.
              </p>
            </div>
          </FadeUp>

          <StaggerChildren className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'PGs For Boys', img: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=500&q=80', href: '/search?gender=Male' },
              { title: 'PGs For Girls', img: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=500&q=80', href: '/search?gender=Female' },
              { title: 'Co-Living PGs', img: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=500&q=80', href: '/search?gender=Co-Living' },
            ].map((cat, i) => (
              <motion.div key={i} variants={fadeUpVariants}>
                <HoverLift>
                  <Link href={cat.href} className="relative block aspect-[4/3] rounded-3xl overflow-hidden shadow-card group">
                    <Image
                      src={cat.img}
                      alt={cat.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-slow"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-text-dark/85 via-text-dark/10 to-transparent" />
                    <div className="absolute bottom-5 left-5 right-5 flex justify-between items-center text-white">
                      <span className="font-heading font-extrabold text-[0.95rem]">{cat.title}</span>
                      <div className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center transition-colors">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </Link>
                </HoverLift>
              </motion.div>
            ))}
          </StaggerChildren>
        </Container>
      </section>

      {/* ─── Lifestyle & Amenity Categories Grid ────────────────────── */}
      <section className="section-padding bg-bg-light/10 border-t border-border/50">
        <Container>
          <FadeUp>
            <div className="text-left mb-8">
              <span className="text-xs font-bold text-brand-purple uppercase tracking-wider">BROWSE BY LIFESTYLE</span>
              <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-text-dark mt-1">
                Popular Categories
              </h2>
              <p className="text-caption text-text-muted font-semibold mt-1">
                Find accommodations tailored to your specific daily routine and needs.
              </p>
            </div>
          </FadeUp>

          <StaggerChildren className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                title: 'Working Professionals',
                desc: 'Located near major tech hubs and business districts. High-speed WiFi and study desks included.',
                icon: <Building className="w-5 h-5 text-brand-blue" />,
                badge: 'WiFi & Desk',
                href: '/search?professionals=true',
                color: 'blue' as const,
              },
              {
                title: 'Students Special',
                desc: 'Affordable stays located near top universities and colleges. Daily meals and laundry services included.',
                icon: <Users className="w-5 h-5 text-brand-purple" />,
                badge: 'Food Included',
                href: '/search?students=true',
                color: 'purple' as const,
              },
              {
                title: 'Luxury Suites',
                desc: 'AC single occupancy rooms with modern interiors, gym access, gaming lounge, and regular housekeeping.',
                icon: <Sparkles className="w-5 h-5 text-amber-500" />,
                badge: 'Premium Stay',
                href: '/search?budget=premium',
                color: 'purple' as const,
              },
              {
                title: 'Near Metro Station',
                desc: 'Save travel time and costs. Stays located within 500m of metro stations and transit corridors.',
                icon: <MapPin className="w-5 h-5 text-emerald-500" />,
                badge: 'Quick Commute',
                href: '/search?metro=true',
                color: 'green' as const,
              },
              {
                title: 'With Home-Style Food',
                desc: 'Freshly prepared breakfast, lunch, and dinner served daily. Clean and hygienic kitchen standards.',
                icon: <CheckCircle className="w-5 h-5 text-red-500" />,
                badge: '3 Meals Daily',
                href: '/search?food=true',
                color: 'danger' as const,
              },
              {
                title: 'Fully AC Rooms',
                desc: 'Comfortable living with dedicated split AC units and 100% backup generator power grids.',
                icon: <Zap className="w-5 h-5 text-brand-blue" />,
                badge: 'AC Included',
                href: '/search?ac=true',
                color: 'blue' as const,
              },
            ].map((item, idx) => (
              <motion.div key={idx} variants={fadeUpVariants}>
                <HoverLift className="h-full">
                  <Card className="h-full border border-border/50 bg-white hover:border-brand-blue/30 shadow-sm p-6 rounded-3xl flex flex-col justify-between transition-colors">
                    <div>
                      <div className="w-10 h-10 rounded-2xl bg-bg-light flex items-center justify-center mb-5">
                        {item.icon}
                      </div>
                      <h3 className="font-heading font-extrabold text-text-dark text-base mb-2">
                        {item.title}
                      </h3>
                      <p className="text-caption text-text-muted leading-relaxed font-medium mb-6">
                        {item.desc}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-border-light">
                      <Badge variant={item.color} className="font-bold">{item.badge}</Badge>
                      <Link
                        href={item.href}
                        className="text-xs font-bold text-brand-blue hover:text-brand-blue-dark flex items-center gap-1 transition-colors"
                      >
                        Explore <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </Card>
                </HoverLift>
              </motion.div>
            ))}
          </StaggerChildren>
        </Container>
      </section>

      {/* ─── Handpicked Collections (Asymmetrical Grid) ─────────────── */}
      <section className="section-padding bg-bg-light/20 border-t border-border/50">
        <Container>
          <FadeUp>
            <div className="text-left mb-8">
              <span className="text-xs font-bold text-brand-purple uppercase tracking-wider">EXPLORE OUR</span>
              <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-text-dark mt-1">
                Handpicked Collections
              </h2>
              <p className="text-caption text-text-muted font-semibold mt-1">
                Curated picks for every lifestyle and budget.
              </p>
            </div>
          </FadeUp>

          <StaggerChildren className="grid lg:grid-cols-12 gap-6 max-w-5xl mx-auto">
            {/* Large Card on Left */}
            <motion.div variants={fadeUpVariants} className="lg:col-span-7">
              <HoverLift>
                <Link
                  href="/search?budget=true"
                  className="relative block aspect-[16/10] w-full rounded-3xl overflow-hidden shadow-sm group"
                >
                  <Image
                    src="https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&q=80"
                    alt="Budget co-living room"
                    fill
                    className="object-cover group-hover:scale-102 transition-transform duration-slow"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-text-dark/80 via-transparent to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5 flex justify-between items-center text-white">
                    <span className="font-heading font-extrabold text-[0.95rem]">Budget Friendly</span>
                    <Badge variant="green" className="bg-brand-green text-white font-bold">Best Value</Badge>
                  </div>
                </Link>
              </HoverLift>
            </motion.div>

            {/* Small Cards Column on Right */}
            <div className="lg:col-span-5 grid grid-cols-1 gap-6">
              {[
                { title: 'Wifi Included', img: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&q=80', tag: 'High Speed', color: 'blue' as const, query: 'wifi=true' },
                { title: 'Single Bed', img: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=400&q=80', tag: 'Private Room', color: 'purple' as const, query: 'sharing=single' },
              ].map((item, idx) => (
                <motion.div key={idx} variants={fadeUpVariants}>
                  <HoverLift>
                    <Link
                      href={`/search?${item.query}`}
                      className="relative block aspect-[16/8] rounded-3xl overflow-hidden shadow-sm group"
                    >
                      <Image
                        src={item.img}
                        alt={item.title}
                        fill
                        className="object-cover group-hover:scale-102 transition-transform duration-slow"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-text-dark/80 via-transparent to-transparent" />
                      <div className="absolute bottom-5 left-5 right-5 flex justify-between items-center text-white">
                        <span className="font-heading font-extrabold text-[0.95rem]">{item.title}</span>
                        <Badge variant={item.color} className="font-bold">{item.tag}</Badge>
                      </div>
                    </Link>
                  </HoverLift>
                </motion.div>
              ))}
            </div>
          </StaggerChildren>
        </Container>
      </section>

      {/* ─── Featured & Trending PGs (Dynamic Filter Tabs) ────────────── */}
      <section className="section-padding bg-white border-t border-border/50">
        <Container>
          <FadeUp>
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
              <div className="text-left">
                <span className="text-xs font-bold text-brand-blue uppercase tracking-wider">FEATURED HOMES</span>
                <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-text-dark mt-1">
                  Featured & Trending PGs
                </h2>
                <p className="text-caption text-text-muted font-semibold mt-1">
                  Verified premium accommodations curated for you.
                </p>
              </div>
              <Link
                href="/search"
                className="px-5 py-2.5 rounded-full border border-border/80 text-xs font-bold text-text-dark hover:bg-bg-light transition-all flex items-center gap-1.5 self-start md:self-end"
              >
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </FadeUp>

          {/* Interactive Filtering Tabs */}
          <FadeUp>
            <div className="flex flex-wrap gap-2 mb-8 border-b border-border/40 pb-5 justify-start md:justify-center">
              {['Trending', 'Girls PG', 'Boys PG', 'Co-Living PG', 'Premium', 'Budget'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFeaturedTab(tab)}
                  className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    featuredTab === tab
                      ? 'bg-brand-blue text-white shadow-sm'
                      : 'bg-bg-light/80 border border-border/40 hover:bg-bg-light text-text-dark'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </FadeUp>

          {/* Cards Grid */}
          <StaggerChildren className="space-y-6 max-w-4xl mx-auto">
            {filteredPGs.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border rounded-3xl">
                <ShieldAlert className="w-8 h-8 text-text-light mx-auto mb-3" />
                <p className="text-xs font-bold text-text-muted">No PGs found matching this criteria.</p>
              </div>
            ) : (
              filteredPGs.map((pg, idx) => (
                <motion.div key={pg.id} variants={fadeUpVariants}>
                <HoverLift>
                  <Card padding="none" className="overflow-hidden border border-border/60 shadow-sm hover:shadow-md flex flex-col md:flex-row">
                    {/* Left: Thumbnail Layout Grid */}
                    <div className="md:w-5/12 p-3 flex flex-col gap-2 flex-shrink-0 bg-bg-light/10">
                      {/* Main Image */}
                      <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden">
                        <Image
                          src={pg.mainImage}
                          alt={pg.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, 350px"
                        />
                        <div className="absolute top-3 left-3 flex gap-1 z-10">
                          <Badge variant="dark" className="bg-text-dark/85 backdrop-blur-sm px-2.5 py-0.5 font-extrabold text-[0.65rem]">{pg.gender}</Badge>
                        </div>
                        <div className="absolute bottom-3 right-3 bg-text-dark/75 backdrop-blur-md px-2 py-0.5 rounded-lg flex items-center gap-1 text-[0.65rem] font-bold text-white">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          {pg.rating.toFixed(1)}
                        </div>
                      </div>
                      {/* Thumbnail Row */}
                      <div className="grid grid-cols-3 gap-2">
                        {pg.thumbs.map((thumb, tIdx) => (
                          <div key={tIdx} className="relative aspect-[4/3] rounded-lg overflow-hidden border border-border/40">
                            <Image
                              src={thumb}
                              alt="room thumb"
                              fill
                              className="object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right: Property Details Panel */}
                    <div className="md:w-7/12 p-5 flex flex-col justify-between">
                      <div>
                        {/* Title and Favorites */}
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <p className="text-[0.55rem] uppercase tracking-wider font-extrabold text-brand-blue mb-1">
                              By {pg.ownerName}
                            </p>
                            <h3 className="font-heading font-extrabold text-text-dark text-base sm:text-lg leading-snug">
                              {pg.name}
                            </h3>
                            <p className="text-[0.7rem] font-semibold text-text-muted flex items-center gap-1 mt-1.5">
                              <MapPin className="w-3.5 h-3.5 text-text-light flex-shrink-0" />
                              {pg.area}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-text-muted hover:text-red-500 hover:border-red-200 transition-colors">
                              <Heart className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Badges / Amenities tags */}
                        <div className="flex flex-wrap gap-1.5 mt-4">
                          {pg.features.map((feat, fIdx) => (
                            <span key={fIdx} className="px-2.5 py-1 rounded-full bg-brand-blue-light/40 text-brand-blue text-[0.6rem] font-bold">
                              {feat}
                            </span>
                          ))}
                        </div>

                        {/* ERP Attribute grid icons */}
                        <div className="grid grid-cols-5 gap-1 mt-4 text-center border-t border-b border-border-light py-2">
                          {pg.grids.map((gridItem, gIdx) => (
                            <div key={gIdx} className="text-center">
                              <span className="text-[0.65rem] font-bold text-text-dark block">{gridItem}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Pricing block and Book PG CTA */}
                      <div className="mt-5 pt-4 border-t border-border-light flex flex-wrap gap-4 items-center justify-between">
                        {/* Rent Sharing Pricing Slots */}
                        <div className="flex gap-3">
                          <div className="bg-bg-light/50 border border-border/40 px-3 py-1.5 rounded-xl text-center">
                            <span className="text-[0.6rem] text-text-light font-bold block uppercase tracking-wider">Single</span>
                            <span className="text-xs font-extrabold text-text-dark">{pg.priceSingle}</span>
                          </div>
                          <div className="bg-bg-light/50 border border-border/40 px-3 py-1.5 rounded-xl text-center">
                            <span className="text-[0.6rem] text-text-light font-bold block uppercase tracking-wider">Double</span>
                            <span className="text-xs font-extrabold text-text-dark">{pg.priceDouble}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Link
                            href="/search"
                            className="px-4 py-2 border border-border hover:border-brand-blue hover:text-brand-blue rounded-xl text-xs font-bold transition-all"
                          >
                            View Details
                          </Link>
                          <Link
                            href="/search"
                            className="px-5 py-2.5 bg-brand-blue hover:bg-brand-blue-dark text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                          >
                            Book PG
                          </Link>
                        </div>
                      </div>
                    </div>
                  </Card>
                </HoverLift>
              </motion.div>
            ))
          )}
        </StaggerChildren>
        </Container>
      </section>

      {/* ─── How It Works & Why HomiePG (Sprint 3.3) ─────────────────── */}
      {/* 1. How It Works Timeline */}
      <section className="section-padding bg-[#F8FAFC]/50 border-t border-border/40">
        <Container>
          <FadeUp>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-bold text-brand-blue uppercase tracking-wider">PROCESS</span>
              <h2 className="font-heading font-extrabold text-3xl text-text-dark mt-1">
                How It Works
              </h2>
              <p className="text-caption text-text-muted font-semibold mt-1">
                Your journey to a perfect stay is fully digital and takes less than 5 minutes.
              </p>
            </div>
          </FadeUp>

          <StaggerChildren className="grid grid-cols-1 md:grid-cols-4 gap-8 relative max-w-5xl mx-auto">
            {[
              {
                step: '01',
                title: 'Search & Explore',
                desc: 'Filter PGs by city, gender categories, and amenities to find matches near your office or campus.',
                icon: <Search className="w-5 h-5 text-brand-blue" />,
              },
              {
                step: '02',
                title: 'Compare Options',
                desc: 'Review sharing models, check rent pricing layouts, and inspect verified photos & ratings.',
                icon: <Building className="w-5 h-5 text-brand-purple" />,
              },
              {
                step: '03',
                title: 'Book Instantly',
                desc: 'Confirm your choice, book online with zero brokerage, and lock your bed availability.',
                icon: <Calendar className="w-5 h-5 text-emerald-500" />,
              },
              {
                step: '04',
                title: 'Move In Securely',
                desc: 'Complete digital KYC, e-sign your agreement, and walk in to your ready-to-use room.',
                icon: <UserCheck className="w-5 h-5 text-amber-500" />,
              },
            ].map((item, idx) => (
              <motion.div key={idx} variants={fadeUpVariants} className="relative group">
                <HoverLift className="h-full">
                  <Card className="h-full border border-border/40 bg-white shadow-sm p-6 rounded-3xl text-left hover:border-brand-blue/30 relative">
                    <span className="absolute top-6 right-6 text-3xl font-heading font-black text-bg-light group-hover:text-brand-blue/10 transition-colors">
                      {item.step}
                    </span>
                    <div className="w-10 h-10 rounded-2xl bg-bg-light flex items-center justify-center mb-5">
                      {item.icon}
                    </div>
                    <h3 className="font-heading font-extrabold text-text-dark text-base mb-2">
                      {item.title}
                    </h3>
                    <p className="text-caption text-text-muted leading-relaxed font-semibold">
                      {item.desc}
                    </p>
                  </Card>
                </HoverLift>
              </motion.div>
            ))}
          </StaggerChildren>
        </Container>
      </section>

      {/* 2. Why HomiePG - Smart Tech Ecosystem */}
      <section className="section-padding bg-white border-t border-border/50">
        <Container>
          <div className="grid lg:grid-cols-12 gap-12 items-center max-w-5xl mx-auto">
            {/* Left side: Why info */}
            <div className="lg:col-span-5 text-left">
              <FadeUp>
                <span className="text-xs font-bold text-brand-purple uppercase tracking-wider">SMART PLATFORM</span>
                <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-text-dark mt-1 mb-6 leading-tight">
                  Why Choose <br />
                  <span className="text-brand-blue">HomiePG?</span>
                </h2>
                <p className="text-body text-text-muted font-semibold leading-relaxed mb-6">
                  We are not just a listing directory. HomiePG is India's Smart PG Platform, providing verified stays and detailed availability options.
                </p>
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-blue hover:bg-brand-blue-dark text-white font-bold text-xs shadow-sm transition-all"
                >
                  Learn More <ArrowRight className="w-4 h-4" />
                </Link>
              </FadeUp>
            </div>

            {/* Right side: Tech features grid */}
            <div className="lg:col-span-7">
              <StaggerChildren className="grid sm:grid-cols-2 gap-6">
                {[
                  {
                    title: 'AI Vacancy Forecast',
                    desc: 'Demand-based vacancy estimates so you can lock your room in advance during high-demand months.',
                    icon: <Zap className="w-5 h-5 text-brand-blue" />,
                  },
                  {
                    title: 'Room & Bed Availability',
                    desc: 'Availability details logged on HomiePG to view open bed options in each building.',
                    icon: <CheckCircle className="w-5 h-5 text-emerald-500" />,
                  },
                  {
                    title: 'Digital KYC & Agreements',
                    desc: 'Complete tenant verification and e-sign digital PG rent agreements within minutes.',
                    icon: <ShieldCheck className="w-5 h-5 text-brand-purple" />,
                  },
                  {
                    title: 'Verified Owners Only',
                    desc: 'Strict background checks and physical property audits for standard security and safety.',
                    icon: <UserCheck className="w-5 h-5 text-amber-500" />,
                  },
                ].map((item, idx) => (
                  <motion.div key={idx} variants={fadeUpVariants}>
                    <HoverLift>
                      <div className="p-5 rounded-3xl border border-border/40 bg-bg-light/10 text-left">
                        <div className="w-9 h-9 rounded-xl bg-white shadow-sm border border-border/40 flex items-center justify-center mb-4">
                          {item.icon}
                        </div>
                        <h3 className="font-heading font-extrabold text-text-dark text-sm mb-1.5">
                          {item.title}
                        </h3>
                        <p className="text-[0.7rem] text-text-muted leading-relaxed font-semibold">
                          {item.desc}
                        </p>
                      </div>
                    </HoverLift>
                  </motion.div>
                ))}
              </StaggerChildren>
            </div>
          </div>
        </Container>
      </section>

      {/* ─── Interactive Map & PG Comparison Matrix (Sprint 3.5) ────── */}
      <section className="section-padding bg-white border-t border-border/50">
        <Container>
          <FadeUp>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-bold text-brand-blue uppercase tracking-wider">COMPARE & LOCATE</span>
              <h2 className="font-heading font-extrabold text-3xl text-text-dark mt-1">
                Make Informed Decisions
              </h2>
              <p className="text-caption text-text-muted font-semibold mt-1">
                Compare premium properties side-by-side or explore them using our live location map tool.
              </p>
            </div>
          </FadeUp>

          {/* Comparison Matrix Table */}
          <FadeUp>
            <div className="max-w-5xl mx-auto mb-16">
              <h3 className="font-heading font-extrabold text-lg text-text-dark mb-6 text-left flex items-center gap-2">
                <span className="w-2 h-5 rounded bg-brand-blue" /> Stays Comparison Matrix
              </h3>
              
              <div className="overflow-x-auto rounded-3xl border border-border/60 shadow-sm bg-white">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-bg-light border-b border-border/60">
                      <th className="p-4 font-bold text-text-dark">Feature Details</th>
                      <th className="p-4 font-bold text-brand-blue">Haven Stays PG</th>
                      <th className="p-4 font-bold text-brand-purple">Innclave Boys PG</th>
                      <th className="p-4 font-bold text-amber-600">Stanza Tokyo House</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 font-semibold text-text-muted">
                    <tr>
                      <td className="p-4 bg-bg-light/30 text-text-dark font-bold">Gender sharing</td>
                      <td className="p-4">Boys Only</td>
                      <td className="p-4">Boys Only</td>
                      <td className="p-4">Co-Living</td>
                    </tr>
                    <tr>
                      <td className="p-4 bg-bg-light/30 text-text-dark font-bold">Monthly rent (Single)</td>
                      <td className="p-4 text-text-dark font-bold">₹13,000</td>
                      <td className="p-4 text-text-dark font-bold">₹12,000</td>
                      <td className="p-4 text-text-dark font-bold">₹18,500</td>
                    </tr>
                    <tr>
                      <td className="p-4 bg-bg-light/30 text-text-dark font-bold">Security deposit</td>
                      <td className="p-4">1 Month Rent</td>
                      <td className="p-4">1 Month Rent</td>
                      <td className="p-4">2 Months Rent</td>
                    </tr>
                    <tr>
                      <td className="p-4 bg-bg-light/30 text-text-dark font-bold">Meals included</td>
                      <td className="p-4 text-emerald-600">3 Meals (Veg/Non-Veg)</td>
                      <td className="p-4 text-emerald-600">3 Meals (Veg)</td>
                      <td className="p-4 text-emerald-600">Breakfast & Dinner</td>
                    </tr>
                    <tr>
                      <td className="p-4 bg-bg-light/30 text-text-dark font-bold">WiFi speed</td>
                      <td className="p-4">Up to 100 Mbps</td>
                      <td className="p-4">Up to 150 Mbps</td>
                      <td className="p-4">Up to 300 Mbps</td>
                    </tr>
                    <tr>
                      <td className="p-4 bg-bg-light/30 text-text-dark font-bold">Metro distance</td>
                      <td className="p-4">800 meters</td>
                      <td className="p-4">1.2 kilometers</td>
                      <td className="p-4 text-brand-blue">350 meters</td>
                    </tr>
                    <tr>
                      <td className="p-4 bg-bg-light/30 text-text-dark font-bold">KYC / Verification</td>
                      <td className="p-4"><Badge variant="blue">Location Verified</Badge></td>
                      <td className="p-4"><Badge variant="purple">KYC Verified</Badge></td>
                      <td className="p-4"><Badge variant="green">HomiePG Physically Verified</Badge></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </FadeUp>

          {/* Interactive Map Simulator */}
          <div className="grid lg:grid-cols-12 gap-10 max-w-5xl mx-auto items-center">
            {/* Map simulator left */}
            <div className="lg:col-span-7">
              <FadeUp>
                <div className="relative aspect-[16/10] w-full rounded-3xl overflow-hidden border border-border/80 bg-white shadow-sm">
                  <GoogleMap
                    center={{ lat: 12.9315, lng: 77.6299 }}
                    zoom={14}
                    markers={[
                      {
                        id: 'haven-stays',
                        lat: 12.9315,
                        lng: 77.6299,
                        title: 'Haven Stays PG',
                        price: '₹13,000',
                        image: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=300&q=80',
                        area: 'Koramangala Sector 4, Bangalore'
                      },
                      {
                        id: 'innclave-boys',
                        lat: 12.9335,
                        lng: 77.6320,
                        title: 'Innclave Boys PG',
                        price: '₹12,000',
                        image: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=300&q=80',
                        area: 'Koramangala Sector 4, Bangalore'
                      },
                      {
                        id: 'stanza-tokyo',
                        lat: 12.9295,
                        lng: 77.6275,
                        title: 'Stanza Tokyo House',
                        price: '₹18,500',
                        image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=300&q=80',
                        area: 'Koramangala Sector 4, Bangalore'
                      }
                    ]}
                  />
                </div>
              </FadeUp>
            </div>

            {/* Map simulator right description */}
            <div className="lg:col-span-5 text-left">
              <FadeUp>
                <h3 className="font-heading font-extrabold text-text-dark text-2xl mb-4">
                  Interactive Live Location Search
                </h3>
                <p className="text-caption text-text-muted leading-relaxed font-semibold mb-6">
                  Check exact distance offsets to Metro corridors, tech hubs, and colleges. Zoom into specific sectors to find verified options easily.
                </p>
                <div className="space-y-4">
                  {[
                    'Filter by distance range (within 500m / 1km / 2km)',
                    'View attached washrooms & specific room floor levels',
                    'Locate nearby dining facilities & daily essentials',
                  ].map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-2 text-xs font-bold text-text-dark">
                      <CheckCircle className="w-4 h-4 text-brand-blue flex-shrink-0" />
                      {feat}
                    </div>
                  ))}
                </div>
              </FadeUp>
            </div>
          </div>
        </Container>
      </section>

      {/* ─── SEO Goldmines: Colleges & Corporates (Sprint 3.4) ────────── */}
      <section className="section-padding bg-[#F8FAFC]/50 border-t border-border/40">
        <Container>
          <FadeUp>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-bold text-brand-blue uppercase tracking-wider">LOCATIONS</span>
              <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-text-dark mt-1">
                Explore Stays Near Your Hub
              </h2>
              <p className="text-caption text-text-muted font-semibold mt-1">
                Find verified Co-Living, Boys, and Girls PGs within walking distance of major universities and corporate hubs.
              </p>
            </div>
          </FadeUp>

          <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto">
            {/* Colleges list */}
            <FadeUp delay={0.1}>
              <div className="bg-white p-8 rounded-3xl border border-border/40 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-brand-blue-light/50 flex items-center justify-center">
                    <Building className="w-5 h-5 text-brand-blue" />
                  </div>
                  <div>
                    <h3 className="font-heading font-extrabold text-text-dark text-lg">Popular Colleges & Universities</h3>
                    <p className="text-[0.7rem] text-text-muted font-semibold">Stays for students near top campuses</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
                  {[
                    { name: 'Christ University, Bangalore', href: '/search?q=Christ+University' },
                    { name: 'Jain University, Bangalore', href: '/search?q=Jain+University' },
                    { name: 'RV College of Engineering', href: '/search?q=RV+College' },
                    { name: 'PES University, Bangalore', href: '/search?q=PES+University' },
                    { name: 'MDI Gurgaon', href: '/search?q=MDI+Gurgaon' },
                    { name: 'Amity University, Gurgaon', href: '/search?q=Amity+Gurgaon' },
                    { name: 'Amity University, Noida', href: '/search?q=Amity+Noida' },
                    { name: 'Sharda University, Noida', href: '/search?q=Sharda+University' },
                    { name: 'Galgotias University, Noida', href: '/search?q=Galgotias+University' },
                    { name: 'Jaypee Institute, Noida', href: '/search?q=Jaypee+Institute' },
                  ].map((item, idx) => (
                    <Link
                      key={idx}
                      href={item.href}
                      className="text-xs font-semibold text-text-muted hover:text-brand-blue flex items-center gap-1.5 transition-colors py-1 group"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-border group-hover:bg-brand-blue transition-colors" />
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </FadeUp>

            {/* Tech parks list */}
            <FadeUp delay={0.2}>
              <div className="bg-white p-8 rounded-3xl border border-border/40 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-brand-purple-light/50 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-brand-purple" />
                  </div>
                  <div>
                    <h3 className="font-heading font-extrabold text-text-dark text-lg">Top Corporates & Tech Parks</h3>
                    <p className="text-[0.7rem] text-text-muted font-semibold">Stays for professionals near work offices</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
                  {[
                    { name: 'Manyata Tech Park, Bangalore', href: '/search?q=Manyata+Tech+Park' },
                    { name: 'RMZ Ecospace, Bangalore', href: '/search?q=Ecospace' },
                    { name: 'Bagmane Tech Park, Bangalore', href: '/search?q=Bagmane' },
                    { name: 'ITPL Whitefield, Bangalore', href: '/search?q=ITPL' },
                    { name: 'DLF Cyber City, Gurgaon', href: '/search?q=Cyber+City' },
                    { name: 'Udyog Vihar, Gurgaon', href: '/search?q=Udyog+Vihar' },
                    { name: 'Sohna Road Corporate Hub', href: '/search?q=Sohna+Road' },
                    { name: 'DLF IT Park, Noida', href: '/search?q=DLF+IT+Park' },
                    { name: 'Sector 62 IT Hub, Noida', href: '/search?q=Sector+62' },
                    { name: 'Advant Navis, Noida', href: '/search?q=Advant+Navis' },
                  ].map((item, idx) => (
                    <Link
                      key={idx}
                      href={item.href}
                      className="text-xs font-semibold text-text-muted hover:text-brand-purple flex items-center gap-1.5 transition-colors py-1 group"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-border group-hover:bg-brand-purple transition-colors" />
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </FadeUp>
          </div>
        </Container>
      </section>

      {/* ─── App Screenshots & Owner ERP CTA (Sprint 3.6) ─────────────── */}
      <section className="section-padding bg-white border-t border-border/50">
        <Container>
          <FadeUp>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-bold text-brand-purple uppercase tracking-wider">APPLICATIONS</span>
              <h2 className="font-heading font-extrabold text-3xl text-text-dark mt-1">
                Manage Stays On The Go
              </h2>
              <p className="text-caption text-text-muted font-semibold mt-1">
                Download the HomiePG app customized for your specific workflow.
              </p>
            </div>
          </FadeUp>

          {/* Dual Mockups Grid */}
          <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto mb-20">
            {/* Tenant App */}
            <FadeUp delay={0.1}>
              <div className="bg-[#EEF4FF]/50 border border-brand-blue/15 p-8 rounded-3xl text-left flex flex-col justify-between h-full hover:shadow-sm transition-shadow">
                <div>
                  <span className="text-[0.65rem] font-bold text-brand-blue bg-white border border-brand-blue/20 px-3 py-1 rounded-full uppercase">Tenant App</span>
                  <h3 className="font-heading font-extrabold text-text-dark text-xl mt-4 mb-3">Bed Layout Details & Roommate Matching</h3>
                  <p className="text-xs text-text-muted leading-relaxed font-semibold mb-6">
                    Find and book stays easily. Chat with potential roommates before booking, view food menus, auto-pay rent, and submit maintenance tickets directly to property managers.
                  </p>
                  <ul className="space-y-2 mb-8">
                    {[
                      'Detailed bed layout selector map',
                      'Pre-screen roommate profile interests',
                      'Zero-hassle digital e-sign agreements',
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-[0.7rem] font-bold text-text-dark">
                        <CheckCircle className="w-4 h-4 text-brand-blue flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex gap-3">
                  <div className="h-10 px-4 bg-text-dark rounded-xl flex items-center justify-center text-white font-bold text-xs gap-2 select-none cursor-pointer">
                    App Store
                  </div>
                  <div className="h-10 px-4 bg-text-dark rounded-xl flex items-center justify-center text-white font-bold text-xs gap-2 select-none cursor-pointer">
                    Google Play
                  </div>
                </div>
              </div>
            </FadeUp>

            {/* Owner App / ERP */}
            <FadeUp delay={0.2}>
              <div className="bg-[#F5F0FF]/50 border border-brand-purple/15 p-8 rounded-3xl text-left flex flex-col justify-between h-full hover:shadow-sm transition-shadow">
                <div>
                  <span className="text-[0.65rem] font-bold text-brand-purple bg-white border border-brand-purple/20 px-3 py-1 rounded-full uppercase">Owner ERP App</span>
                  <h3 className="font-heading font-extrabold text-text-dark text-xl mt-4 mb-3">Complete Multi-Property Management</h3>
                  <p className="text-xs text-text-muted leading-relaxed font-semibold mb-6">
                    Automate tenant onboarding and KYC checklist verifications. Monitor vacancy cycles, generate auto-invoices, send automated WhatsApp payment reminders, and track payouts.
                  </p>
                  <ul className="space-y-2 mb-8">
                    {[
                      'Multi-building dashboards and occupancies',
                      'Automated WhatsApp payment alerts',
                      'Tenant verification and KYC logs',
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-[0.7rem] font-bold text-text-dark">
                        <CheckCircle className="w-4 h-4 text-brand-purple flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex gap-3">
                  <Link
                    href="/owners"
                    className="h-10 px-6 bg-brand-purple hover:bg-brand-purple-dark text-white rounded-xl flex items-center justify-center font-bold text-xs gap-2 shadow-sm transition-colors"
                  >
                    Open Owner Portal
                  </Link>
                </div>
              </div>
            </FadeUp>
          </div>

          {/* Owner CTA Banner */}
          <FadeUp>
            <div className="bg-gradient-to-r from-brand-blue to-brand-purple text-white p-8 sm:p-12 rounded-3xl text-left max-w-5xl mx-auto relative overflow-hidden shadow-md">
              <div className="absolute top-[-10%] right-[-10%] w-[35%] h-[50%] bg-white/5 rounded-full blur-2xl pointer-events-none" />
              <div className="relative z-10 max-w-xl">
                <h3 className="font-heading font-extrabold text-2xl sm:text-3xl leading-tight mb-3">
                  List Your Property on HomiePG
                </h3>
                <p className="text-xs text-white/80 font-semibold leading-relaxed mb-6">
                  Join thousands of verified owners who automate invoicing, secure high-occupancy leads, and digitize their operational workflow with zero brokerage fees.
                </p>
                <Link
                  href="/owners"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-brand-blue hover:bg-bg-light font-bold text-xs shadow-sm transition-colors"
                >
                  Get Started for Free <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </FadeUp>
        </Container>
      </section>

      {/* ─── Testimonials Section ─────────────────────────────────────── */}
      <section className="section-padding bg-bg-light/20 border-t border-border/50">
        <Container>
          <FadeUp>
            <div className="text-center mb-10">
              <span className="text-xs font-bold text-brand-purple uppercase tracking-wider">TESTIMONIALS</span>
              <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-text-dark mt-1">
                What Our Tenants Say
              </h2>
              <p className="text-caption text-text-muted font-semibold mt-1">
                Real stories from real people who found their perfect home.
              </p>
            </div>
          </FadeUp>

          <StaggerChildren className="mt-12 grid md:grid-cols-3 gap-6">
            {[
              { text: 'Found a premium co-living room near my office in Koramangala. The seat map let me pick a corner bed easily.', name: 'Neha Kumari', status: 'Verified Resident' },
              { text: 'Great interface. Auto WhatsApp reminders for rent receipts keeps everything logged without awkward conversations.', name: 'Vivek Mishra', status: 'Verified Resident' },
              { text: 'Best PG portal. Zero brokerage and real photos saved me days of walking around in NCR heat.', name: 'Kavya Nair', status: 'Verified Resident' },
            ].map((t, i) => (
              <motion.div key={i} variants={fadeUpVariants}>
                <HoverLift>
                  <Card hover padding="lg" className="h-full flex flex-col border border-border/50 bg-white">
                    <div className="flex gap-1.5 mb-4" aria-hidden>
                      {Array.from({ length: 5 }).map((_, starIndex) => (
                        <Star key={starIndex} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-body text-text-muted flex-1 leading-relaxed mb-6 italic">
                      "{t.text}"
                    </p>
                    <div className="flex items-center gap-3 pt-4 border-t border-border-light mt-auto">
                      <div className="w-10 h-10 bg-brand-blue text-white rounded-full flex items-center justify-center font-heading font-bold">
                        {t.name[0]}
                      </div>
                      <div>
                        <div className="font-heading font-bold text-text-dark text-xs">{t.name}</div>
                        <span className="text-[0.65rem] text-brand-green font-bold bg-brand-green-light/20 px-1.5 py-0.5 rounded mt-1 inline-block">
                          {t.status}
                        </span>
                      </div>
                    </div>
                  </Card>
                </HoverLift>
              </motion.div>
            ))}
          </StaggerChildren>
        </Container>
      </section>

      {/* ─── Latest Blogs Section (Sprint 3.7 Part 1) ───────────────── */}
      <section className="section-padding bg-[#F8FAFC]/50 border-t border-border/40">
        <Container>
          <FadeUp>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-bold text-brand-blue uppercase tracking-wider">INSIGHTS</span>
              <h2 className="font-heading font-extrabold text-3xl text-text-dark mt-1">
                Latest Articles & Guides
              </h2>
              <p className="text-caption text-text-muted font-semibold mt-1">
                Stay updated with the latest trends in co-living, tenancy laws, and relocation guides.
              </p>
            </div>
          </FadeUp>

          <StaggerChildren className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                title: 'Top 5 Areas to Live in Bangalore for Tech Professionals',
                desc: 'An in-depth analysis of rental indices, metro connectivity, and social hubs near major tech corridors.',
                img: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=500&q=80',
                badge: 'Lifestyle',
                time: '5 min read',
                href: '/blog',
              },
              {
                title: 'Understanding Co-living vs. PG: Which is Best for You?',
                desc: 'Compare sharing densities, lock-in structures, community spaces, and billing systems to make the right choice.',
                img: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=500&q=80',
                badge: 'Guides',
                time: '4 min read',
                href: '/blog',
              },
              {
                title: 'A Beginner\'s Guide to Digital KYC & Rent Agreements',
                desc: 'Everything you need to know about instant biometric verifications, e-signatures, and lock-in security clauses.',
                img: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=500&q=80',
                badge: 'Tenancy Laws',
                time: '6 min read',
                href: '/blog',
              },
            ].map((article, idx) => (
              <motion.div key={idx} variants={fadeUpVariants}>
                <HoverLift className="h-full">
                  <Card padding="none" className="h-full border border-border/50 bg-white hover:border-brand-blue/30 shadow-sm rounded-3xl overflow-hidden flex flex-col justify-between">
                    <div>
                      <div className="relative aspect-[16/10] w-full overflow-hidden">
                        <Image
                          src={article.img}
                          alt={article.title}
                          fill
                          className="object-cover"
                        />
                        <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/90 text-text-dark text-[0.6rem] font-bold shadow-sm">
                          {article.badge}
                        </span>
                      </div>
                      <div className="p-6">
                        <h3 className="font-heading font-extrabold text-text-dark text-base mb-2 group-hover:text-brand-blue transition-colors">
                          {article.title}
                        </h3>
                        <p className="text-caption text-text-muted leading-relaxed font-semibold mb-4">
                          {article.desc}
                        </p>
                      </div>
                    </div>
                    <div className="p-6 pt-0 mt-auto flex items-center justify-between border-t border-border-light">
                      <span className="text-[0.65rem] text-text-light font-bold">{article.time}</span>
                      <Link
                        href={article.href}
                        className="text-xs font-bold text-brand-blue hover:text-brand-blue-dark flex items-center gap-1 transition-colors"
                      >
                        Read Article <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </Card>
                </HoverLift>
              </motion.div>
            ))}
          </StaggerChildren>
        </Container>
      </section>

      {/* ─── Dynamic FAQ Accordion (Sprint 3.7 Part 2) ───────────────── */}
      <section className="section-padding bg-white border-t border-border/50">
        <Container>
          <FadeUp>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-bold text-brand-purple uppercase tracking-wider">QUESTIONS</span>
              <h2 className="font-heading font-extrabold text-3xl text-text-dark mt-1">
                Frequently Asked Questions
              </h2>
              <p className="text-caption text-text-muted font-semibold mt-1">
                Find answers to common operational questions regarding stays, pricing, and bookings.
              </p>
            </div>
          </FadeUp>

          {/* Accordion List */}
          <div className="max-w-3xl mx-auto space-y-4 text-left">
            {[
              {
                q: 'What is HomiePG and how is it different?',
                a: 'HomiePG is India\'s Smart PG Platform. Unlike typical classified portals, we offer verified Co-Living, Boys, and Girls PGs with detailed bed availability information, zero brokerage fees, and paperless digital KYC agreements.',
              },
              {
                q: 'Are there any brokerage fees when booking a stay?',
                a: 'No. HomiePG is a zero-brokerage platform. You deal directly with property owners and manager operators through our secure platform without any middleman commissions.',
              },
              {
                q: 'What does the "Co-Living PG" category mean?',
                a: 'Co-Living PGs are co-living style buildings that accommodate both male and female residents, usually on separate floors or wings, with common spaces like study lounges, gyms, and dining halls shared by all.',
              },
              {
                q: 'How does roommate profile matching work?',
                a: 'Before locking your bed, you can check interest profiles and preferences of existing roommates in that room (e.g. food preferences, work schedule, hobbies) to ensure high compatibility.',
              },
              {
                q: 'How is the "Location Verified" badge validated?',
                a: 'The Location Verified status is granted when our platform captures live GPS coordinates and automated device metadata of the building, alongside a verified walk-through video recorded directly inside the property.',
              },
              {
                q: 'Can I complete my rent agreement online?',
                a: 'Yes. HomiePG provides a fully digital rent agreement builder. You can review terms, complete tenant KYC, and e-sign the rental contract inside our tenant app in under 2 minutes.',
              },
              {
                q: 'What amenities are standard in all HomiePG properties?',
                a: 'All verified stays include high-speed WiFi, 3-meals daily food options, laundry service access, regular housekeeping, CCTV surveillance, and 24/7 security standards.',
              },
              {
                q: 'How does automated rent invoicing work?',
                a: 'On the 1st of every month, your rent invoice is generated inside the Tenant App. You receive automatic WhatsApp reminders with zero-commission payment links (UPI, Cards, Netbanking).',
              },
              {
                q: 'Is my security deposit safe with HomiePG?',
                a: 'Yes. We enforce a standard lock-in contract structure. Security deposits are managed via escrow rules or audited owner agreements to ensure hassle-free refund processing upon checkout.',
              },
              {
                q: 'Can I schedule a physical visit before paying?',
                a: 'Absolutely. You can click "Schedule Visit" on any listing, select a convenient date and time, and receive owner contact details to inspect the room physically.',
              },
              {
                q: 'What is the minimum stay duration or lock-in period?',
                a: 'Most verified stays require a minimum lock-in period of 1 to 3 months, which will be clearly indicated in the stay details and rent agreement before you confirm the booking.',
              },
              {
                q: 'What documents do I need for tenant verification?',
                a: 'You only need to upload your Aadhaar card and PAN details to complete the automated digital KYC process inside the tenant portal.',
              },
            ].map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <FadeUp key={index} delay={index * 0.03}>
                  <div className="border border-border/60 rounded-2xl overflow-hidden bg-bg-light/10 hover:bg-bg-light/35 transition-colors">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="w-full px-6 py-4 flex items-center justify-between font-heading font-bold text-sm text-text-dark text-left focus:outline-none cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      <span className={`text-brand-blue font-extrabold text-lg transform transition-transform duration-200 ${isOpen ? 'rotate-45' : 'rotate-0'}`}>
                        +
                      </span>
                    </button>
                    <div
                      className={`transition-all duration-300 ease-in-out overflow-hidden ${
                        isOpen ? 'max-h-40 border-t border-border/40 opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <p className="px-6 py-4 text-xs font-semibold text-text-muted leading-relaxed">
                        {faq.a}
                      </p>
                    </div>
                  </div>
                </FadeUp>
              );
            })}
          </div>
        </Container>
      </section>
    </div>
  );
}
