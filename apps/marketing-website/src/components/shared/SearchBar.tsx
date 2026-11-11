'use client';

import { useState } from 'react';
import { Search, MapPin, Users, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { GENDER_OPTIONS } from '@/constants/cities';
import { cn } from '@/lib/utils';

type SearchBarProps = {
  initialCity?: string;
  initialGender?: string;
  onSearch: (filters: { city: string; gender: string; moveIn?: string }) => void;
  className?: string;
  compact?: boolean;
};

export function SearchBar({
  initialCity = '',
  initialGender = '',
  onSearch,
  className,
  compact = false,
}: SearchBarProps) {
  const [city, setCity] = useState(initialCity);
  const [gender, setGender] = useState(initialGender);
  const [moveIn, setMoveIn] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ city, gender, moveIn });
  };

  if (compact) {
    return (
      <form
        onSubmit={handleSubmit}
        className={cn(
          'flex items-center gap-2 p-1.5 bg-white border border-border rounded-xl shadow-card w-full max-w-2xl',
          className
        )}
      >
        <div className="flex-1 flex items-center relative pl-3">
          <MapPin className="w-4 h-4 text-text-light flex-shrink-0" />
          <input
            type="text"
            placeholder="Search by city..."
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full h-9 pl-2 text-sm bg-transparent border-0 focus:outline-none focus:ring-0 text-text-dark placeholder:text-text-light"
          />
        </div>
        <div className="w-px h-6 bg-border hidden sm:block" />
        <div className="flex-shrink-0 relative hidden sm:flex items-center pl-2">
          <Users className="w-4 h-4 text-text-light flex-shrink-0" />
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="h-9 pl-2 pr-6 text-sm bg-transparent border-0 focus:outline-none focus:ring-0 text-text-dark appearance-none select-none font-medium cursor-pointer"
          >
            {GENDER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" size="sm" className="h-9 px-4 rounded-lg flex-shrink-0">
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Search</span>
        </Button>
      </form>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'w-full bg-white border border-border rounded-2xl shadow-card p-4 sm:p-5',
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end',
        className
      )}
    >
      <div>
        <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">
          Enter City
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light pointer-events-none" />
          <input
            type="text"
            placeholder="e.g. Bangalore"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full h-11 pl-9 pr-4 rounded-xl border border-border text-body text-text-dark placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">
          Move In Date
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light pointer-events-none" />
          <input
            type="date"
            value={moveIn}
            onChange={(e) => setMoveIn(e.target.value)}
            className="w-full h-11 pl-9 pr-4 rounded-xl border border-border text-body text-text-dark focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">
          For (Gender)
        </label>
        <div className="relative">
          <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light pointer-events-none" />
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full h-11 pl-9 pr-4 rounded-xl border border-border text-body text-text-dark focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-all appearance-none bg-white"
          >
            {GENDER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <Button type="submit" className="w-full h-11 shadow-glow hover:shadow-glow hover:-translate-y-0.5">
          <Search className="w-4 h-4" />
          Search PGs
        </Button>
      </div>
    </form>
  );
}
