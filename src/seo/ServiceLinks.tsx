import { BUSINESS } from '@/data/business';

// One footer for the whole site. The static pages in public/ carry the same markup, and both use
// public/services/footer.css, so the footer and logo look identical on every page.
export const SERVICE_PAGES = [
  { href: '/services/business-website-development/', label: 'Business Websites' },
  { href: '/services/landing-page-design/', label: 'Landing Pages' },
  { href: '/services/ecommerce-website-development/', label: 'E-commerce' },
  { href: '/services/custom-web-application-development/', label: 'Web Applications' },
  { href: '/services/admin-panel-development/', label: 'Admin Panels' },
  { href: '/services/booking-system-development/', label: 'Booking Systems' },
];

export const REGION_PAGES = [
  { href: '/website-development-usa/', label: 'USA' },
  { href: '/website-development-uk/', label: 'UK' },
  { href: '/website-development-dubai/', label: 'Dubai & UAE' },
];

const COMPANY_LINKS = [
  { href: '/services/', label: 'All services' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#templates', label: 'Work' },
  { href: '#faq', label: 'FAQ' },
  { href: '/blog/', label: 'Blog' },
];

const CONTACT_LINKS = [
  { href: BUSINESS.whatsappUrl, label: `WhatsApp ${BUSINESS.whatsapp}` },
  { href: `mailto:${BUSINESS.email}`, label: BUSINESS.email },
  { href: BUSINESS.instagramUrl, label: 'Instagram' },
  { href: BUSINESS.facebookUrl, label: 'Facebook' },
];

const COLUMNS = [
  { title: 'Services', links: SERVICE_PAGES },
  { title: 'Company', links: COMPANY_LINKS },
  { title: 'Clients worldwide', links: REGION_PAGES },
  { title: 'Contact', links: CONTACT_LINKS },
];

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="sf-wrap">
        <div className="sf-brand">
          <a className="sf-logo" href="/">
            <img src="/brand/lion-logo.png" alt="Lion Digital Solution" width={56} height={40} loading="lazy" />
            <span><strong>LION</strong><small>DIGITAL SOLUTION</small></span>
          </a>
          <p>Modern websites, web apps and digital solutions for businesses in India, the USA, the UK and the UAE.</p>
          <a className="sf-cta" href={BUSINESS.whatsappUrl} target="_blank" rel="noreferrer">Chat on WhatsApp</a>
        </div>
        {COLUMNS.map((column) => (
          <nav className="sf-col" aria-label={column.title} key={column.title}>
            <p className="sf-title">{column.title}</p>
            {column.links.map((link) => <a key={link.href} href={link.href}>{link.label}</a>)}
          </nav>
        ))}
      </div>
      <div className="sf-bottom">© {new Date().getFullYear()} Lion Digital Solution. All rights reserved.</div>
    </footer>
  );
}
