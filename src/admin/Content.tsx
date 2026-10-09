import { useEffect, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from 'lucide-react';
import { adminApi } from './api';
import {
  defaultContent,
  mergeContent,
  PROJECT_ACCENTS,
  SERVICE_ICONS,
  type Faq,
  type Plan,
  type Project,
  type Service,
  type SiteContent,
  type Stat,
  type Testimonial,
} from '../data/site';

const TABS = [
  { id: 'contact', label: 'Contact' },
  { id: 'hero', label: 'Hero' },
  { id: 'stats', label: 'Stats' },
  { id: 'services', label: 'Services' },
  { id: 'projects', label: 'Projects' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'testimonials', label: 'Testimonials' },
  { id: 'faqs', label: 'FAQ' },
  { id: 'technologies', label: 'Tech stack' },
] as const;

type TabId = (typeof TABS)[number]['id'];

/* --------------------------------------------------------------- fields */

function Text({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label>
      {label}
      <input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Area({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (value: string) => void; rows?: number }) {
  return (
    <label>
      {label}
      <textarea rows={rows} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Lines({ label, value, onChange, hint = 'One per line' }: { label: string; value: string[]; onChange: (value: string[]) => void; hint?: string }) {
  return (
    <label>
      {label}
      <textarea rows={Math.max(3, value.length + 1)} value={value.join('\n')} onChange={(event) => onChange(event.target.value.split('\n'))} />
      <small className="admin-hint">{hint}</small>
    </label>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) {
  return (
    <label>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

type RepeaterProps<T> = {
  items: T[];
  onChange: (items: T[]) => void;
  blank: () => T;
  addLabel: string;
  title: (item: T, index: number) => string;
  children: (item: T, update: (item: T) => void) => ReactNode;
};

function Repeater<T>({ items, onChange, blank, addLabel, title, children }: RepeaterProps<T>) {
  const move = (index: number, step: number) => {
    const next = [...items];
    const [item] = next.splice(index, 1);
    next.splice(index + step, 0, item);
    onChange(next);
  };

  return (
    <div className="admin-repeater">
      {items.map((item, index) => (
        <article className="admin-item" key={index}>
          <header>
            <strong>{title(item, index) || 'Untitled'}</strong>
            <div className="admin-item-tools">
              <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move up"><ArrowUp size={14} /></button>
              <button type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1} aria-label="Move down"><ArrowDown size={14} /></button>
              <button type="button" className="admin-item-delete" onClick={() => onChange(items.filter((_, i) => i !== index))} aria-label="Delete"><Trash2 size={14} /></button>
            </div>
          </header>
          <div className="admin-item-body">
            {children(item, (next) => onChange(items.map((current, i) => (i === index ? next : current))))}
          </div>
        </article>
      ))}
      <button type="button" className="admin-button admin-button-ghost" onClick={() => onChange([...items, blank()])}>
        <Plus size={14} /> {addLabel}
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------- page */

const trimList = (values: string[]) => values.map((value) => value.trim()).filter(Boolean);

function clean(content: SiteContent): SiteContent {
  return {
    ...content,
    technologies: trimList(content.technologies),
    projects: content.projects.map((project) => ({ ...project, features: trimList(project.features), tech: trimList(project.tech) })),
    pricing: content.pricing.map((plan) => ({ ...plan, features: trimList(plan.features) })),
  };
}

export default function Content() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [savedCopy, setSavedCopy] = useState('');
  const [tab, setTab] = useState<TabId>('contact');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    adminApi
      .getContent()
      .then((stored) => {
        const merged = mergeContent(stored);
        setContent(merged);
        setSavedCopy(JSON.stringify(merged));
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Could not load content'));
  }, []);

  if (error && !content) return <p className="admin-error">{error}</p>;
  if (!content) return <p className="admin-muted">Loading...</p>;

  const dirty = JSON.stringify(content) !== savedCopy;
  const patch = (changes: Partial<SiteContent>) => {
    setContent({ ...content, ...changes });
    setMessage('');
  };

  const save = async () => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const payload = clean(content);
      await adminApi.saveContent(payload);
      setContent(payload);
      setSavedCopy(JSON.stringify(payload));
      setMessage('Saved. The website is updated.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  };

  const resetSection = () => {
    if (tab === 'contact') patch({ contact: defaultContent.contact });
    else if (tab === 'hero') patch({ hero: defaultContent.hero });
    else patch({ [tab]: defaultContent[tab] } as Partial<SiteContent>);
  };

  return (
    <div className="admin-page">
      <div className="admin-content-head">
        <div>
          <h1>Website content</h1>
          <p className="admin-muted">Edit the text on your site. Changes go live when you save.</p>
        </div>
        <div className="admin-actions">
          {message && <span className="admin-success">{message}</span>}
          {error && <span className="admin-error">{error}</span>}
          <button type="button" className="admin-button" onClick={save} disabled={busy || !dirty}>
            <Save size={14} /> {busy ? 'Saving...' : dirty ? 'Save changes' : 'Saved'}
          </button>
        </div>
      </div>

      <div className="admin-chips admin-tabs">
        {TABS.map((item) => (
          <button key={item.id} type="button" className={tab === item.id ? 'is-active' : ''} onClick={() => setTab(item.id)}>
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'contact' && (
        <div className="admin-fields">
          <Text label="Email" value={content.contact.email} onChange={(email) => patch({ contact: { ...content.contact, email } })} placeholder="you@example.com" />
          <Text label="WhatsApp number" value={content.contact.whatsapp} onChange={(whatsapp) => patch({ contact: { ...content.contact, whatsapp } })} placeholder="+91 00000 00000" />
          <Area label="WhatsApp first message" value={content.contact.whatsappMessage} onChange={(whatsappMessage) => patch({ contact: { ...content.contact, whatsappMessage } })} rows={2} />
          <Text label="Instagram handle" value={content.contact.instagram} onChange={(instagram) => patch({ contact: { ...content.contact, instagram } })} placeholder="@lion_developer" />
          <Text label="Instagram link" value={content.contact.instagramUrl} onChange={(instagramUrl) => patch({ contact: { ...content.contact, instagramUrl } })} />
          <p className="admin-muted">The WhatsApp buttons turn live as soon as a number is saved, with the message above already typed for the visitor.</p>
        </div>
      )}

      {tab === 'hero' && (
        <div className="admin-fields">
          <Text label="Badge" value={content.hero.badge} onChange={(badge) => patch({ hero: { ...content.hero, badge } })} placeholder="Available for New Projects" />
          <label>
            Headline
            <textarea rows={2} value={content.hero.headline} onChange={(event) => patch({ hero: { ...content.hero, headline: event.target.value } })} />
            <small className="admin-hint">Wrap a word in *stars* to show it in gold.</small>
          </label>
          <Area label="Intro text" value={content.hero.text} onChange={(text) => patch({ hero: { ...content.hero, text } })} rows={4} />
        </div>
      )}

      {tab === 'stats' && (
        <Repeater<Stat>
          items={content.stats}
          onChange={(stats) => patch({ stats })}
          blank={() => ({ value: '', label: '' })}
          addLabel="Add stat"
          title={(stat) => stat.label}
        >
          {(stat, update) => (
            <div className="admin-row">
              <Text label="Number" value={stat.value} onChange={(value) => update({ ...stat, value })} placeholder="50+" />
              <Text label="Label" value={stat.label} onChange={(label) => update({ ...stat, label })} placeholder="Projects" />
            </div>
          )}
        </Repeater>
      )}

      {tab === 'services' && (
        <Repeater<Service>
          items={content.services}
          onChange={(services) => patch({ services })}
          blank={() => ({ icon: 'Globe', title: '', description: '' })}
          addLabel="Add service"
          title={(service) => service.title}
        >
          {(service, update) => (
            <>
              <div className="admin-row">
                <Text label="Title" value={service.title} onChange={(title) => update({ ...service, title })} />
                <Select label="Icon" value={service.icon} options={SERVICE_ICONS} onChange={(icon) => update({ ...service, icon })} />
              </div>
              <Area label="Description" value={service.description} onChange={(description) => update({ ...service, description })} />
            </>
          )}
        </Repeater>
      )}

      {tab === 'projects' && (
        <Repeater<Project>
          items={content.projects}
          onChange={(projects) => patch({ projects })}
          blank={() => ({ title: '', category: '', description: '', accent: 'gold', features: [], tech: [] })}
          addLabel="Add project"
          title={(project) => project.title}
        >
          {(project, update) => (
            <>
              <div className="admin-row">
                <Text label="Project name" value={project.title} onChange={(title) => update({ ...project, title })} />
                <Text label="Industry" value={project.category} onChange={(category) => update({ ...project, category })} placeholder="Hotel / Hospitality" />
              </div>
              <Area label="Description" value={project.description} onChange={(description) => update({ ...project, description })} />
              <div className="admin-row">
                <Select label="Card colour" value={project.accent} options={PROJECT_ACCENTS} onChange={(accent) => update({ ...project, accent: accent as Project['accent'] })} />
                <Lines label="Technology tags" value={project.tech} onChange={(tech) => update({ ...project, tech })} />
              </div>
              <Lines label="What's included" value={project.features} onChange={(features) => update({ ...project, features })} />
            </>
          )}
        </Repeater>
      )}

      {tab === 'pricing' && (
        <Repeater<Plan>
          items={content.pricing}
          onChange={(pricing) => patch({ pricing })}
          blank={() => ({ name: '', price: '', description: '', popular: false, features: [], cta: 'Get Started' })}
          addLabel="Add package"
          title={(plan) => plan.name}
        >
          {(plan, update) => (
            <>
              <div className="admin-row">
                <Text label="Package name" value={plan.name} onChange={(name) => update({ ...plan, name })} />
                <Text label="Price" value={plan.price} onChange={(price) => update({ ...plan, price })} placeholder="₹8,000" />
              </div>
              <Area label="Description" value={plan.description} onChange={(description) => update({ ...plan, description })} rows={2} />
              <Lines label="Features" value={plan.features} onChange={(features) => update({ ...plan, features })} />
              <div className="admin-row">
                <Text label="Button text" value={plan.cta} onChange={(cta) => update({ ...plan, cta })} />
                <label className="admin-check">
                  <input
                    type="checkbox"
                    checked={plan.popular}
                    onChange={(event) =>
                      patch({
                        pricing: content.pricing.map((current) =>
                          current === plan ? { ...plan, popular: event.target.checked } : { ...current, popular: false },
                        ),
                      })
                    }
                  />
                  Mark as most popular
                </label>
              </div>
            </>
          )}
        </Repeater>
      )}

      {tab === 'testimonials' && (
        <>
          <p className="admin-muted">With no testimonials saved, the site hides this section.</p>
          <Repeater<Testimonial>
            items={content.testimonials}
            onChange={(testimonials) => patch({ testimonials })}
            blank={() => ({ quote: '', author: '', role: '', rating: 5 })}
            addLabel="Add testimonial"
            title={(testimonial) => testimonial.author}
          >
            {(testimonial, update) => (
              <>
                <Area label="What the client said" value={testimonial.quote} onChange={(quote) => update({ ...testimonial, quote })} />
                <div className="admin-row">
                  <Text label="Client name" value={testimonial.author} onChange={(author) => update({ ...testimonial, author })} />
                  <Text label="Business or role" value={testimonial.role} onChange={(role) => update({ ...testimonial, role })} />
                </div>
                <Select
                  label="Stars"
                  value={String(testimonial.rating)}
                  options={['5', '4', '3', '2', '1']}
                  onChange={(rating) => update({ ...testimonial, rating: Number(rating) })}
                />
              </>
            )}
          </Repeater>
        </>
      )}

      {tab === 'faqs' && (
        <Repeater<Faq>
          items={content.faqs}
          onChange={(faqs) => patch({ faqs })}
          blank={() => ({ question: '', answer: '' })}
          addLabel="Add question"
          title={(faq) => faq.question}
        >
          {(faq, update) => (
            <>
              <Text label="Question" value={faq.question} onChange={(question) => update({ ...faq, question })} />
              <Area label="Answer" value={faq.answer} onChange={(answer) => update({ ...faq, answer })} />
            </>
          )}
        </Repeater>
      )}

      {tab === 'technologies' && (
        <div className="admin-fields">
          <Lines label="Technologies" value={content.technologies} onChange={(technologies) => patch({ technologies })} />
        </div>
      )}

      <div className="admin-actions admin-content-foot">
        <button type="button" className="admin-button" onClick={save} disabled={busy || !dirty}>
          <Save size={14} /> {busy ? 'Saving...' : dirty ? 'Save changes' : 'Saved'}
        </button>
        <button type="button" className="admin-button admin-button-ghost" onClick={resetSection}>
          Reset this section
        </button>
      </div>
    </div>
  );
}
