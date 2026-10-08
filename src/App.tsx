import { useState, type FormEvent } from 'react';
import {
  ArrowUpRight, CalendarCheck2, Check, ChevronDown, ChevronUp, Code2, Globe, Instagram,
  LayoutDashboard, Menu, MousePointerClick, PanelsTopLeft, PlugZap, Send, ShoppingBag,
  Sparkles, Star, X, Wrench, MessageCircle, Mail, Smartphone, Zap, ShieldCheck, Target,
  Gauge, Monitor, CircleCheck
} from 'lucide-react';
import { pricing, projects, services, siteConfig, stats, technologies } from '@/data/site';
import lionLogo from '@/assets/images/file_00000000a3408208b2c7cd281b1387a3.png';

const iconMap = { Globe, MousePointerClick, ShoppingBag, PanelsTopLeft, LayoutDashboard, CalendarCheck2, PlugZap, Wrench };

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [submitted, setSubmitted] = useState(false);

  const closeMenu = () => setMenuOpen(false);
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="site-shell">
      <nav className="navbar">
        <a className="brand" href="#home" onClick={closeMenu}>
          <span className="brand-mark"><img src={lionLogo} alt="Lion Developer lion logo" /></span>
          <span><strong>LION</strong><small>DEVELOPER</small></span>
        </a>
        <button className="menu-toggle" aria-label="Toggle navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
        <div className={`nav-links ${menuOpen ? 'is-open' : ''}`}>
          {['Home', 'Services', 'Projects', 'Pricing', 'About', 'Contact'].map((item) => <a key={item} href={`#${item.toLowerCase()}`} onClick={closeMenu}>{item}</a>)}
          <a className="button button-small button-gold" href="#contact" onClick={closeMenu}>Get a Website <ArrowUpRight size={16} /></a>
        </div>
      </nav>

      <main>
        <section className="hero section-pad" id="home">
          <div className="hero-copy">
            <div className="eyebrow"><span className="status-dot" /> Available for New Projects</div>
            <h1>We build websites that <em>grow</em> your business.</h1>
            <p className="hero-text">Modern websites, web applications and digital solutions designed to help businesses build a stronger online presence and turn visitors into customers.</p>
            <div className="hero-actions"><a className="button button-gold" href="#contact">Get a Website <ArrowUpRight size={18} /></a><a className="button button-outline" href="#projects">View Projects <ArrowUpRight size={18} /></a></div>
            <div className="hero-services"><span>Web Development</span><i /> <span>UI/UX</span><i /> <span>Web Apps</span><i /> <span>Digital Solutions</span></div>
          </div>
          <div className="hero-visual">
            <div className="orbit orbit-one" /><div className="orbit orbit-two" />
            <div className="hero-glow" />
            <div className="browser hero-browser"><div className="browser-bar"><span /><span /><span /><b>liondeveloper.in</b><ShieldCheck size={13} /></div><div className="mock-site hero-site"><div className="mock-nav"><div className="mini-logo">L<span>D</span></div><div className="mini-nav-lines"><i /><i /><i /></div><button>Start a project <ArrowUpRight size={10} /></button></div><div className="mock-hero"><div><small>CREATIVE DIGITAL STUDIO</small><h3>Make your<br /><b>next move.</b></h3><p>Digital experiences with a little more roar.</p><div className="mock-pill"><span /> Explore our work</div></div><div className="mock-visual"><div className="visual-ring" /><Code2 size={42} /></div></div><div className="mock-bottom"><div /><div /><div /></div></div></div>
            <div className="float-card float-card-one"><Sparkles size={17} /><span><strong>Premium design</strong><small>Made to stand out</small></span></div><div className="float-card float-card-two"><Zap size={17} /><span><strong>Fast & responsive</strong><small>On every screen</small></span></div>
          </div>
        </section>

        <section className="stats section-pad"><div className="stats-inner">{stats.map((stat) => <div className="stat" key={stat.label}><strong>{stat.value}</strong><span>{stat.label}</span></div>)}</div></section>

        <section className="section-pad section-dark" id="services"><div className="section-heading"><div><span className="section-kicker">What I do</span><h2>What I can build<br /><em>for you.</em></h2></div><p>Professional digital solutions designed around your business requirements, with a sharp focus on clarity, trust and conversion.</p></div><div className="service-grid">{services.map((service) => { const Icon = iconMap[service.icon as keyof typeof iconMap]; return <article className="service-card" key={service.number}><div className="service-top"><span className="service-number">{service.number}</span><Icon size={23} /></div><h3>{service.title}</h3><p>{service.description}</p><ArrowUpRight className="card-arrow" size={19} /></article> })}</div></section>

        <section className="feature-section section-pad"><div className="feature-visual"><div className="browser feature-browser"><div className="browser-bar"><span /><span /><span /><b>project-preview / home</b></div><div className="mock-site feature-site"><div className="feature-word">BUILT<br /><span>TO MOVE</span></div><div className="feature-site-footer"><span>lion / developer</span><b>Scroll to explore <ArrowUpRight size={13} /></b></div><div className="feature-sun" /></div></div><div className="feature-tag tag-one"><Monitor size={16} /><span>Responsive<br /><b>by default</b></span></div><div className="feature-tag tag-two"><Gauge size={16} /><span>Built for<br /><b>performance</b></span></div></div><div className="feature-copy"><span className="section-kicker">The difference</span><h2>More than just<br /><em>a website.</em></h2><p>Every detail is considered to make your business look credible, feel effortless and perform better online.</p><div className="feature-list">{['Modern UI/UX', 'Fully Responsive', 'Fast Performance', 'SEO-Friendly', 'WhatsApp Integration', 'Contact & Booking Forms', 'Admin Panels', 'Database & API Integration', 'Domain, Hosting & Deployment'].map((item) => <span key={item}><CircleCheck size={17} />{item}</span>)}</div></div></section>

        <section className="section-pad section-dark" id="projects"><div className="section-heading"><div><span className="section-kicker">Selected work</span><h2>Projects with<br /><em>purpose.</em></h2></div><p>A selection of websites and digital experiences built for different businesses. Your next project belongs here.</p></div><div className="project-grid">{projects.map((project, index) => <article className={`project-card accent-${project.accent}`} key={project.title} onClick={() => setSelectedProject(index)}><div className="project-preview"><div className="project-ui"><div className="project-ui-top"><span /><span /><span /></div><div className="project-ui-body"><small>{project.category}</small><b>{index === 0 ? 'Your beauty,' : index === 1 ? 'Stay somewhere' : 'Your next big'}<br /><em>{index === 0 ? 'redefined.' : index === 1 ? 'beautiful.' : 'idea starts here.'}</em></b><div className="project-ui-button" /></div></div><div className="project-index">0{index + 1}</div></div><div className="project-info"><div><span>{project.category}</span><h3>{project.title}</h3></div><ArrowUpRight size={20} /><p>{project.description}</p><div className="tech-row">{project.tech.map((tech) => <small key={tech}>{tech}</small>)}</div></div></article>)}</div></section>

        <section className="pricing-section section-pad" id="pricing"><div className="center-heading"><span className="section-kicker">Clear starting points</span><h2>Simple website<br /><em>pricing.</em></h2><p>Professional websites starting from ₹8,000. Every project is tailored to your actual requirements.</p></div><div className="pricing-grid">{pricing.map((plan) => <article className={`price-card ${plan.popular ? 'popular' : ''}`} key={plan.name}>{plan.popular && <span className="popular-tag">Most popular</span>}<span className="price-name">{plan.name}</span><h3>{plan.price === "Let's Discuss" ? plan.price : <><small>Starting from</small>{plan.price}</>}</h3><p>{plan.description}</p><div className="price-divider" />{plan.features.map((feature) => <span className="price-feature" key={feature}><Check size={15} />{feature}</span>)}<a className={`button ${plan.popular ? 'button-gold' : 'button-outline'} price-button`} href="#contact">{plan.cta} <ArrowUpRight size={16} /></a></article>)}</div><p className="pricing-note">Final pricing depends on pages, features, integrations and project requirements.</p></section>

        <section className="process-section section-pad"><div className="section-heading"><div><span className="section-kicker">A clear path forward</span><h2>How it<br /><em>works.</em></h2></div><p>From first conversation to launch day, the process stays transparent, focused and built around your goals.</p></div><div className="process-grid">{[['01', 'Discuss', 'Understand your business and requirements.'], ['02', 'Plan', 'Plan the structure, features and user experience.'], ['03', 'Design', 'Create a modern visual experience.'], ['04', 'Develop', 'Build, integrate and test the website.'], ['05', 'Launch', 'Deploy the website and make it live.']].map(([number, title, text]) => <div className="process-step" key={number}><span>{number}</span><div><h3>{title}</h3><p>{text}</p></div></div>)}</div></section>

        <section className="why-section section-pad section-dark" id="about"><div className="about-grid"><div className="about-copy"><span className="section-kicker">Why Lion Developer</span><h2>Digital experiences<br />that <em>matter.</em></h2><p>Lion Developer is focused on creating modern, responsive and business-oriented websites and web applications. I help businesses, brands and professionals turn their ideas into fast, functional and professional digital experiences.</p><a className="button button-gold" href="#contact">Let’s work together <ArrowUpRight size={18} /></a></div><div className="why-cards">{[['Modern Design', 'Professional interfaces designed for modern businesses.', Sparkles], ['Responsive', 'Perfect experience on mobile, tablet and desktop.', Smartphone], ['Fast Performance', 'Optimized websites that load quickly.', Gauge], ['Business Focused', 'Websites designed around business goals and conversion.', Target], ['Custom Development', 'Custom functionality based on actual requirements.', Code2], ['Support', 'Technical assistance after launch.', MessageCircle]].map(([title, text, Icon]) => <div className="why-card" key={title as string}><Icon size={20} /><h3>{title as string}</h3><p>{text as string}</p></div>)}</div></div></section>

        <section className="tech-section section-pad"><div className="center-heading"><span className="section-kicker">The toolkit</span><h2>Technologies I<br /><em>work with.</em></h2></div><div className="tech-cloud">{technologies.map((tech, index) => <span key={tech} className={index % 4 === 0 ? 'tech-highlight' : ''}><Code2 size={14} />{tech}</span>)}</div></section>

        <section className="testimonial-section section-pad"><div className="center-heading"><span className="section-kicker">Client feedback</span><h2>Good work speaks<br /><em>for itself.</em></h2><p>Real words from real clients will live here. Until then, this is a space reserved for your experience.</p></div><div className="testimonial-card"><div className="stars">{[1,2,3,4,5].map((star) => <Star key={star} size={17} fill="currentColor" />)}</div><p>“Client testimonial placeholder — your experience could be the next story shared here.”</p><span>Client testimonial placeholder</span></div></section>

        <section className="faq-section section-pad section-dark"><div className="section-heading"><div><span className="section-kicker">Need to know</span><h2>Frequently<br /><em>asked.</em></h2></div><p>Still curious? Here are answers to a few of the questions clients ask most often.</p></div><div className="faq-list">{[['How much does a website cost?', 'Website packages start from ₹8,000. Final pricing depends on pages, features and integrations.'], ['How long does a website take?', 'Timeline depends on the project scope and required functionality. A clear timeline is shared before work begins.'], ['Do you provide domain and hosting?', 'Yes. Assistance with domain, hosting and deployment is available.'], ['Can you build an admin panel?', 'Yes. Custom admin panels can be developed when required.'], ['Can you integrate WhatsApp?', 'Yes. WhatsApp enquiry and booking functionality can be integrated.'], ['Do you provide maintenance?', 'Yes. Website updates, fixes and improvements can be provided.']].map(([question, answer], index) => <div className={`faq-item ${openFaq === index ? 'open' : ''}`} key={question}><button onClick={() => setOpenFaq(openFaq === index ? null : index)}><span>0{index + 1}</span><b>{question}</b>{openFaq === index ? <ChevronUp size={19} /> : <ChevronDown size={19} />}</button>{openFaq === index && <p>{answer}</p>}</div>)}</div></section>

        <section className="contact-section section-pad" id="contact"><div className="contact-grid"><div className="contact-copy"><span className="section-kicker">Start a conversation</span><h2>Let’s build<br /><em>something great.</em></h2><p>Have a business idea or need a professional website? Tell me what you need and I’ll get back to you with the right direction.</p><div className="contact-links"><a href={siteConfig.instagramUrl} target="_blank" rel="noreferrer"><Instagram size={19} />{siteConfig.instagram}</a><a href={siteConfig.email ? `mailto:${siteConfig.email}` : '#contact'}><Mail size={19} />Email me</a><a href="#contact"><MessageCircle size={19} />WhatsApp me</a></div></div><div className="form-card">{submitted ? <div className="success-message"><div><Check size={30} /></div><h3>Request received.</h3><p>Thanks for reaching out. Your project details are ready for review.</p><button className="button button-outline" onClick={() => setSubmitted(false)}>Send another request</button></div> : <form onSubmit={handleSubmit}><div className="form-row"><label>Name<input required placeholder="Your name" /></label><label>Business name<input placeholder="Your business" /></label></div><div className="form-row"><label>WhatsApp number<input required type="tel" placeholder="+91 00000 00000" /></label><label>Email<input required type="email" placeholder="you@example.com" /></label></div><label>Website type<select defaultValue=""><option value="" disabled>Select a website type</option><option>Business website</option><option>Landing page</option><option>E-commerce website</option><option>Custom web application</option></select></label><label>Budget<select defaultValue=""><option value="" disabled>Choose your budget</option><option>₹5,000 – ₹10,000</option><option>₹10,000 – ₹20,000</option><option>₹20,000 – ₹50,000</option><option>₹50,000+</option><option>Not sure</option></select></label><label>Project details<textarea required placeholder="Tell me a little about what you want to build..." rows={4} /></label><button className="button button-gold form-submit" type="submit">Send project request <Send size={17} /></button></form>}</div></div></section>
      </main>

      <footer className="footer"><div className="footer-top"><a className="brand" href="#home"><span className="brand-mark"><img src={lionLogo} alt="Lion Developer lion logo" /></span><span><strong>LION</strong><small>DEVELOPER</small></span></a><p>Modern websites, web applications and digital solutions for businesses, brands and professionals.</p><a className="button button-outline" href="#contact">Have a project in mind? Let’s talk <ArrowUpRight size={16} /></a></div><div className="footer-bottom"><span>© 2026 Lion Developer. All rights reserved.</span><div><a href="#home">Home</a><a href="#services">Services</a><a href="#projects">Projects</a><a href="#pricing">Pricing</a><a href={siteConfig.instagramUrl} target="_blank" rel="noreferrer">Instagram</a></div></div></footer>

      <a className="floating-whatsapp" href="#contact" aria-label="Contact Lion Developer on WhatsApp"><MessageCircle size={22} /><span>Let’s talk</span></a>

      {selectedProject !== null && <div className="modal-backdrop" onClick={() => setSelectedProject(null)}><div className="project-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setSelectedProject(null)}><X size={20} /></button><span className="section-kicker">Project overview</span><h2>{projects[selectedProject].title}</h2><p>{projects[selectedProject].description}</p><div className="modal-meta"><span><small>Industry</small>{projects[selectedProject].category}</span><span><small>Technology</small>{projects[selectedProject].tech.join(' · ')}</span></div><h3>What’s included</h3><div className="modal-features">{projects[selectedProject].features.map((feature) => <span key={feature}><Check size={15} />{feature}</span>)}</div><a href="#contact" className="button button-gold" onClick={() => setSelectedProject(null)}>Want a similar website? <ArrowUpRight size={16} /></a></div></div>}
    </div>
  );
}

export default App;
