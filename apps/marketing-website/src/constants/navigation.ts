export type NavItem = {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
};

export const NAV_LINKS: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'For Owners', href: '/owners' },
  {
    label: 'For Users', href: '/search',
    children: [
      { label: 'Search PG', href: '/search' },
      { label: 'Cities', href: '/cities' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Blog', href: '/blog' },
    ]
  },
  { label: 'About Us', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export const FOOTER_LINKS = {
  company: [
    { label: 'About Us', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Blog', href: '/blog' },
    { label: 'Contact Us', href: '/contact' },
  ],
  forTenants: [
    { label: 'Search PG', href: '/search' },
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'Safety Tips', href: '/safety' },
    { label: 'FAQs', href: '/faqs' },
  ],
  forOwners: [
    { label: 'List Your PG', href: '/owners' },
    { label: 'Owner Login', href: '/auth?role=owner' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Resources', href: '/resources' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms & Conditions', href: '/terms' },
    { label: 'Refund Policy', href: '/refund' },
  ],
};
