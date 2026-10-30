import './service-links.css';

// Plain links to the static pages in public/, so visitors and Google can reach them from the homepage.
export const SERVICE_PAGES = [
  { href: '/services/business-website-development/', label: 'Business Website Development' },
  { href: '/services/landing-page-design/', label: 'Landing Page Design' },
  { href: '/services/ecommerce-website-development/', label: 'E-commerce Website Development' },
  { href: '/services/custom-web-application-development/', label: 'Custom Web Applications' },
  { href: '/services/admin-panel-development/', label: 'Admin Panel Development' },
  { href: '/services/booking-system-development/', label: 'Online Booking Systems' },
];

export const REGION_PAGES = [
  { href: '/website-development-usa/', label: 'USA' },
  { href: '/website-development-uk/', label: 'UK' },
  { href: '/website-development-dubai/', label: 'Dubai & UAE' },
  { href: '/blog/', label: 'Blog' },
];

export default function ServiceLinks() {
  return (
    <nav className="service-links" aria-label="Services">
      <div className="service-links-inner">
        <a className="service-links-title" href="/services/">Explore all services</a>
        <ul>
          {SERVICE_PAGES.map((page) => (
            <li key={page.href}><a href={page.href}>{page.label}</a></li>
          ))}
        </ul>
      </div>
      <div className="service-links-inner">
        <span className="service-links-title">Clients worldwide</span>
        <ul>
          {REGION_PAGES.map((page) => (
            <li key={page.href}><a href={page.href}>{page.label}</a></li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
