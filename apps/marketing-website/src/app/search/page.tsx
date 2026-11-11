'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Container } from '@/components/shared/Container';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  MapPin, Star, Building2, SlidersHorizontal, Map, Grid,
  Shield, Check, Search, Phone, MessageCircle, Info, Heart, Building, Sparkles, ChevronDown
} from 'lucide-react';
import { FadeUp, StaggerChildren, HoverLift, fadeUpVariants } from '@/components/animations';
import { motion, AnimatePresence } from 'framer-motion';
import { CITIES, GENDER_OPTIONS } from '@/constants/cities';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

import GoogleMap from '@/components/shared/GoogleMap';
import { api } from '@/lib/api';
import { createClient } from '@/lib/supabase';

type SearchResultPG = {
  id: string;
  name: string;
  city: string;
  area: string;
  ownerName: string;
  gender: 'Male' | 'Female' | 'Co-Living';
  rent: number;
  deposit: number;
  rating: number;
  reviews: number;
  image: string;
  amenities: string[];
  thumbs: string[];
  priceSingle: string;
  priceDouble: string;
  lat: number;
  lng: number;
};

const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  Bangalore: { lat: 12.9716, lng: 77.5946 },
  Delhi: { lat: 28.7041, lng: 77.1025 },
  Mumbai: { lat: 19.0760, lng: 72.8777 },
  Hyderabad: { lat: 17.3850, lng: 78.3488 },
  Pune: { lat: 18.5204, lng: 73.8567 },
  Chennai: { lat: 13.0827, lng: 80.2707 },
  Gurgaon: { lat: 28.4595, lng: 77.0266 },
  Noida: { lat: 28.5355, lng: 77.3910 },
};

function SearchResults() {
  const searchParams = useSearchParams();
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || 'Bangalore');
  const [selectedGender, setSelectedGender] = useState(searchParams.get('gender') || '');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [loading, setLoading] = useState(true);
  const [selectedPGId, setSelectedPGId] = useState<string | null>(null);
  const [activeDetailPG, setActiveDetailPG] = useState<SearchResultPG | null>(null);
  const [activeBookingPG, setActiveBookingPG] = useState<SearchResultPG | null>(null);
  const [bookingStep, setBookingStep] = useState<number>(1);
  const [selectedRoomType, setSelectedRoomType] = useState<'Single' | 'Double'>('Double');
  const [selectedBed, setSelectedBed] = useState<'A' | 'B' | null>(null);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [tenantName, setTenantName] = useState('');

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginPhone, setLoginPhone] = useState('');
  const [loginOtp, setLoginOtp] = useState('');
  const [loginStep, setLoginStep] = useState<'phone' | 'otp'>('phone');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState<string | null>(null);
  const [loginToken, setLoginToken] = useState('');
  const [loginDevOtp, setLoginDevOtp] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [genderDropdownOpen, setGenderDropdownOpen] = useState(false);

  const cityDropdownRef = useRef<HTMLDivElement>(null);
  const genderDropdownRef = useRef<HTMLDivElement>(null);

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

  const queryCity = searchParams.get('city');

  useEffect(() => {
    if (queryCity) {
      setSelectedCity(queryCity);
      setLoading(true);
    } else {
      const saved = localStorage.getItem('homiepg-selected-city');
      if (saved) {
        setSelectedCity(saved);
        setLoading(true);
      }
    }
  }, [queryCity]);

  useEffect(() => {
    const handleLocationChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setSelectedCity(customEvent.detail);
        setLoading(true);
      }
    };

    window.addEventListener('homiepg-location-changed', handleLocationChange);
    return () => {
      window.removeEventListener('homiepg-location-changed', handleLocationChange);
    };
  }, []);

  const handleSendLoginOtp = async () => {
    setLoginError(null);
    setLoginSuccess(null);
    if (loginPhone.length !== 10) {
      setLoginError('Please enter a valid 10-digit mobile number.');
      return;
    }

    const res = await api.post<{ success: boolean; verification_token: string; dev_otp: string }>('/api/auth/send-otp', {
      mobile: loginPhone,
      role: 'tenant'
    });

    if (res.error) {
      setLoginError(res.error);
      return;
    }

    if (res.data?.success) {
      setLoginToken(res.data.verification_token);
      setLoginDevOtp(res.data.dev_otp);
      setLoginSuccess('OTP sent successfully!');
      setLoginStep('otp');
    }
  };

  const handleVerifyLoginOtp = async () => {
    setLoginError(null);
    setLoginSuccess(null);
    if (loginOtp.length !== 6) {
      setLoginError('Please enter a 6-digit OTP code.');
      return;
    }

    const res = await api.post<{ token: string; user: any; profile: any }>('/api/auth/verify-otp', {
      mobile: loginPhone,
      otp: loginOtp,
      verification_token: loginToken,
      role: 'tenant'
    });

    if (res.error) {
      setLoginError(res.error);
      return;
    }

    if (res.data?.token) {
      localStorage.setItem('token', res.data.token);
      setIsLoggedIn(true);
      setLoginSuccess('Logged in successfully!');
      const supabase = createClient();
      await supabase.auth.setSession({
        access_token: res.data.token,
        refresh_token: res.data.token
      });
      setBookingStep(1);
    }
  };

  // Mocked rich PG data reflecting standard India co-living properties with coordinates
  const mockPGs: SearchResultPG[] = [
    {
      id: 'pg-1',
      name: 'Stanza Living Dublin House',
      ownerName: 'Stanza Living',
      city: 'Bangalore',
      area: 'Electronic City Phase 1',
      gender: 'Co-Living',
      rent: 9500,
      deposit: 15000,
      rating: 4.8,
      reviews: 142,
      image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=500&q=80',
      amenities: ['WiFi', 'Food Included', 'AC', 'Power Backup', 'Gym'],
      thumbs: [
        'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=150&q=80',
        'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=150&q=80',
        'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=150&q=80',
      ],
      priceSingle: '₹14,000',
      priceDouble: '₹9,500',
      lat: 12.8452,
      lng: 77.6602,
    },
    {
      id: 'pg-2',
      name: 'Zolo Stay Royal Crest',
      ownerName: 'Zolo Stays',
      city: 'Bangalore',
      area: 'Koramangala 4th Block',
      gender: 'Male',
      rent: 8200,
      deposit: 10000,
      rating: 4.5,
      reviews: 98,
      image: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=500&q=80',
      amenities: ['WiFi', 'Food Included', 'Power Backup', 'Parking'],
      thumbs: [
        'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=150&q=80',
        'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=150&q=80',
        'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=150&q=80',
      ],
      priceSingle: '₹12,500',
      priceDouble: '₹8,200',
      lat: 12.9315,
      lng: 77.6299,
    },
    {
      id: 'pg-3',
      name: 'Saraswati Girls PG Residence',
      ownerName: 'Amit PG Properties',
      city: 'Delhi',
      area: 'Mukherjee Nagar',
      gender: 'Female',
      rent: 7500,
      deposit: 8000,
      rating: 4.6,
      reviews: 64,
      image: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=500&q=80',
      amenities: ['WiFi', 'AC', 'RO Water', 'CCTV Security'],
      thumbs: [
        'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=150&q=80',
        'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=150&q=80',
        'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=150&q=80',
      ],
      priceSingle: '₹11,000',
      priceDouble: '₹7,500',
      lat: 28.6946,
      lng: 77.2163,
    },
    {
      id: 'pg-4',
      name: 'Nestaway Cozy Living',
      ownerName: 'Nestaway',
      city: 'Mumbai',
      area: 'Andheri East',
      gender: 'Co-Living',
      rent: 14000,
      deposit: 25000,
      rating: 4.7,
      reviews: 110,
      image: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=500&q=80',
      amenities: ['WiFi', 'AC', 'Washing Machine', 'Kitchen Access'],
      thumbs: [
        'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=150&q=80',
        'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=150&q=80',
        'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=150&q=80',
      ],
      priceSingle: '₹22,000',
      priceDouble: '₹14,000',
      lat: 19.1136,
      lng: 72.8697,
    },
    {
      id: 'pg-5',
      name: 'Elite Coliving Spaces',
      ownerName: 'Amit PG Properties',
      city: 'Hyderabad',
      area: 'Gachibowli near DLF',
      gender: 'Co-Living',
      rent: 11000,
      deposit: 15000,
      rating: 4.9,
      reviews: 185,
      image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500&q=80',
      amenities: ['WiFi', 'Food Included', 'AC', 'Gym', 'Gaming Room'],
      thumbs: [
        'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=150&q=80',
        'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=150&q=80',
        'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=150&q=80',
      ],
      priceSingle: '₹16,500',
      priceDouble: '₹11,000',
      lat: 17.4483,
      lng: 78.3488,
    },
    {
      id: 'pg-6',
      name: 'Sai Baba PG For Boys',
      ownerName: 'Amit PG Properties',
      city: 'Pune',
      area: 'Viman Nagar',
      gender: 'Male',
      rent: 6800,
      deposit: 7000,
      rating: 4.2,
      reviews: 47,
      image: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=500&q=80',
      amenities: ['WiFi', 'Food Included', 'Parking'],
      thumbs: [
        'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=150&q=80',
        'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=150&q=80',
        'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=150&q=80',
      ],
      priceSingle: '₹9,800',
      priceDouble: '₹6,800',
      lat: 18.5679,
      lng: 73.9143,
    },
    {
      id: 'pg-7',
      name: 'Stanza Living Rome House',
      ownerName: 'Stanza Living',
      city: 'Delhi',
      area: 'Patel Nagar',
      gender: 'Co-Living',
      rent: 11500,
      deposit: 20000,
      rating: 4.7,
      reviews: 83,
      image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=500&q=80',
      amenities: ['WiFi', 'Food Included', 'AC', 'Gym'],
      thumbs: [],
      priceSingle: '₹17,000',
      priceDouble: '₹11,500',
      lat: 28.6453,
      lng: 77.1587,
    },
    {
      id: 'pg-8',
      name: 'Zolo Stay Elite Powai',
      ownerName: 'Zolo Stays',
      city: 'Mumbai',
      area: 'Powai near Hiranandani',
      gender: 'Male',
      rent: 12500,
      deposit: 20000,
      rating: 4.6,
      reviews: 95,
      image: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=500&q=80',
      amenities: ['WiFi', 'AC', 'CCTV Security', 'Gym'],
      thumbs: [],
      priceSingle: '₹20,000',
      priceDouble: '₹12,500',
      lat: 19.1176,
      lng: 72.9060,
    },
    {
      id: 'pg-9',
      name: 'Sunrise Girls PG Stay',
      ownerName: 'Amit PG Properties',
      city: 'Hyderabad',
      area: 'Madhapur Near Metro',
      gender: 'Female',
      rent: 8000,
      deposit: 10000,
      rating: 4.4,
      reviews: 58,
      image: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=500&q=80',
      amenities: ['WiFi', 'Food Included', 'Washing Machine'],
      thumbs: [],
      priceSingle: '₹12,000',
      priceDouble: '₹8,000',
      lat: 17.4485,
      lng: 78.3741,
    },
    {
      id: 'pg-10',
      name: 'Stanza Living Tokyo House',
      ownerName: 'Stanza Living',
      city: 'Pune',
      area: 'Hinjewadi Phase 1',
      gender: 'Co-Living',
      rent: 9800,
      deposit: 15000,
      rating: 4.8,
      reviews: 112,
      image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=500&q=80',
      amenities: ['WiFi', 'Food Included', 'AC', 'Power Backup', 'Gym'],
      thumbs: [],
      priceSingle: '₹15,000',
      priceDouble: '₹9,800',
      lat: 18.5913,
      lng: 73.7389,
    },
    {
      id: 'pg-11',
      name: 'Chennai Oasis Co-Living',
      ownerName: 'Nestaway',
      city: 'Chennai',
      area: 'OMR Karapakkam',
      gender: 'Co-Living',
      rent: 8900,
      deposit: 15000,
      rating: 4.7,
      reviews: 74,
      image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500&q=80',
      amenities: ['WiFi', 'Food Included', 'AC', 'Gym'],
      thumbs: [],
      priceSingle: '₹14,000',
      priceDouble: '₹8,900',
      lat: 12.9157,
      lng: 80.2314,
    },
    {
      id: 'pg-12',
      name: 'Marina Hostel for Girls',
      ownerName: 'Amit PG Properties',
      city: 'Chennai',
      area: 'Mylapore',
      gender: 'Female',
      rent: 6500,
      deposit: 8000,
      rating: 4.3,
      reviews: 39,
      image: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=500&q=80',
      amenities: ['WiFi', 'Food Included', 'Laundry'],
      thumbs: [],
      priceSingle: '₹9,500',
      priceDouble: '₹6,500',
      lat: 13.0330,
      lng: 80.2677,
    },
    {
      id: 'pg-13',
      name: 'Homie Stays Gurgaon',
      ownerName: 'Amit PG Properties',
      city: 'Gurgaon',
      area: 'Sector 45 Near Huda City Center',
      gender: 'Co-Living',
      rent: 8500,
      deposit: 5000,
      rating: 4.9,
      reviews: 215,
      image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=500&q=80',
      amenities: ['WiFi', 'Food Included', 'AC', 'Power Backup', 'Gym'],
      thumbs: [],
      priceSingle: '₹14,000',
      priceDouble: '₹8,500',
      lat: 28.4572,
      lng: 77.0640,
    },
    {
      id: 'pg-14',
      name: 'Zolo Royal Crest Gurgaon',
      ownerName: 'Zolo Stays',
      city: 'Gurgaon',
      area: 'Sector 21',
      gender: 'Male',
      rent: 8200,
      deposit: 10000,
      rating: 4.5,
      reviews: 64,
      image: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=500&q=80',
      amenities: ['WiFi', 'Food Included', 'Power Backup', 'Parking'],
      thumbs: [],
      priceSingle: '₹12,500',
      priceDouble: '₹8,200',
      lat: 28.4962,
      lng: 77.0726,
    },
    {
      id: 'pg-15',
      name: 'Noida Premium Suites',
      ownerName: 'Nestaway',
      city: 'Noida',
      area: 'Sector 62 near Fortis',
      gender: 'Co-Living',
      rent: 9200,
      deposit: 15000,
      rating: 4.7,
      reviews: 91,
      image: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=500&q=80',
      amenities: ['WiFi', 'AC', 'Gym', 'Gaming Lounge'],
      thumbs: [],
      priceSingle: '₹15,000',
      priceDouble: '₹9,200',
      lat: 28.6255,
      lng: 77.3710,
    },
    {
      id: 'pg-16',
      name: 'Metro Nest Girls PG',
      ownerName: 'Nestaway',
      city: 'Noida',
      area: 'Sector 15 near Metro',
      gender: 'Female',
      rent: 7200,
      deposit: 8000,
      rating: 4.4,
      reviews: 52,
      image: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=500&q=80',
      amenities: ['WiFi', 'Food Included', 'CCTV Security'],
      thumbs: [],
      priceSingle: '₹11,000',
      priceDouble: '₹7,200',
      lat: 28.5785,
      lng: 77.3115,
    },
  ];

  // Filter listings based on URL city/gender selector queries
  const filteredPGs = mockPGs.filter(
    (pg) =>
      pg.city.toLowerCase() === selectedCity.toLowerCase() &&
      (selectedGender === '' || pg.gender.toLowerCase() === selectedGender.toLowerCase())
  );

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, [selectedCity, selectedGender]);

  const handleCityChange = (val: string) => {
    setLoading(true);
    setSelectedCity(val);
    setSelectedPGId(null);
  };

  const handleGenderChange = (val: string) => {
    setLoading(true);
    setSelectedGender(val);
    setSelectedPGId(null);
  };

  const mapCenter = CITY_COORDINATES[selectedCity] || { lat: 12.9716, lng: 77.5946 };
  const mapMarkers = filteredPGs.map(pg => ({
    id: pg.id,
    lat: pg.lat,
    lng: pg.lng,
    title: pg.name,
    price: pg.priceDouble,
    image: pg.image,
    area: pg.area
  }));

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-8">
      <Container>
        {/* Search header / Quick filter selectors */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white border border-border/60 p-4 sm:p-5 rounded-2xl shadow-sm">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            
            {/* Custom City Selector */}
            <div className="w-52 relative text-left" ref={cityDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setCityDropdownOpen(!cityDropdownOpen);
                  setGenderDropdownOpen(false);
                }}
                className="w-full h-10 px-3 rounded-lg border border-border/80 text-xs font-bold text-text-dark bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue flex items-center justify-between cursor-pointer transition-all duration-200"
              >
                <span className="truncate">{selectedCity}</span>
                <ChevronDown className={cn("w-3.5 h-3.5 text-text-muted transition-transform duration-200 flex-shrink-0", cityDropdownOpen && "rotate-180")} />
              </button>

              <AnimatePresence>
                {cityDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="absolute left-0 top-full mt-2 w-full bg-white rounded-xl border border-border shadow-card-hover z-[110] overflow-hidden p-1.5"
                  >
                    <div className="max-h-60 overflow-y-auto space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-200">
                      {(() => {
                        const cityOptions = [...CITIES];
                        const isCitySupported = CITIES.some(
                          (c) => c.name.toLowerCase() === selectedCity.toLowerCase()
                        );
                        if (!isCitySupported && selectedCity) {
                          cityOptions.push({
                            name: selectedCity,
                            slug: selectedCity.toLowerCase(),
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
                              handleCityChange(c.name);
                              setCityDropdownOpen(false);
                            }}
                            className={cn(
                              "w-full block px-3 py-2 text-xs text-text-dark hover:bg-brand-blue-light hover:text-brand-blue rounded-lg transition-colors text-left font-medium",
                              selectedCity === c.name && "text-brand-blue bg-brand-blue-light font-semibold"
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
            </div>

            {/* Custom Gender Selector */}
            <div className="w-40 relative text-left" ref={genderDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setGenderDropdownOpen(!genderDropdownOpen);
                  setCityDropdownOpen(false);
                }}
                className="w-full h-10 px-3 rounded-lg border border-border/80 text-xs font-bold text-text-dark bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue flex items-center justify-between cursor-pointer transition-all duration-200"
              >
                <span className="truncate">
                  {GENDER_OPTIONS.find((g) => g.value === selectedGender)?.label || 'Gender'}
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
                    className="absolute left-0 top-full mt-2 w-full bg-white rounded-xl border border-border shadow-card-hover z-[110] overflow-hidden p-1.5"
                  >
                    <div className="space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-200">
                      {GENDER_OPTIONS.map((g) => (
                        <button
                          key={g.value}
                          type="button"
                          onClick={() => {
                            handleGenderChange(g.value);
                            setGenderDropdownOpen(false);
                          }}
                          className={cn(
                            "w-full block px-3 py-2 text-xs text-text-dark hover:bg-brand-blue-light hover:text-brand-blue rounded-lg transition-colors text-left font-medium",
                            selectedGender === g.value && "text-brand-blue bg-brand-blue-light font-semibold"
                          )}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={[
                'p-2 rounded-lg border border-border/80 hover:bg-bg-light transition-colors cursor-pointer',
                viewMode === 'grid' ? 'bg-brand-blue-light/50 border-brand-blue/30 text-brand-blue' : 'text-text-muted',
              ].join(' ')}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={[
                'p-2 rounded-lg border border-border/80 hover:bg-bg-light transition-colors cursor-pointer',
                viewMode === 'map' ? 'bg-brand-blue-light/50 border-brand-blue/30 text-brand-blue' : 'text-text-muted',
              ].join(' ')}
              title="Map View"
            >
              <Map className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search results body */}
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-8">
            {viewMode === 'map' ? (
              <div className="h-[650px] w-full rounded-2xl overflow-hidden border border-border/50 bg-white shadow-sm">
                <GoogleMap
                  center={mapCenter}
                  markers={mapMarkers}
                  onMarkerClick={(id) => setSelectedPGId(id)}
                />
              </div>
            ) : (
              <>
                <h2 className="font-heading font-bold text-lg text-text-dark mb-5 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-brand-blue" />
                  Showing {filteredPGs.length} verified stays in {selectedCity}
                </h2>

                {loading ? (
                  <div className="grid sm:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((n) => (
                      <div key={n} className="bg-white border border-border rounded-2xl p-4 space-y-4 shadow-sm">
                        <Skeleton className="h-44 w-full rounded-xl" />
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : filteredPGs.length > 0 ? (
                  <StaggerChildren className="grid sm:grid-cols-2 gap-6">
                    {filteredPGs.map((pg) => (
                      <motion.div key={pg.id} variants={fadeUpVariants}>
                        <HoverLift>
                          <Card padding="none" className="overflow-hidden border border-border/60 shadow-sm hover:shadow-md bg-white flex flex-col h-full justify-between">
                            {/* Main Image */}
                            <div className="relative aspect-[16/10] w-full">
                              <Image
                                src={pg.image}
                                alt={pg.name}
                                fill
                                className="object-cover"
                                sizes="(max-width: 640px) 100vw, 350px"
                              />
                              <div className="absolute top-3 left-3 flex gap-1 z-10">
                                <Badge variant="dark" className="bg-text-dark/85 backdrop-blur-sm px-2.5 py-0.5 font-extrabold text-[0.65rem]">{pg.gender}</Badge>
                                <Badge variant="blue" className="bg-brand-blue text-white font-bold text-[0.65rem]"><Shield className="w-3 h-3" /> Verified</Badge>
                              </div>
                              <div className="absolute bottom-3 right-3 bg-text-dark/75 backdrop-blur-md px-2 py-0.5 rounded-lg flex items-center gap-1 text-[0.65rem] font-bold text-white">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                {pg.rating.toFixed(1)}
                              </div>
                            </div>

                            {/* Details */}
                            <div className="p-4 flex-1 flex flex-col justify-between">
                              <div>
                                 <p className="text-[0.55rem] uppercase tracking-wider font-extrabold text-brand-blue mb-1">
                                   By {pg.ownerName}
                                 </p>
                                 <h3 className="font-heading font-extrabold text-text-dark text-base leading-snug line-clamp-1">
                                  {pg.name}
                                </h3>
                                <p className="text-[0.7rem] font-semibold text-text-muted flex items-center gap-1 mt-1.5">
                                  <MapPin className="w-3.5 h-3.5 text-text-light flex-shrink-0" />
                                  {pg.area}
                                </p>

                                {/* Amenities */}
                                <div className="flex flex-wrap gap-1 mt-3">
                                  {pg.amenities.slice(0, 3).map((feat, fIdx) => (
                                    <span key={fIdx} className="px-2 py-0.5 rounded-full bg-brand-blue-light/40 text-brand-blue text-[0.55rem] font-bold">
                                      {feat}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="mt-4 pt-3 border-t border-border-light flex items-center justify-between">
                                <div>
                                  <span className="text-[0.55rem] text-text-light font-bold block uppercase tracking-wider">Double Sharing</span>
                                  <span className="text-sm font-extrabold text-brand-blue">{pg.priceDouble}/mo</span>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => setActiveDetailPG(pg)}
                                    className="px-3 py-1.5 border border-border hover:border-brand-blue hover:text-brand-blue rounded-lg text-[0.65rem] font-bold transition-all cursor-pointer"
                                  >
                                    Details
                                  </button>
                                  <button
                                    onClick={() => {
                                      setActiveBookingPG(pg);
                                      setBookingStep(isLoggedIn ? 1 : 0);
                                      setSelectedBed(null);
                                      setAgreeTerms(false);
                                      setTenantName('');
                                    }}
                                    className="px-3 py-1.5 bg-brand-blue hover:bg-brand-blue-dark text-white rounded-lg text-[0.65rem] font-bold transition-all shadow-sm cursor-pointer"
                                  >
                                    Book
                                  </button>
                                </div>
                              </div>
                            </div>
                          </Card>
                        </HoverLift>
                      </motion.div>
                    ))}
                  </StaggerChildren>
                ) : (
                  <div className="bg-white border border-border/60 rounded-2xl py-12 px-6 text-center">
                    <Building2 className="w-12 h-12 text-text-light mx-auto mb-4" />
                    <h3 className="font-heading font-bold text-text-dark text-base mb-1">No PGs found</h3>
                    <p className="text-caption text-text-muted max-w-sm mx-auto font-medium">
                      We currently do not have matching PG listings in {selectedCity}. Try checking another city or adjusting filters.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Column / Map or Cards Panel */}
          <div className="lg:col-span-4">
            {viewMode === 'map' ? (
              <div className="bg-white border border-border/60 rounded-2xl p-4 shadow-sm">
                <h3 className="font-heading font-bold text-text-dark text-[0.9rem] mb-3 flex items-center gap-1.5">
                  <Building2 className="w-4.5 h-4.5 text-brand-blue" />
                  Stays in {selectedCity}
                </h3>
                <div className="h-[560px] overflow-y-auto pr-2 space-y-4">
                  {filteredPGs.map(pg => (
                    <div 
                      key={pg.id}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${selectedPGId === pg.id ? 'border-brand-blue bg-brand-blue-light/10 shadow-sm' : 'border-border/60 bg-slate-50'}`}
                      onClick={() => setSelectedPGId(pg.id)}
                    >
                      <div className="relative h-28 w-full rounded-lg overflow-hidden mb-2">
                        <Image src={pg.image} alt={pg.name} fill className="object-cover" />
                      </div>
                      <h4 className="font-bold text-xs text-text-dark line-clamp-1">{pg.name}</h4>
                      <p className="text-[10px] text-text-muted mt-0.5">📍 {pg.area}</p>
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-border/40">
                        <span className="text-xs font-extrabold text-brand-blue">{pg.priceDouble}/mo</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveBookingPG(pg);
                            setBookingStep(isLoggedIn ? 1 : 0);
                            setSelectedBed(null);
                            setAgreeTerms(false);
                            setTenantName('');
                          }}
                          className="text-[10px] bg-brand-blue hover:bg-brand-blue-dark text-white px-2.5 py-1 rounded-md font-bold cursor-pointer"
                        >
                          Book
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredPGs.length === 0 && (
                    <p className="text-xs text-text-muted text-center py-8">No matching stays found.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="sticky top-20 bg-white border border-border/60 rounded-2xl overflow-hidden shadow-sm p-4">
                <h3 className="font-heading font-bold text-text-dark text-[0.9rem] mb-3 flex items-center gap-1.5">
                  <Map className="w-4.5 h-4.5 text-brand-blue" />
                  Find PG Around You
                </h3>
                <div className="h-[300px] w-full rounded-xl overflow-hidden border border-border/50">
                  <GoogleMap
                    center={mapCenter}
                    markers={mapMarkers}
                    onMarkerClick={(id) => setSelectedPGId(id)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── BUILDING DETAILS MODAL ────────────────────────────────────── */}
        {activeDetailPG && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-text-dark/60 backdrop-blur-sm animate-fade-in">
            <div className="relative bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-border/40 flex flex-col max-h-[90vh]">
              {/* Header Carousel Area */}
              <div className="relative h-60 sm:h-72 w-full bg-slate-100 flex-shrink-0">
                <Image
                  src={activeDetailPG.image}
                  alt={activeDetailPG.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <button
                  onClick={() => setActiveDetailPG(null)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center font-bold hover:bg-black/60 transition-colors cursor-pointer"
                >
                  ✕
                </button>
                <div className="absolute bottom-5 left-6 right-6 text-white text-left">
                  <div className="flex gap-2 mb-2">
                    <Badge variant="dark" className="bg-white/20 backdrop-blur-md border border-white/20 text-white font-extrabold text-[0.65rem]">{activeDetailPG.gender}</Badge>
                    <Badge variant="blue" className="bg-brand-blue text-white border-0 font-bold text-[0.65rem]"><Shield className="w-3 h-3" /> Verified Listing</Badge>
                  </div>
                  <h2 className="font-heading font-extrabold text-xl sm:text-2xl leading-tight">
                    {activeDetailPG.name}
                  </h2>
                  <p className="text-xs text-white/80 font-medium flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5" /> {activeDetailPG.area}, {activeDetailPG.city}
                  </p>
                </div>
              </div>

              {/* Scrollable details */}
              <div className="p-6 overflow-y-auto space-y-6 text-left">
                {/* Operator info */}
                <div className="flex justify-between items-center bg-brand-blue-light/20 border border-brand-blue/10 p-4 rounded-2xl">
                  <div>
                    <p className="text-[0.6rem] text-text-light font-bold uppercase tracking-wider">Managed & Seeded By</p>
                    <p className="text-xs font-extrabold text-brand-blue">{activeDetailPG.ownerName}</p>
                  </div>
                  <div className="bg-brand-blue/10 px-3 py-1 rounded-xl text-[0.65rem] font-bold text-brand-blue flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-brand-blue" />
                    {activeDetailPG.rating.toFixed(1)} / 5.0 ({activeDetailPG.reviews} reviews)
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="font-heading font-bold text-text-dark text-sm mb-2">About Property</h4>
                  <p className="text-xs text-text-muted leading-relaxed font-semibold">
                    Welcome to {activeDetailPG.name}, a premium co-living facility located at {activeDetailPG.area}, {activeDetailPG.city}. Spanned with modern architectures, daily housekeeping, 24/7 security, and high speed WiFi. The property features fully-furnished single and double sharing configurations styled for early professionals and students.
                  </p>
                </div>

                {/* Room Pricing Options */}
                <div>
                  <h4 className="font-heading font-bold text-text-dark text-sm mb-3">Room Sharing Options</h4>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl border border-border/80 bg-slate-50 flex justify-between items-center">
                      <div>
                        <p className="text-xs font-bold text-text-dark">Double Sharing Room</p>
                        <p className="text-[0.6rem] font-bold text-text-muted mt-0.5">Common Shared Bath</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-extrabold text-brand-blue">{activeDetailPG.priceDouble}/mo</p>
                        <p className="text-[0.55rem] font-bold text-text-light mt-0.5">Deposit: {activeDetailPG.deposit}</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl border border-border/80 bg-slate-50 flex justify-between items-center">
                      <div>
                        <p className="text-xs font-bold text-text-dark">Single Private Room</p>
                        <p className="text-[0.6rem] font-bold text-text-muted mt-0.5">Attached Bath & Balcony</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-extrabold text-brand-blue">{activeDetailPG.priceSingle}/mo</p>
                        <p className="text-[0.55rem] font-bold text-text-light mt-0.5">Deposit: {activeDetailPG.deposit}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Amenities checklist */}
                <div>
                  <h4 className="font-heading font-bold text-text-dark text-sm mb-2.5">What is Included</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {activeDetailPG.amenities.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs font-bold text-text-dark bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-blue" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="p-4 bg-slate-50 border-t border-border-light flex justify-end gap-3 flex-shrink-0">
                <button
                  onClick={() => setActiveDetailPG(null)}
                  className="px-5 py-2.5 border border-border text-xs font-bold text-text-dark rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const pg = activeDetailPG;
                    setActiveDetailPG(null);
                    setActiveBookingPG(pg);
                    setBookingStep(isLoggedIn ? 1 : 0);
                    setSelectedBed(null);
                    setAgreeTerms(false);
                    setTenantName('');
                  }}
                  className="px-6 py-2.5 bg-brand-blue hover:bg-brand-blue-dark text-white text-xs font-bold rounded-xl transition-all shadow-glow hover:shadow-glow-hover cursor-pointer"
                >
                  Book Stay Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── INTERACTIVE BOOKING WORKFLOW MODAL ────────────────────────── */}
        {activeBookingPG && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-text-dark/60 backdrop-blur-sm animate-fade-in">
            <div className="relative bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-border/40 flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="p-5 border-b border-border/50 flex-shrink-0 flex justify-between items-center bg-slate-50">
                <div>
                  <span className="text-[0.6rem] text-text-light font-bold uppercase tracking-wider">Booking Portal</span>
                  <h3 className="font-heading font-extrabold text-text-dark text-base">{activeBookingPG.name}</h3>
                </div>
                <button
                  onClick={() => setActiveBookingPG(null)}
                  className="text-text-muted hover:text-text-dark font-extrabold text-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Steps Indicator */}
              <div className="px-6 py-4 border-b border-border/30 bg-white flex justify-between items-center text-xs font-bold text-text-light flex-shrink-0">
                <div className={`flex items-center gap-1.5 ${bookingStep === 1 ? 'text-brand-blue' : bookingStep > 1 ? 'text-emerald-600' : ''}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${bookingStep === 1 ? 'bg-brand-blue text-white' : bookingStep > 1 ? 'bg-emerald-600 text-white' : 'bg-slate-100'}`}>1</span>
                  <span>Select Bed</span>
                </div>
                <div className="w-10 h-px bg-slate-200" />
                <div className={`flex items-center gap-1.5 ${bookingStep === 2 ? 'text-brand-blue' : bookingStep > 2 ? 'text-emerald-600' : ''}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${bookingStep === 2 ? 'bg-brand-blue text-white' : bookingStep > 2 ? 'bg-emerald-600 text-white' : 'bg-slate-100'}`}>2</span>
                  <span>Digital Lease</span>
                </div>
                <div className="w-10 h-px bg-slate-200" />
                <div className={`flex items-center gap-1.5 ${bookingStep === 3 ? 'text-emerald-600' : ''}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${bookingStep === 3 ? 'bg-emerald-600 text-white' : 'bg-slate-100'}`}>3</span>
                  <span>Confirmation</span>
                </div>
              </div>

              {/* Scrollable Step Content */}
              <div className="p-6 overflow-y-auto space-y-6 text-left flex-1">
                {bookingStep === 1 && (
                  <div className="space-y-5">
                    <div>
                      <label className="text-xs font-bold text-text-dark block mb-2">Choose Sharing Type</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRoomType('Double');
                            setSelectedBed(null);
                          }}
                          className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${selectedRoomType === 'Double' ? 'border-brand-blue bg-brand-blue-light/10 text-brand-blue' : 'border-border bg-slate-50 text-text-muted hover:bg-slate-100'}`}
                        >
                          Double Sharing ({activeBookingPG.priceDouble}/mo)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRoomType('Single');
                            setSelectedBed(null);
                          }}
                          className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${selectedRoomType === 'Single' ? 'border-brand-blue bg-brand-blue-light/10 text-brand-blue' : 'border-border bg-slate-50 text-text-muted hover:bg-slate-100'}`}
                        >
                          Single Private ({activeBookingPG.priceSingle}/mo)
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-text-dark block mb-2">Live Room Layout (Room 101 - 1st Floor)</label>
                      <div className="border border-border/80 rounded-2xl p-4 bg-slate-50 space-y-4">
                        {selectedRoomType === 'Double' ? (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="border border-slate-200 bg-white p-3 rounded-xl flex flex-col justify-between h-28 opacity-80">
                              <div className="flex justify-between items-start">
                                <span className="text-xs font-extrabold text-text-dark">Bed 101-A</span>
                                <span className="text-[9px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full font-bold">Occupied</span>
                              </div>
                              <div className="pt-2 border-t border-slate-100">
                                <p className="text-[10px] font-extrabold text-text-dark">Rahul V.</p>
                                <p className="text-[8px] text-text-muted font-bold">Software Engineer • Non-Smoker</p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => setSelectedBed(selectedBed === 'B' ? null : 'B')}
                              className={`p-3 rounded-xl border flex flex-col justify-between h-28 text-left transition-all cursor-pointer bg-white ${selectedBed === 'B' ? 'border-brand-blue bg-brand-blue-light/5 shadow-sm' : 'border-border hover:border-brand-blue/30'}`}
                            >
                              <div className="flex justify-between items-start w-full">
                                <span className="text-xs font-extrabold text-text-dark">Bed 101-B</span>
                                <span className="text-[9px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold">Available</span>
                              </div>
                              <div className="pt-2 border-t border-slate-100 w-full flex justify-between items-center">
                                <span className="text-[9px] font-extrabold text-brand-blue">Select Bed</span>
                                {selectedBed === 'B' && <Check className="w-3.5 h-3.5 text-brand-blue" />}
                              </div>
                            </button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1">
                            <button
                              type="button"
                              onClick={() => setSelectedBed(selectedBed === 'A' ? null : 'A')}
                              className={`p-3 rounded-xl border flex flex-col justify-between h-28 text-left transition-all cursor-pointer bg-white ${selectedBed === 'A' ? 'border-brand-blue bg-brand-blue-light/5 shadow-sm' : 'border-border hover:border-brand-blue/30'}`}
                            >
                              <div className="flex justify-between items-start w-full">
                                <span className="text-xs font-extrabold text-text-dark">Private Bed 102</span>
                                <span className="text-[9px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold">Available</span>
                              </div>
                              <div className="pt-2 border-t border-slate-100 w-full flex justify-between items-center">
                                <span className="text-[9px] font-extrabold text-brand-blue">Select Room</span>
                                {selectedBed === 'A' && <Check className="w-3.5 h-3.5 text-brand-blue" />}
                              </div>
                            </button>
                          </div>
                        )}

                        {selectedBed && (
                          <div className="bg-brand-blue-light/20 border border-brand-blue/10 px-3 py-2.5 rounded-xl flex items-center gap-2 text-[10px] font-bold text-brand-blue">
                            <Sparkles className="w-4 h-4 flex-shrink-0 animate-pulse" />
                            <span>Roommate Compatibility: 94% compatibility match (Shared interests, same work schedules).</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {bookingStep === 2 && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-text-dark block mb-1.5">Digital Rent Lease Terms</label>
                      <div className="border border-border/80 rounded-2xl p-4 bg-slate-50 max-h-44 overflow-y-auto text-[10px] font-semibold text-text-muted leading-relaxed space-y-2">
                        <p className="font-extrabold text-text-dark">HOMIEPG DIGITAL LEASE AGREEMENT PREVIEW</p>
                        <p>1. PREMISES: The operator ({activeBookingPG.ownerName}) agrees to lease bed {selectedRoomType === 'Double' ? '101-B' : '102'} in {activeBookingPG.name} to the tenant under the terms of this digital contract.</p>
                        <p>2. TERMS: Rent of {selectedRoomType === 'Double' ? activeBookingPG.priceDouble : activeBookingPG.priceSingle}/month is payable in advance on or before the 5th day of each calendar month. Security deposit of {activeBookingPG.deposit} is maintained.</p>
                        <p>3. GENDER BOUND RULES: The property operates under a strict single-gender room occupancy lock. Mixed-gender bookings inside shared rooms are strictly prohibited.</p>
                        <p>4. AMENITIES: Full access to high-speed WiFi, lounge areas, daily housekeeping, and common dining hubs is included.</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold text-text-dark uppercase tracking-wider block mb-1">Enter Your Full Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Rajesh Kumar"
                          value={tenantName}
                          onChange={(e) => setTenantName(e.target.value)}
                          className="w-full h-10 px-3 border border-border/85 rounded-xl text-xs font-bold text-text-dark bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                        />
                      </div>

                      <label className="flex items-start gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={agreeTerms}
                          onChange={(e) => setAgreeTerms(e.target.checked)}
                          className="mt-0.5 rounded border-slate-300 text-brand-blue focus:ring-brand-blue cursor-pointer"
                        />
                        <span className="text-[10px] font-bold text-text-muted leading-snug">
                          I agree to complete digital KYC verification and sign this electronic lease contract on the HomiePG network.
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                {bookingStep === 3 && (
                  <div className="text-center py-6 space-y-4">
                    <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-2xl mx-auto shadow-md animate-bounce">
                      ✓
                    </div>
                    <div>
                      <h4 className="font-heading font-extrabold text-text-dark text-base">Booking Request Submitted!</h4>
                      <p className="text-xs text-text-muted font-medium mt-1">Your stay at {activeBookingPG.name} is provisionally reserved.</p>
                    </div>
                    <div className="bg-slate-50 border border-border/50 p-4 rounded-2xl max-w-sm mx-auto space-y-2 text-left text-[11px] font-bold text-text-dark">
                      <div className="flex justify-between">
                        <span className="text-text-light">Booking Code:</span>
                        <span>HPG-{Math.floor(100000 + Math.random() * 900000)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-light">Allotted Bed:</span>
                        <span>Room 101, Bed {selectedRoomType === 'Double' ? 'B' : 'A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-light">Electronic Lease:</span>
                        <span className="text-brand-blue font-extrabold">✓ Signed & Registered</span>
                      </div>
                    </div>
                    <div className="pt-2">
                      <p className="text-[10px] font-bold text-text-muted max-w-xs mx-auto leading-relaxed">
                        Please log into the **HomiePG Tenant Mobile App** using your credentials to upload identity documents and clear operations verification queue.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-4 bg-slate-50 border-t border-border-light flex justify-end gap-3 flex-shrink-0">
                {bookingStep === 0 && (
                  <button
                    onClick={() => setActiveBookingPG(null)}
                    className="px-5 py-2.5 border border-border text-xs font-bold text-text-dark rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                )}

                {bookingStep === 1 && (
                  <>
                    <button
                      onClick={() => setActiveBookingPG(null)}
                      className="px-5 py-2.5 border border-border text-xs font-bold text-text-dark rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={!selectedBed}
                      onClick={() => setBookingStep(2)}
                      className="px-5 py-2.5 bg-brand-blue hover:bg-brand-blue-dark disabled:bg-slate-200 disabled:text-text-light text-white text-xs font-bold rounded-xl transition-all shadow-sm disabled:shadow-none cursor-pointer"
                    >
                      Proceed to Lease
                    </button>
                  </>
                )}

                {bookingStep === 2 && (
                  <>
                    <button
                      onClick={() => setBookingStep(1)}
                      className="px-5 py-2.5 border border-border text-xs font-bold text-text-dark rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      disabled={!agreeTerms || !tenantName.trim()}
                      onClick={() => setBookingStep(3)}
                      className="px-5 py-2.5 bg-brand-blue hover:bg-brand-blue-dark disabled:bg-slate-200 disabled:text-text-light text-white text-xs font-bold rounded-xl transition-all shadow-glow hover:shadow-glow-hover disabled:shadow-none cursor-pointer"
                    >
                      Sign & Complete
                    </button>
                  </>
                )}

                {bookingStep === 3 && (
                  <button
                    onClick={() => setActiveBookingPG(null)}
                    className="px-6 py-2.5 bg-brand-blue hover:bg-brand-blue-dark text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Return to Search
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-[#F8FAFC] min-h-screen py-16 text-center">
          <Container>
            <div className="max-w-md mx-auto">
              <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm font-bold text-text-muted">Loading verified PGs list...</p>
            </div>
          </Container>
        </div>
      }
    >
      <SearchResults />
    </Suspense>
  );
}
