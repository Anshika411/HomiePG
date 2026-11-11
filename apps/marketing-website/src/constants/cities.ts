export type City = {
  name: string;
  slug: string;
  state: string;
  pgCount: string;
  image: string;
};

export const CITIES: City[] = [
  { name: 'Bangalore', slug: 'bangalore', state: 'Karnataka', pgCount: '2,450+', image: '/images/cities/bangalore.jpg' },
  { name: 'Delhi', slug: 'delhi', state: 'Delhi NCR', pgCount: '3,120+', image: '/images/cities/delhi.jpg' },
  { name: 'Mumbai', slug: 'mumbai', state: 'Maharashtra', pgCount: '2,980+', image: '/images/cities/mumbai.jpg' },
  { name: 'Hyderabad', slug: 'hyderabad', state: 'Telangana', pgCount: '1,890+', image: '/images/cities/hyderabad.jpg' },
  { name: 'Pune', slug: 'pune', state: 'Maharashtra', pgCount: '1,750+', image: '/images/cities/pune.jpg' },
  { name: 'Chennai', slug: 'chennai', state: 'Tamil Nadu', pgCount: '1,620+', image: '/images/cities/chennai.jpg' },
  { name: 'Gurgaon', slug: 'gurgaon', state: 'Haryana', pgCount: '980+', image: '/images/cities/gurgaon.jpg' },
  { name: 'Noida', slug: 'noida', state: 'Uttar Pradesh', pgCount: '760+', image: '/images/cities/noida.jpg' },
];

export const GENDER_OPTIONS = [
  { label: 'Anyone', value: '' },
  { label: 'Male', value: 'Male' },
  { label: 'Female', value: 'Female' },
  { label: 'Co-Living', value: 'Co-Living' },
];
