'use client';

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    google: any;
    initGoogleMapCallback: () => void;
  }
}

type PGMarker = {
  id: string;
  lat: number;
  lng: number;
  title: string;
  price: string;
  image: string;
  area: string;
};

type MapProps = {
  center: { lat: number; lng: number };
  zoom?: number;
  markers: PGMarker[];
  onMarkerClick?: (id: string) => void;
};

export default function GoogleMap({ center, zoom = 13, markers, onMarkerClick }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
      setLoadError(true);
      return;
    }

    // Define global initialization callback
    (window as any).initGoogleMapCallback = () => {
      setMapLoaded(true);
    };

    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initGoogleMapCallback`;
      script.async = true;
      script.defer = true;
      script.onerror = () => setLoadError(true);
      document.head.appendChild(script);
    } else {
      setMapLoaded(true);
    }

    return () => {
      delete (window as any).initGoogleMapCallback;
    };
  }, []);

  useEffect(() => {
    if (!mapLoaded || !window.google || !mapRef.current) return;

    // Initialize Google Map (default fully-colored style)
    const map = new window.google.maps.Map(mapRef.current, {
      center,
      zoom,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      scaleControl: true,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: true
    });

    const infoWindow = new window.google.maps.InfoWindow();

    const mapMarkers = markers.map((m) => {
      // Create price label marker
      const marker = new window.google.maps.Marker({
        position: { lat: m.lat, lng: m.lng },
        map,
        title: m.title,
        label: {
          text: m.price,
          color: '#FFFFFF',
          fontWeight: '700',
          fontSize: '11px',
        },
        icon: {
          path: 'M 0,-15 A 15,15 0 1,1 0,15 A 15,15 0 1,1 0,-15 Z', // circular path
          fillColor: '#2563EB', // Brand blue
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2.5,
          scale: 1.2,
          labelOrigin: new window.google.maps.Point(0, 0),
        },
      });

      marker.addListener('click', () => {
        // Render rich HTML inside InfoWindow
        infoWindow.setContent(`
          <div style="font-family: Inter, system-ui, sans-serif; width: 220px; border-radius: 12px; overflow: hidden; padding: 4px;">
            <div style="position: relative; height: 110px; width: 100%; border-radius: 8px; overflow: hidden; margin-bottom: 8px;">
              <img src="${m.image}" alt="${m.title}" style="object-fit: cover; width: 100%; height: 100%; border-radius: 8px;" />
            </div>
            <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: 800; color: #0F172A; line-height: 1.4;">${m.title}</h4>
            <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 500; color: #64748B;">📍 ${m.area}</p>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 4px; border-t: 1px solid #F1F5F9; pt: 4px;">
              <span style="font-size: 12px; font-weight: 800; color: #2563EB;">Rent starting ${m.price}</span>
            </div>
          </div>
        `);
        infoWindow.open(map, marker);
        if (onMarkerClick) {
          onMarkerClick(m.id);
        }
      });

      return marker;
    });

    // Auto-fit bounds if we have multiple markers
    if (markers.length > 1) {
      const bounds = new window.google.maps.LatLngBounds();
      markers.forEach((m) => bounds.extend({ lat: m.lat, lng: m.lng }));
      map.fitBounds(bounds);
      // Ensure we don't zoom in too close
      const listener = window.google.maps.event.addListener(map, 'idle', () => {
        if (map.getZoom() > 14) map.setZoom(13);
        window.google.maps.event.removeListener(listener);
      });
    }

    return () => {
      mapMarkers.forEach((m) => m.setMap(null));
      infoWindow.close();
    };
  }, [mapLoaded, center, zoom, markers, onMarkerClick]);

  if (loadError) {
    return (
      <div className="relative h-full w-full bg-slate-100 flex flex-col items-center justify-center p-6 text-center rounded-xl border border-border/40">
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] [background-size:16px_16px] pointer-events-none" />
        <span className="text-2xl mb-2 z-10">🗺️</span>
        <div className="font-heading font-bold text-text-dark text-xs relative z-10">Google Maps Unavailable</div>
        <div className="text-[0.65rem] text-text-muted mt-1 max-w-xs relative z-10 font-semibold leading-relaxed">
          Please add a valid Google Maps API Key to <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>. Falls back to design placeholder mode.
        </div>
      </div>
    );
  }

  if (!mapLoaded) {
    return (
      <div className="h-full w-full bg-slate-50 flex items-center justify-center rounded-xl border border-border/40 min-h-[300px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
          <span className="text-[10px] text-text-muted font-bold tracking-wide">LOADING GOOGLE MAP...</span>
        </div>
      </div>
    );
  }

  return <div ref={mapRef} className="h-full w-full rounded-xl overflow-hidden shadow-inner min-h-[300px]" />;
}
