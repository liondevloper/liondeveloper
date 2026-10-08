import { useEffect, useState } from 'react';

export type Stat = { value: string; label: string };
export type Service = { icon: string; title: string; description: string };
export type ProjectAccent = 'gold' | 'blue' | 'dark';
export type Project = {
  title: string;
  category: string;
  description: string;
  accent: ProjectAccent;
  features: string[];
  tech: string[];
};
export type Plan = {
  name: string;
  price: string;
  description: string;
  popular: boolean;
  features: string[];
  cta: string;
};
export type Testimonial = { quote: string; author: string; role: string; rating: number };
export type Faq = { question: string; answer: string };

export type SiteContent = {
  contact: { email: string; whatsapp: string; whatsappMessage: string; instagram: string; instagramUrl: string };
  hero: { badge: string; headline: string; text: string };
  stats: Stat[];
  services: Service[];
  projects: Project[];
  pricing: Plan[];
  technologies: string[];
  testimonials: Testimonial[];
  faqs: Faq[];
};

export const SERVICE_ICONS = [
  'Globe',
  'MousePointerClick',
  'ShoppingBag',
  'PanelsTopLeft',
  'LayoutDashboard',
  'CalendarCheck2',
  'PlugZap',
  'Wrench',
] as const;

export const PROJECT_ACCENTS: ProjectAccent[] = ['gold', 'blue', 'dark'];

export const siteConfig = {
  brand: 'LION DEVELOPER',
  shortBrand: 'Lion Developer',
  tagline: 'Websites. Apps. Digital Solutions.',
};

export const defaultContent: SiteContent = {
  contact: {
    email: 'liondevloper@gmail.com',
    whatsapp: '',
    whatsappMessage: 'Hi Lion Developer, I want a website for my business.',
    instagram: '@lion_devloper',
    instagramUrl: 'https://www.instagram.com/lion_devloper/',
  },
  hero: {
    badge: 'Available for New Projects',
    headline: 'We build websites that *grow* your business.',
    text: 'Modern websites, web applications and digital solutions designed to help businesses build a stronger online presence and turn visitors into customers.',
  },
  stats: [
    { value: '50+', label: 'Projects' },
    { value: '30+', label: 'Clients' },
    { value: '100%', label: 'Responsive' },
    { value: '24/7', label: 'Support' },
  ],
  services: [
    { icon: 'Globe', title: 'Business Websites', description: 'Professional websites for businesses, companies, local brands and professionals.' },
    { icon: 'MousePointerClick', title: 'Landing Pages', description: 'Modern, conversion-focused landing pages for products, services and campaigns.' },
    { icon: 'ShoppingBag', title: 'E-Commerce Websites', description: 'Online stores with product catalogues and business functionality.' },
    { icon: 'PanelsTopLeft', title: 'Custom Web Applications', description: 'Custom web applications built around specific business requirements.' },
    { icon: 'LayoutDashboard', title: 'Admin Panels', description: 'Powerful dashboards for managing users, bookings, products, content and data.' },
    { icon: 'CalendarCheck2', title: 'Booking Systems', description: 'Online booking and appointment systems with WhatsApp integration.' },
    { icon: 'PlugZap', title: 'API Integration', description: 'Payment gateways, maps, authentication, shipping, messaging and third-party APIs.' },
    { icon: 'Wrench', title: 'Maintenance & Support', description: 'Bug fixes, updates, improvements, deployment and ongoing technical support.' },
  ],
  projects: [
    {
      title: 'Bold & Brilliant by Janvi',
      category: 'Nail Studio / Beauty',
      description: 'A refined digital presence for a beauty studio with a clear path from inspiration to booking.',
      accent: 'gold',
      features: ['Service showcase', 'Booking', 'WhatsApp integration', 'Responsive design'],
      tech: ['React', 'UI/UX', 'Responsive'],
    },
    {
      title: 'The Imperial Palace',
      category: 'Hotel / Hospitality',
      description: 'An elegant hospitality experience designed to turn room discovery into direct enquiries.',
      accent: 'blue',
      features: ['Hotel showcase', 'Rooms', 'Gallery', 'Enquiry system'],
      tech: ['React', 'UI/UX', 'Forms'],
    },
    {
      title: 'Your Next Digital Experience',
      category: 'Available for your brand',
      description: 'Your business could be the next case study. Let’s create something clear, credible and built to convert.',
      accent: 'dark',
      features: ['Custom direction', 'Premium design', 'Business focused'],
      tech: ['Strategy', 'Design', 'Development'],
    },
  ],
  pricing: [
    {
      name: 'Starter',
      price: '₹8,000',
      description: 'A polished launchpad for a focused online presence.',
      popular: false,
      features: ['1–5 pages', 'Responsive design', 'Modern UI', 'WhatsApp button', 'Contact form', 'Basic SEO', 'Mobile optimization', 'Deployment'],
      cta: 'Get Started',
    },
    {
      name: 'Business',
      price: '₹12,000',
      description: 'A premium website built to support your next stage of growth.',
      popular: true,
      features: ['Up to 10 pages', 'Premium UI/UX', 'WhatsApp integration', 'Booking/enquiry form', 'Basic SEO', 'Performance optimization', 'Deployment', 'Basic support'],
      cta: 'Get Started',
    },
    {
      name: 'Professional',
      price: '₹18,000+',
      description: 'Advanced functionality for businesses with bigger requirements.',
      popular: false,
      features: ['Custom UI/UX', 'Advanced functionality', 'Admin panel', 'Database', 'Authentication', 'API integrations', 'Custom features', 'Technical support'],
      cta: 'Request Quote',
    },
    {
      name: 'Custom Project',
      price: "Let's Discuss",
      description: 'For ambitious products and systems that need a tailored approach.',
      popular: false,
      features: ['SaaS products', 'Custom web applications', 'Advanced dashboards', 'E-commerce systems', 'Business management systems', 'Complex integrations'],
      cta: 'Talk To Me',
    },
  ],
  technologies: ['HTML5', 'CSS3', 'JavaScript', 'React', 'Node.js', 'PHP', 'Laravel', 'Firebase', 'Supabase', 'REST APIs', 'Cloudflare', 'Vercel', 'GitHub'],
  testimonials: [],
  faqs: [
    { question: 'How much does a website cost?', answer: 'Website packages start from ₹8,000. Final pricing depends on pages, features and integrations.' },
    { question: 'How long does a website take?', answer: 'Timeline depends on the project scope and required functionality. A clear timeline is shared before work begins.' },
    { question: 'Do you provide domain and hosting?', answer: 'Yes. Assistance with domain, hosting and deployment is available.' },
    { question: 'Can you build an admin panel?', answer: 'Yes. Custom admin panels can be developed when required.' },
    { question: 'Can you integrate WhatsApp?', answer: 'Yes. WhatsApp enquiry and booking functionality can be integrated.' },
    { question: 'Do you provide maintenance?', answer: 'Yes. Website updates, fixes and improvements can be provided.' },
  ],
};

const list = <T,>(value: unknown, fallback: T[]): T[] => (Array.isArray(value) ? (value as T[]) : fallback);

// Stored content only holds what the admin saved; anything missing falls back to the defaults above.
export function mergeContent(stored: unknown): SiteContent {
  if (!stored || typeof stored !== 'object') return defaultContent;
  const raw = stored as Partial<SiteContent>;
  return {
    contact: { ...defaultContent.contact, ...(raw.contact ?? {}) },
    hero: { ...defaultContent.hero, ...(raw.hero ?? {}) },
    stats: list(raw.stats, defaultContent.stats),
    services: list(raw.services, defaultContent.services),
    projects: list(raw.projects, defaultContent.projects),
    pricing: list(raw.pricing, defaultContent.pricing),
    technologies: list(raw.technologies, defaultContent.technologies),
    testimonials: list(raw.testimonials, defaultContent.testimonials),
    faqs: list(raw.faqs, defaultContent.faqs),
  };
}

export async function fetchContent(): Promise<SiteContent> {
  const response = await fetch('/api/content');
  if (!response.ok) throw new Error('Could not load content');
  return mergeContent(await response.json());
}

// The site paints with the defaults, then swaps in whatever the admin saved.
export function useSiteContent(): SiteContent {
  const [content, setContent] = useState<SiteContent>(defaultContent);

  useEffect(() => {
    let active = true;
    fetchContent()
      .then((loaded) => {
        if (active) setContent(loaded);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return content;
}

// Indian numbers are usually typed without the country code, so 10 digits get a 91 prefix.
export function whatsappLink(number: string, message?: string) {
  const digits = number.replace(/\D/g, '');
  if (digits.length < 10) return null;
  const to = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${to}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
}
