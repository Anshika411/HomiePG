-- Seed Amenities
INSERT INTO public.amenities (id, name) VALUES
  (gen_random_uuid(), 'WiFi'),
  (gen_random_uuid(), 'Laundry'),
  (gen_random_uuid(), 'Power Backup'),
  (gen_random_uuid(), 'Food'),
  (gen_random_uuid(), 'Parking'),
  (gen_random_uuid(), 'Lift'),
  (gen_random_uuid(), 'CCTV'),
  (gen_random_uuid(), 'RO Water')
ON CONFLICT (name) DO NOTHING;
