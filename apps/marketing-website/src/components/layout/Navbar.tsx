'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useScrolled } from '@/hooks/useScrolled';
import { NAV_LINKS } from '@/constants/navigation';
import { CITIES } from '@/constants/cities';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, X, ChevronDown, Home, MapPin, Navigation
} from 'lucide-react';

// ─── Desktop Dropdown ─────────────────────────────────────────────────
function NavDropdown({ items }: { items: NonNullable<typeof NAV_LINKS[0]['children']> }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-52 bg-white rounded-2xl border border-border shadow-card-hover z-[110] overflow-hidden py-1"
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="block px-4 py-2.5 text-caption text-text-dark hover:bg-brand-blue-light hover:text-brand-blue transition-colors"
        >
          {item.label}
        </Link>
      ))}
    </motion.div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────
export default function Navbar() {
  const scrolled = useScrolled(20);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [location, setLocation] = useState("Bangalore"); // Default to Bangalore to avoid "Fetching..." delay
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const locationDropdownRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const pathname = usePathname();

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(e.target as Node)) {
        setLocationDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const updateSelectedCity = (cityName: string, persist = true) => {
    setLocation(cityName);
    if (persist) {
      localStorage.setItem('homiepg-selected-city', cityName);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('homiepg-location-changed', { detail: cityName }));
    }
    setLocationDropdownOpen(false);

    if (pathname === '/search') {
      const isSupported = CITIES.some(
        (c) => c.name.toLowerCase() === cityName.toLowerCase()
      );
      if (isSupported) {
        const searchParams = new URLSearchParams(window.location.search);
        searchParams.set('city', cityName);
        searchParams.delete('locality');
        router.push(`/search?${searchParams.toString()}`);
      }
    }
  };

  const detectLocation = (persist = false) => {
    if (!navigator.geolocation) {
      if (!localStorage.getItem('homiepg-selected-city')) {
        updateSelectedCity('Bangalore', false);
      }
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}`
          );

          const data = await res.json();

          const detectedCity =
            data.address.city ||
            data.address.town ||
            data.address.village ||
            data.address.state;

          if (detectedCity) {
            const matched = CITIES.find(
              (c) =>
                c.name.toLowerCase() === detectedCity.toLowerCase() ||
                c.slug.toLowerCase() === detectedCity.toLowerCase()
            );

            const locationName = matched ? matched.name : detectedCity;
            updateSelectedCity(locationName, persist);
          } else {
            if (!localStorage.getItem('homiepg-selected-city')) {
              updateSelectedCity('Bangalore', false);
            }
          }
        } catch (error) {
          console.error('Error reverse geocoding location:', error);
          if (!localStorage.getItem('homiepg-selected-city')) {
            updateSelectedCity('Bangalore', false);
          }
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        if (!localStorage.getItem('homiepg-selected-city')) {
          updateSelectedCity('Bangalore', false);
        }
      }
    );
  };

  useEffect(() => {
    const saved = localStorage.getItem('homiepg-selected-city');
    if (saved) {
      setLocation(saved);
    } else {
      detectLocation(false);
    }
  }, []);

  return (
    <>
      <header
        role="banner"
        className={cn(
          'fixed top-0 inset-x-0 z-[100] transition-all duration-300',
          scrolled
            ? 'bg-white/95 backdrop-blur-glass shadow-nav border-b border-border'
            : 'bg-white/80 backdrop-blur-sm'
        )}
      >
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0" aria-label="HomiePG Home">
              <Image src="/logo.png" alt="HomiePG Logo" width={34} height={34} className="h-8.5 w-8.5 object-contain" priority />
              <span className="font-heading font-bold text-lg text-text-dark">
                Homie<span className="text-brand-blue">PG</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav
              ref={dropdownRef}
              className="hidden lg:flex items-center gap-1"
              aria-label="Main navigation"
            >
              {NAV_LINKS.map((link) => (
                <div key={link.label} className="relative">
                  {link.children ? (
                    <button
                      type="button"
                      className={cn(
                        'flex items-center gap-1 px-3 py-2 rounded-lg text-[0.875rem] font-medium',
                        'text-text-muted hover:text-brand-blue hover:bg-brand-blue-light',
                        'transition-all duration-DEFAULT focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue',
                        activeDropdown === link.label && 'text-brand-blue bg-brand-blue-light'
                      )}
                      onClick={() =>
                        setActiveDropdown(activeDropdown === link.label ? null : link.label)
                      }
                      aria-expanded={activeDropdown === link.label}
                      aria-haspopup="true"
                    >
                      {link.label}
                      <ChevronDown
                        className={cn(
                          'w-3.5 h-3.5 transition-transform duration-200',
                          activeDropdown === link.label && 'rotate-180'
                        )}
                        aria-hidden
                      />
                    </button>
                  ) : (
                    <Link
                      href={link.href}
                      className={cn(
                        'flex items-center px-3 py-2 rounded-lg text-[0.875rem] font-medium',
                        'text-text-muted hover:text-brand-blue hover:bg-brand-blue-light',
                        'transition-all duration-DEFAULT focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue'
                      )}
                    >
                      {link.label}
                    </Link>
                  )}

                  {/* Dropdown */}
                  <AnimatePresence>
                    {link.children && activeDropdown === link.label && (
                      <NavDropdown items={link.children} />
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </nav>

            {/* Location Selector (Responsive) */}
            <div className="relative flex items-center" ref={locationDropdownRef}>
              <button
                type="button"
                onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
                className="flex items-center gap-1 px-2.5 py-1.5 lg:px-3 lg:py-2 rounded-xl text-xs lg:text-sm font-semibold text-text-muted hover:text-brand-blue hover:bg-brand-blue-light transition-all duration-200"
                aria-expanded={locationDropdownOpen}
                aria-haspopup="true"
              >
                <MapPin className="w-3.5 h-3.5 lg:w-4.5 lg:h-4.5 text-brand-blue flex-shrink-0" />
                <span className="truncate max-w-[70px] lg:max-w-[120px]">{location}</span>
                <ChevronDown className={cn("w-3 h-3 lg:w-3.5 lg:h-3.5 text-text-muted transition-transform duration-200", locationDropdownOpen && "rotate-180")} />
              </button>

              <AnimatePresence>
                {locationDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="absolute right-0 top-full mt-2 w-48 lg:w-56 bg-white rounded-2xl border border-border shadow-card-hover z-[110] overflow-hidden p-2"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        detectLocation(true);
                        setLocationDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-[10px] lg:text-xs font-bold text-brand-blue hover:bg-brand-blue-light rounded-xl transition-colors text-left"
                    >
                      <Navigation className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                      Detect Current Location
                    </button>
                    <div className="h-px bg-border my-1.5" />
                    <div className="max-h-60 overflow-y-auto space-y-0.5">
                      {CITIES.map((city) => (
                        <button
                          key={city.slug}
                          type="button"
                          onClick={() => updateSelectedCity(city.name)}
                          className={cn(
                            "w-full block px-3 py-2 lg:py-2.5 text-xs lg:text-caption text-text-dark hover:bg-brand-blue-light hover:text-brand-blue rounded-xl transition-colors text-left font-medium",
                            location === city.name && "text-brand-blue bg-brand-blue-light font-semibold"
                          )}
                        >
                          {city.name}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
              <Link
                href="/auth?mode=login"
                className={cn(
                  'inline-flex items-center justify-center gap-2 h-10 px-5 text-sm font-semibold rounded-xl',
                  'text-text-muted hover:text-text-dark hover:bg-bg-muted transition-all duration-DEFAULT'
                )}
              >
                Login
              </Link>
              <Link
                href="/owners"
                className="inline-flex items-center justify-center gap-2 h-10 px-5 text-sm font-semibold rounded-xl bg-brand-blue text-white hover:bg-brand-blue-dark shadow-glow hover:-translate-y-0.5 transition-all duration-DEFAULT"
              >
                List Your PG
              </Link>
            </div>

            {/* Mobile Hamburger */}
            <button
              type="button"
              className={cn(
                'lg:hidden flex items-center justify-center w-9 h-9 rounded-lg',
                'text-text-muted hover:text-text-dark hover:bg-bg-muted transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue'
              )}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <AnimatePresence mode="wait" initial={false}>
                {mobileOpen ? (
                  <motion.span
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <X className="w-5 h-5" aria-hidden />
                  </motion.span>
                ) : (
                  <motion.span
                    key="open"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Menu className="w-5 h-5" aria-hidden />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[99] bg-text-dark/40 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
              aria-hidden
            />

            {/* Slide-in Drawer */}
            <motion.nav
              id="mobile-nav"
              key="drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed top-0 right-0 bottom-0 z-[100] w-[300px] bg-white shadow-card-hover flex flex-col lg:hidden"
              aria-label="Mobile navigation"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <Link
                  href="/"
                  className="flex items-center gap-2"
                  onClick={() => setMobileOpen(false)}
                >
                  <div className="w-7 h-7 rounded-md bg-brand-blue flex items-center justify-center">
                    <Home className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="font-heading font-bold text-text-dark">
                    Homie<span className="text-brand-blue">PG</span>
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:bg-bg-muted transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" aria-hidden />
                </button>
              </div>

              {/* Nav Links */}
              <div className="flex-1 overflow-y-auto py-3 px-3">
                {NAV_LINKS.map((link, i) => (
                  <div key={link.label}>
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center px-4 py-3 rounded-xl text-body font-medium',
                        'text-text-dark hover:bg-brand-blue-light hover:text-brand-blue transition-colors'
                      )}
                    >
                      {link.label}
                    </Link>
                    {link.children && (
                      <div className="ml-4 pl-3 border-l-2 border-border-light mb-1">
                        {link.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setMobileOpen(false)}
                            className="block px-3 py-2 text-caption text-text-muted hover:text-brand-blue transition-colors"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Mobile Location Selector */}
              <div className="px-4 py-3 border-t border-border">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Select City</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {CITIES.map((city) => (
                    <button
                      key={city.slug}
                      type="button"
                      onClick={() => {
                        updateSelectedCity(city.name);
                        setMobileOpen(false);
                      }}
                      className={cn(
                        "flex items-center justify-center h-9 px-2 text-xs font-semibold rounded-xl border transition-colors",
                        location === city.name
                          ? "bg-brand-blue/10 border-brand-blue text-brand-blue"
                          : "border-border text-text-dark hover:bg-bg-muted"
                      )}
                    >
                      {city.name}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    detectLocation(true);
                    setMobileOpen(false);
                  }}
                  className="w-full flex-shrink-0 flex items-center justify-center gap-1.5 h-9 mt-2 text-xs font-bold text-brand-blue bg-brand-blue-light rounded-xl transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  Detect Location
                </button>
              </div>

              {/* Drawer CTA */}
              <div className="p-4 border-t border-border space-y-2">
                <Link
                  href="/auth?mode=login"
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center justify-center w-full h-11 rounded-xl border-2 border-border',
                    'text-body font-semibold text-text-dark hover:border-brand-blue hover:text-brand-blue transition-colors'
                  )}
                >
                  Login
                </Link>
                <Link
                  href="/owners"
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center justify-center w-full h-11 rounded-xl',
                    'bg-brand-blue text-white text-body font-semibold hover:bg-brand-blue-dark transition-colors'
                  )}
                >
                  List Your PG
                </Link>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {/* Spacer to prevent content from hiding behind fixed navbar */}
      <div className="h-16" aria-hidden />
    </>
  );
}
