import { useState, type FormEvent } from 'react';
import {
  ArrowUpRight, CalendarCheck2, Check, ChevronDown, ChevronUp, ClipboardList, Code2, Globe, Instagram,
  LayoutDashboard, MessagesSquare, MousePointerClick, Palette, PanelsTopLeft, Phone, PlugZap, Rocket, Send, ShoppingBag,
  Sparkles, Star, Wrench, MessageCircle, Mail, Smartphone, Zap, ShieldCheck, Target,
  Gauge, Monitor, CircleCheck
} from 'lucide-react';
import { phoneLink, useSiteContent, whatsappLink } from '@/data/site';
import lionLogo from '@/assets/images/lion-logo.png';
import { CountUp, Cursor, Marquee, ScrollProgress, stagger, useMotionEffects } from '@/motion/effects';
import { Deck, TemplateShowcase, useTiltEffect } from '@/motion/showcase';
import { AUTO_SWIPE_MS, DotPreloader, DotsMenuButton, FloatingWhatsApp, ServiceDeck, useAnchorScroll, useScrolled } from '@/motion/upgrades';
import { ScrollBallet, useScrollScenes } from '@/motion/scenes';
import PricingSection from '@/pricing/PricingSection';

const iconMap = { Globe, MousePointerClick, ShoppingBag, PanelsTopLeft, LayoutDashboard, CalendarCheck2, PlugZap, Wrench };

type EnquiryFields = Record<string, FormDataEntryValue>;

const BAND_WORDS = ['Business Websites', 'Ready in 1–3 Days', 'Landing Pages', 'E-Commerce', 'Web Apps', 'Admin Panels', 'Booking Systems', 'UI/UX Design'];
const OUTRO_WORDS = ['Let’s build', 'Something great', 'Lion Developer'];
const NAV_ITEMS = ['Home', 'Services', 'Templates', 'Pricing', 'About', 'Contact'];
const WEBSITE_TYPES = [
  'Salon',
  'Gym / Fitness centre',
  'Beauty parlour',
  'Nail studio',
  'Barber shop',
  'Spa / Wellness',
  'Cafe',
  'Restaurant',
  'Hotel / Resort',
  'Bakery / Sweet shop',
  'Clinic / Doctor',
  'Dental clinic',
  'Clothing / Boutique',
  'Jewellery shop',
  'Real estate',
  'Coaching / Tuition classes',
  'School / College',
  'Photography studio',
  'Event / Wedding planner',
  'Travel agency',
  'Business / Company website',
  'Landing page',
  'E-commerce / Online store',
  'Custom web application',
  'Other',
];

const PROCESS_STEPS = [
  { title: 'Discuss', text: 'Understand your business, goals and requirements.', icon: MessagesSquare },
  { title: 'Plan', text: 'Plan the structure, features and user experience.', icon: ClipboardList },
  { title: 'Design', text: 'Create a modern visual experience for your brand.', icon: Palette },
  { title: 'Develop', text: 'Build, integrate and test the website on every screen.', icon: Code2 },
  { title: 'Launch', text: 'Your website goes live in 1–3 days, depending on the website.', icon: Rocket },
];

const WHY_CARDS = [
  { title: 'Quick Delivery', text: 'Your website ready in 1–3 days, depending on the website.', icon: Rocket },
  { title: 'Modern Design', text: 'Professional interfaces designed for modern businesses.', icon: Sparkles },
  { title: 'Responsive', text: 'Perfect experience on mobile, tablet and desktop.', icon: Smartphone },
  { title: 'Fast Performance', text: 'Optimized websites that load quickly.', icon: Gauge },
  { title: 'Business Focused', text: 'Websites designed around business goals and conversion.', icon: Target },
  { title: 'Custom Development', text: 'Custom functionality based on actual requirements.', icon: Code2 },
  { title: 'Support', text: 'Technical assistance after launch.', icon: MessageCircle },
  { title: 'Secure & SEO Ready', text: 'HTTPS, clean code and SEO basics so Google can find you.', icon: ShieldCheck },
];

function ProcessCard({ step }: { step: (typeof PROCESS_STEPS)[number] }) {
  const Icon = step.icon;
  return (
    <article className="process-card">
      <div className="process-card-top">
        <span className="process-card-icon"><Icon size={24} /></span>
      </div>
      <h3>{step.title}</h3>
      <p>{step.text}</p>
    </article>
  );
}

// Splits the headline into masked words that rise in one after another.
// A word wrapped in *stars* in the admin panel still renders as the gold accent.
function headlineWords(text: string) {
  let count = 0;
  return text.split('*').flatMap((part, partIndex) =>
    part.split(/\s+/).filter(Boolean).flatMap((word) => {
      const index = count++;
      return [
        <span className="word" key={index} style={stagger(index)}>
          <span>{partIndex % 2 ? <em>{word}</em> : word}</span>
        </span>,
        ' ',
      ];
    }),
  );
}

// Every enquiry is stored in the admin panel; the email copy is a bonus, so one can fail without losing the lead.
async function saveEnquiry(data: EnquiryFields) {
  try {
    const response = await fetch('/api/enquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function emailEnquiry(data: EnquiryFields, email: string) {
  if (!email) return false;
  try {
    const response = await fetch(`https://formsubmit.co/ajax/${email}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        ...data,
        _subject: `New project request from ${data.name || 'website visitor'}`,
        _template: 'table',
        _captcha: 'false',
      }),
    });
    const result = await response.json();
    return response.ok && String(result.success) === 'true';
  } catch {
    return false;
  }
}

function App() {
  const content = useSiteContent();
  const { contact, hero, stats, services, templates, pricing, care, terms, budgets, technologies, testimonials, faqs } = content;
  const whatsappHref = whatsappLink(contact.whatsapp, contact.whatsappMessage) ?? '#contact';
  const phoneHref = phoneLink(contact.whatsapp) ?? '#contact';
  const [menuOpen, setMenuOpen] = useState(false);
  const [sentEnquiry, setSentEnquiry] = useState<EnquiryFields | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(false);
  const [chosenPackage, setChosenPackage] = useState('');
  useMotionEffects();
  useTiltEffect();
  useAnchorScroll();
  useScrollScenes();
  const scrolled = useScrolled();

  // Only website packages; care plans are confirmed separately on WhatsApp.
  const packageOptions = pricing.map((plan) => plan.name).filter(Boolean);
  // A package picked from the pricing section prefills the form, which then confirms it by email/WhatsApp.
  const choosePackage = (name: string) => {
    setChosenPackage(name);
    setSubmitted(false);
  };

  const closeMenu = () => setMenuOpen(false);
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setSending(true);
    setSendError(false);
    const data = Object.fromEntries(new FormData(form));
    // The enquiry store has no package column, so the chosen package leads the project details.
    if (data.package) data.details = `Package: ${data.package}\n\n${data.details}`;
    const [saved, mailed] = await Promise.all([saveEnquiry(data), emailEnquiry(data, contact.email)]);
    setSending(false);

    if (!saved && !mailed) {
      setSendError(true);
      return;
    }
    form.reset();
    setChosenPackage('');
    setSentEnquiry(data);
    setSubmitted(true);
  };

  // After a request is sent, the visitor can carry the same details straight into WhatsApp.
  const followUpHref = sentEnquiry
    ? whatsappLink(
        contact.whatsapp,
        [
          `Hi Lion Developer, I just sent a project request from your website.`,
          `Name: ${sentEnquiry.name}`,
          sentEnquiry.package ? `Package: ${sentEnquiry.package}` : '',
          sentEnquiry.website_type ? `Website type: ${sentEnquiry.website_type}` : '',
          sentEnquiry.budget ? `Budget: ${sentEnquiry.budget}` : '',
        ]
          .filter(Boolean)
          .join('\n'),
      )
    : null;

  return (
    <div className="site-shell">
      <DotPreloader logo={lionLogo} />
      <ScrollProgress />
      <Cursor />

      <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
      <nav className="navbar">
        <a className="brand" href="#home" onClick={closeMenu}>
          <span className="brand-mark"><img src={lionLogo} alt="Lion Developer" width={454} height={480} /></span>
          <span><strong>LION</strong><small>DEVELOPER</small></span>
        </a>
        <DotsMenuButton open={menuOpen} onToggle={() => setMenuOpen(!menuOpen)} />
        <div className={`nav-links ${menuOpen ? 'is-open' : ''}`}>
          {NAV_ITEMS.filter((item) => item !== 'Templates' || templates.length > 0).map((item) => <a key={item} href={`#${item.toLowerCase()}`} onClick={closeMenu}>{item}</a>)}
          <a className="button button-small button-gold" href="#contact" onClick={closeMenu}>Get a Website <ArrowUpRight size={16} /></a>
        </div>
      </nav>
      </header>

      <main>
        <section className="hero section-pad" id="home">
          <div className="hero-grid" aria-hidden="true" />
          <div className="hero-copy">
            <h1>{headlineWords(hero.headline)}</h1>
            <p className="hero-text">{hero.text}</p>
            <div className="hero-actions"><a className="button button-gold" href="#contact">Get a Website <ArrowUpRight size={18} /></a><a className="button button-outline" href="#services">View Services <ArrowUpRight size={18} /></a></div>
            <div className="hero-services"><span>Website Ready in 1–3 Days*</span><i /> <span>Web Development</span><i /> <span>UI/UX</span><i /> <span>Web Apps</span></div>
          </div>
          <div className="hero-visual">
            <div className="orbit orbit-one"><b /></div><div className="orbit orbit-two"><b /></div>
            <div className="hero-glow" />
            <div className="browser hero-browser"><div className="browser-bar"><span /><span /><span /><b>liondeveloper.in</b><ShieldCheck size={13} /></div><div className="mock-site hero-site"><div className="mock-nav"><div className="mini-logo">L<span>D</span></div><div className="mini-nav-lines"><i /><i /><i /></div><button>Start a project <ArrowUpRight size={10} /></button></div><div className="mock-hero"><div><small>CREATIVE DIGITAL STUDIO</small><h3>Make your<br /><b>next move.</b></h3><p>Digital experiences with a little more roar.</p><div className="mock-pill"><span /> Explore our work</div></div><div className="mock-visual"><div className="visual-ring" /><Code2 size={42} /></div></div><div className="mock-bottom"><div /><div /><div /></div></div></div>
            <div className="float-card float-card-one"><Rocket size={17} /><span><strong>Ready in 1–3 days</strong><small>Depending on your website</small></span></div><div className="float-card float-card-two"><Zap size={17} /><span><strong>Fast & responsive</strong><small>On every screen</small></span></div>
          </div>
          <a className="scroll-cue" href="#services" aria-label="Scroll to services"><span /></a>
        </section>

        <section className="stats section-pad"><div className="stats-inner">{stats.map((stat, index) => <div className="stat" key={index} data-reveal style={stagger(index)}><CountUp value={stat.value} /><span>{stat.label}</span></div>)}</div></section>

        <Marquee items={BAND_WORDS} variant="band" />

        <section className="section-pad section-dark" id="services"><div className="section-heading"><div><span className="section-kicker" data-reveal>What I do</span><h2 data-reveal="clip">What I can build<br /><em>for you.</em></h2></div><p data-reveal style={stagger(2)}>Professional digital solutions designed around your business requirements, with a sharp focus on clarity, trust and conversion. Swipe up or down to explore.</p></div><div data-reveal><ServiceDeck services={services} resolveIcon={(name) => iconMap[name as keyof typeof iconMap] ?? Globe} /></div></section>

        <section className="feature-section section-pad"><div className="feature-visual" data-reveal="left"><div className="browser feature-browser"><div className="browser-bar"><span /><span /><span /><b>liondeveloper.in/projects</b></div><div className="mock-site feature-site"><div className="feature-word">BUILT<br /><span>TO MOVE</span></div><div className="feature-site-footer"><span>lion / developer</span><b>Scroll to explore <ArrowUpRight size={13} /></b></div><div className="feature-sun" /></div></div><div className="feature-tag tag-one"><Monitor size={16} /><span>Responsive<br /><b>by default</b></span></div><div className="feature-tag tag-two"><Gauge size={16} /><span>Built for<br /><b>performance</b></span></div><ScrollBallet /></div><div className="feature-copy"><span className="section-kicker" data-reveal>The difference</span><h2 data-reveal="clip">More than just<br /><em>a website.</em></h2><p data-reveal style={stagger(2)}>Every detail is considered to make your business look credible, feel effortless and perform better online.</p><div className="feature-list">{['Ready in 1–3 Days (depending on website)', 'Modern UI/UX', 'Fully Responsive', 'Fast Performance', 'SEO-Friendly', 'WhatsApp Integration', 'Contact & Booking Forms', 'Admin Panels', 'Database & API Integration', 'Domain, Hosting & Deployment'].map((item, index) => <span key={item} data-reveal style={stagger(index)}><CircleCheck size={17} />{item}</span>)}</div></div></section>

        {templates.length > 0 && (
          <section className="templates-section section-pad" id="templates">
            <div className="templates-aurora" aria-hidden="true"><i /><i /><i /></div>
            <div className="section-heading">
              <div>
                <span className="section-kicker" data-reveal>Live templates</span>
                <h2 data-reveal="clip">See them<br /><em>in action.</em></h2>
              </div>
              <p data-reveal style={stagger(2)}>Real websites, running live. Open any one to explore it right here, on desktop or mobile view.</p>
            </div>
            <TemplateShowcase templates={templates} />
          </section>
        )}

        <PricingSection pricing={pricing} care={care} terms={terms} whatsapp={contact.whatsapp} onChoose={choosePackage} />

        <section className="process-section section-pad">
          <div className="section-heading">
            <div>
              <span className="section-kicker" data-reveal>A clear path forward</span>
              <h2 data-reveal="clip">How it<br /><em>works.</em></h2>
            </div>
            <p data-reveal style={stagger(2)}>From first conversation to launch day in just 1–3 days, depending on your website. The process stays transparent, focused and built around your goals. Swipe left or right to follow along.</p>
          </div>
          <div data-reveal>
            <Deck
              items={PROCESS_STEPS}
              axis="x"
              label="How it works"
              interval={AUTO_SWIPE_MS}
              persistent
              className="process-deck"
              renderCard={(step) => <ProcessCard step={step} />}
              aside={(current, go) => (
                <ol className="process-list">
                  {PROCESS_STEPS.map((step, index) => (
                    <li key={step.title}>
                      <button type="button" className={index === current ? 'is-active' : index < current ? 'is-done' : ''} onClick={() => go(index)}>
                        <b>{step.title}</b>
                      </button>
                    </li>
                  ))}
                </ol>
              )}
            />
          </div>
        </section>

        <section className="why-section section-pad section-dark" id="about"><div className="about-grid"><div className="about-copy"><span className="section-kicker" data-reveal>Why Lion Developer</span><h2 data-reveal="clip">Digital experiences<br />that <em>matter.</em></h2><p data-reveal style={stagger(2)}>Lion Developer is focused on creating modern, responsive and business-oriented websites and web applications. I help businesses, brands and professionals turn their ideas into fast, functional and professional digital experiences.</p><a className="button button-gold" href="#contact" data-reveal style={stagger(3)}>Let’s work together <ArrowUpRight size={18} /></a></div><div className="why-cards">{WHY_CARDS.map(({ title, text, icon: Icon }, index) => <div className="why-card" key={title} data-reveal data-tilt="10" style={stagger(index)}><span className="why-fx" aria-hidden="true"><i /><i /></span><Icon size={20} /><h3>{title}</h3><p>{text}</p></div>)}</div></div></section>

        <section className="tech-section section-pad"><div className="center-heading"><span className="section-kicker" data-reveal>The toolkit</span><h2 data-reveal="clip">Technologies I<br /><em>work with.</em></h2></div><div className="tech-cloud">{technologies.map((tech, index) => <span key={index} data-reveal="scale" style={stagger(index)}><Code2 size={14} />{tech}</span>)}</div></section>

        {/* No real testimonials saved yet means no section at all — a filler review card would read as fake. */}
        {testimonials.length > 0 && <section className="testimonial-section section-pad"><div className="center-heading"><span className="section-kicker" data-reveal>Client feedback</span><h2 data-reveal="clip">Good work speaks<br /><em>for itself.</em></h2></div><div className={`testimonial-grid ${testimonials.length === 1 ? 'is-single' : ''}`}>{testimonials.map((testimonial, index) => <div className="testimonial-card" key={index} data-reveal data-tilt="6" style={stagger(index)}><div className="stars">{Array.from({ length: Math.min(Math.max(testimonial.rating || 5, 1), 5) }, (_, star) => <Star key={star} size={17} fill="currentColor" />)}</div><p>“{testimonial.quote}”</p><span>{[testimonial.author, testimonial.role].filter(Boolean).join(', ')}</span></div>)}</div></section>}

        <section className="faq-section section-pad section-dark"><div className="section-heading"><div><span className="section-kicker" data-reveal>Need to know</span><h2 data-reveal="clip">Frequently<br /><em>asked.</em></h2></div><p data-reveal style={stagger(2)}>Still curious? Here are answers to a few of the questions clients ask most often.</p></div><div className="faq-list">{faqs.map((faq, index) => <div className={`faq-item ${openFaq === index ? 'open' : ''}`} key={index} data-reveal style={stagger(index)}><button onClick={() => setOpenFaq(openFaq === index ? null : index)}><span>{String(index + 1).padStart(2, '0')}</span><b>{faq.question}</b>{openFaq === index ? <ChevronUp size={19} /> : <ChevronDown size={19} />}</button>{openFaq === index && <p>{faq.answer}</p>}</div>)}</div></section>

        <section className="contact-section section-pad" id="contact"><div className="contact-grid"><div className="contact-copy" data-reveal="left"><span className="section-kicker">Start a conversation</span><h2>Let’s build<br /><em>something great.</em></h2><p>Have a business idea or need a professional website? Tell me what you need and your website can be ready in 1–3 days, depending on the website. I’ll get back to you with the right direction.</p><div className="contact-links">{contact.instagram && <a href={contact.instagramUrl} target="_blank" rel="noreferrer"><Instagram size={19} />{contact.instagram}</a>}<a href={contact.email ? `mailto:${contact.email}` : '#contact'}><Mail size={19} />{contact.email || 'Email me'}</a><a href={phoneHref}><Phone size={19} />{contact.whatsapp || 'Call me'}</a></div></div><div className="form-card" data-reveal="right">{submitted ? <div className="success-message"><div><Check size={30} /></div><h3>Request received.</h3><p>Thanks for reaching out. I’ll confirm the plan, pricing and payment details with you before anything starts.</p>{followUpHref && <a className="button button-gold success-whatsapp" href={followUpHref} target="_blank" rel="noreferrer"><MessageCircle size={17} /> Continue on WhatsApp</a>}<button className="button button-outline" onClick={() => setSubmitted(false)}>Send another request</button></div> : <form onSubmit={handleSubmit}><div className="form-row"><label>Name<input required name="name" placeholder="Your name" /></label><label>Business name<input name="business" placeholder="Your business" /></label></div><div className="form-row"><label>WhatsApp number<input required name="whatsapp" type="tel" placeholder="+91 00000 00000" /></label><label>Email<input required name="email" type="email" placeholder="you@example.com" /></label></div><label>Package<select name="package" value={chosenPackage} onChange={(event) => setChosenPackage(event.target.value)}><option value="">Not decided yet</option>{packageOptions.map((name) => <option key={name}>{name}</option>)}</select></label><label>Website type<select name="website_type" defaultValue=""><option value="" disabled>Select a website type</option>{WEBSITE_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label><label>Budget<select name="budget" defaultValue=""><option value="" disabled>Choose your budget</option>{budgets.map((budget) => <option key={budget}>{budget}</option>)}</select></label><label>Project details<textarea required name="details" placeholder="Tell me a little about what you want to build..." rows={4} /></label><button className="button button-gold form-submit" type="submit" disabled={sending}>{sending ? 'Sending...' : <>Send project request <Send size={17} /></>}</button>{sendError && <p className="form-error">Couldn’t send that. Try again, or email {contact.email} directly.</p>}</form>}</div></div></section>

        <Marquee items={OUTRO_WORDS} />
      </main>

      {/* Footer bottom shows only the centred copyright line; the quick links and the "Let's talk" button were removed on request. */}
      <footer className="footer"><div className="footer-top" data-reveal><a className="brand" href="#home"><span className="brand-mark"><img src={lionLogo} alt="Lion Developer" width={454} height={480} /></span><span><strong>LION</strong><small>DEVELOPER</small></span></a><p>Modern websites, web applications and digital solutions for businesses, brands and professionals.</p></div><div className="footer-bottom" style={{ justifyContent: 'center', textAlign: 'center' }}><span>© {new Date().getFullYear()} Lion Developer. All rights reserved.</span></div></footer>

      <FloatingWhatsApp href={whatsappHref} />

    </div>
  );
}

export default App;
