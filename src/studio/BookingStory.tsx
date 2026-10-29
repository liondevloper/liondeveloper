import { useEffect, useRef, type ReactNode } from 'react';
import { CalendarCheck2, Check, CheckCheck, Clock3, MessageCircle, Sparkles, Star } from 'lucide-react';
import { MOTION_ENABLED } from '@/motion/effects';
import './booking-story.css';

/* Booking story: a shop gets a website -> a customer books on her phone -> WhatsApp confirms -> she walks in on time.
   The section is tall and its stage stays pinned. One requestAnimationFrame loop eases toward the real scroll
   position, so the story glides smoothly even when the wheel or a phone flick jumps. Every moving piece declares
   its own entrance (direction, 3D flip, scale) in a data-fx attribute; the loop only writes transform/opacity. */

const CDN = 'https://hercules-cdn.com/cdn-cgi/image/w=1600,quality=82,fit=scale-down,format=auto';

const SCENES = [
  { id: 'website', image: `${CDN}/file_rsJfk1sV5Nkgiu7rP9ED0zF5`, alt: 'Salon owner smiling at her new website on a laptop' },
  { id: 'booking', image: `${CDN}/file_TDgCCGWbOTisVC6mSOTSdQq8`, alt: 'Young woman booking an appointment on her phone at home' },
  { id: 'confirm', image: `${CDN}/file_N68jHTSwB76gAH7oZmtBykUh`, alt: 'Woman on the street smiling at a message on her phone' },
  { id: 'arrive', image: `${CDN}/file_ipJl2cPDnX2tWvb5o3Gkr9ZL`, alt: 'Salon owner welcoming a customer at the door' },
] as const;

// Each photo swings in its own 3D way: from depth, from the right, up from below, from the left (x/y in %).
const SCENE_ENTER = [
  { x: 0, y: 0, rx: 25, ry: 0, z: -300 },
  { x: 25, y: 0, rx: 0, ry: -55, z: -200 },
  { x: 0, y: 25, rx: 60, ry: 0, z: -200 },
  { x: -25, y: 0, rx: 0, ry: 55, z: -200 },
];

const STEPS = SCENES.length;
const FADE = 0.035; // share of the scroll each photo crossfades over
const SMOOTHING = 0.11; // how fast the story catches up with the scroll each frame (lower = softer)

type Kind = 'enter' | 'spin' | 'width' | 'count' | 'press' | 'ripple';
// st: scene index; a-b: window of that scene's 0-1 progress; x/y px, rx/ry/r deg, s scale; from/to for spin/width/count.
type Fx = {
  st: number; a: number; b: number; k?: Kind;
  x?: number; y?: number; rx?: number; ry?: number; r?: number; s?: number;
  from?: number; to?: number; outA?: number; outB?: number;
};

const fx = (f: Fx) => ({ 'data-fx': JSON.stringify(f) });

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const ramp = (v: number, a: number, b: number) => clamp01((v - a) / (b - a));
const easeOut = (t: number) => 1 - (1 - t) ** 3;
const localOf = (p: number, step: number) => clamp01(p * STEPS - step);

function sceneOpacity(p: number, i: number) {
  const start = i / STEPS;
  const end = (i + 1) / STEPS;
  const fadeIn = i === 0 ? 1 : ramp(p, start - FADE, start + FADE);
  const fadeOut = i === STEPS - 1 ? 1 : 1 - ramp(p, end - FADE, end + FADE);
  return Math.min(fadeIn, fadeOut);
}

function applyFx(el: HTMLElement, f: Fx, p: number) {
  const local = localOf(p, f.st);
  const lin = ramp(local, f.a, f.b);
  switch (f.k ?? 'enter') {
    case 'spin':
      el.style.transform = `rotate(${mix(f.from ?? 0, f.to ?? 0, lin)}deg)`;
      return;
    case 'width':
      el.style.width = `${mix(f.from ?? 0, f.to ?? 100, lin)}%`;
      return;
    case 'count':
      el.textContent = String(Math.round(mix(f.from ?? 0, f.to ?? 0, lin)));
      return;
    case 'press':
      el.style.transform = `scale(${1 - 0.1 * Math.sin(Math.PI * lin)})`;
      return;
    case 'ripple':
      el.style.opacity = String(0.5 * Math.sin(Math.PI * lin));
      el.style.transform = `scale(${mix(0.2, 2.2, lin)})`;
      return;
    default: {
      const t = easeOut(lin);
      const out = f.outA === undefined ? 1 : 1 - ramp(local, f.outA, f.outB ?? 1);
      const rest = 1 - t;
      el.style.opacity = String(t * out);
      el.style.visibility = t * out < 0.01 ? 'hidden' : 'visible';
      const moves = f.x || f.y || f.rx || f.ry || f.r || (f.s !== undefined && f.s !== 1);
      if (moves) {
        el.style.transform =
          `perspective(900px) translate3d(${(f.x ?? 0) * rest}px, ${(f.y ?? 0) * rest}px, 0) ` +
          `rotateX(${(f.rx ?? 0) * rest}deg) rotateY(${(f.ry ?? 0) * rest}deg) rotate(${(f.r ?? 0) * rest}deg) ` +
          `scale(${mix(f.s ?? 1, 1, t)})`;
      }
    }
  }
}

const DAYS = [{ day: 'Fri', date: '14' }, { day: 'Sat', date: '15' }, { day: 'Sun', date: '16' }];
const SLOTS = ['11:00 AM', '1:30 PM', '4:00 PM', '6:00 PM'];
const PICKED_SLOT = '4:00 PM';

function WebsiteOverlay() {
  return (
    <div className="ld-bs-card ld-bs-site" {...fx({ st: 0, a: 0, b: 0.16, x: 160, ry: -70, s: 0.85 })}>
      <div className="ld-bs-site-bar"><i /><i /><i /><span>glowstudio.in</span></div>
      <div className="ld-bs-site-body">
        <div className="ld-bs-site-nav" {...fx({ st: 0, a: 0.1, b: 0.3, k: 'width', from: 0, to: 100 })}><i /><i /><i /><i /></div>
        <div {...fx({ st: 0, a: 0.22, b: 0.42, x: -40, rx: 60 })}>
          <strong className="ld-bs-serif">Glow Studio</strong>
          <small>Hair · Nails · Spa — open today till 9 PM</small>
        </div>
        <div className="ld-bs-site-services" {...fx({ st: 0, a: 0.38, b: 0.56, s: 0.5, rx: -80 })}>
          {['Haircut', 'Nails', 'Spa'].map((service) => <span key={service}>{service}</span>)}
        </div>
        <div className="ld-bs-site-row" {...fx({ st: 0, a: 0.52, b: 0.66, y: 30, rx: 90 })}>
          <b>Book now</b>
          <span><Star size={12} fill="currentColor" /> 4.9 on Google</span>
        </div>
      </div>
      <span className="ld-bs-pill ld-bs-live" {...fx({ st: 0, a: 0.68, b: 0.82, x: -60, y: -60, ry: 180, s: 0.3 })}><i /> Website live</span>
    </div>
  );
}

function BookingOverlay() {
  return (
    <div className="ld-bs-card ld-bs-phone" {...fx({ st: 1, a: 0, b: 0.18, y: 260, rx: 65, r: -10 })}>
      <div className="ld-bs-notch" />
      <div className="ld-bs-phone-body">
        <div><small>Glow Studio</small><strong>Pick a time</strong></div>
        <div className="ld-bs-days">
          {DAYS.map(({ day, date }) => (
            <div key={day} className="ld-bs-day">
              {day === 'Sat' && <i className="ld-bs-pick" {...fx({ st: 1, a: 0.2, b: 0.28 })} />}
              <span><small>{day}</small><b>{date}</b></span>
            </div>
          ))}
        </div>
        <div className="ld-bs-slots">
          {SLOTS.map((slot) => (
            <div key={slot} className={`ld-bs-slot ${slot === PICKED_SLOT ? 'is-picked' : ''}`}>
              {slot === PICKED_SLOT && (
                <>
                  <i className="ld-bs-pick" {...fx({ st: 1, a: 0.4, b: 0.48 })} />
                  <i className="ld-bs-ripple" {...fx({ st: 1, a: 0.38, b: 0.5, k: 'ripple' })} />
                </>
              )}
              <span>{slot}</span>
            </div>
          ))}
        </div>
        <div className="ld-bs-confirm" {...fx({ st: 1, a: 0.6, b: 0.72, k: 'press' })}>Confirm booking</div>
        <div className="ld-bs-booked" {...fx({ st: 1, a: 0.74, b: 0.86, x: -50, ry: 90, s: 0.8 })}>
          <i><Check size={14} /></i>
          <span>Booked!<br />Sat 15 · 4:00 PM</span>
        </div>
      </div>
    </div>
  );
}

function ConfirmOverlay() {
  const bubble = { x: -40, ry: 60, s: 0.85 };
  return (
    <>
      <div className="ld-bs-card ld-bs-toast" {...fx({ st: 2, a: 0.02, b: 0.16, y: -80, rx: -90 })}>
        <i><MessageCircle size={20} /></i>
        <span><b>WhatsApp · Glow Studio</b><small>Your booking is confirmed ✓</small></span>
      </div>
      <div className="ld-bs-chat" {...fx({ st: 2, a: 0.18, b: 0.34, x: 200, ry: -80 })}>
        <div className="ld-bs-chat-head">
          <i className="ld-bs-serif">G</i>
          <span><b>Glow Studio</b><small>Business account</small></span>
        </div>
        <div className="ld-bs-chat-body">
          <div className="ld-bs-msg" {...fx({ st: 2, a: 0.3, b: 0.44, ...bubble })}>
            Hi Priya! Your booking is confirmed.<br /><b>Sat 15 · 4:00 PM</b> — Haircut + Spa
            <span className="ld-bs-meta">2:14 PM <i {...fx({ st: 2, a: 0.46, b: 0.52 })}><CheckCheck size={12} /></i></span>
          </div>
          <div className="ld-bs-msg ld-bs-typing" {...fx({ st: 2, a: 0.52, b: 0.56, outA: 0.62, outB: 0.66 })}><i /><i /><i /></div>
          <div className="ld-bs-msg" {...fx({ st: 2, a: 0.64, b: 0.76, ...bubble })}>⏰ Reminder: see you in 1 hour. Reply if you need to reschedule.</div>
          <div className="ld-bs-msg is-out" {...fx({ st: 2, a: 0.8, b: 0.9, x: 40, ry: -60, s: 0.6 })}>On my way! 😊</div>
        </div>
      </div>
    </>
  );
}

function ArriveOverlay() {
  return (
    <>
      <div className="ld-bs-clock" {...fx({ st: 3, a: 0, b: 0.18, y: -120, ry: 180, r: -90, s: 0.3 })}>
        {Array.from({ length: 12 }, (_, hour) => (
          <span key={hour} className="ld-bs-tick" style={{ transform: `rotate(${hour * 30}deg)` }}>
            <i className={hour % 3 === 0 ? 'is-major' : ''} />
          </span>
        ))}
        <span className="ld-bs-hand is-hour" {...fx({ st: 3, a: 0.05, b: 0.5, k: 'spin', from: 97, to: 118 })} />
        <span className="ld-bs-hand is-minute" {...fx({ st: 3, a: 0.05, b: 0.5, k: 'spin', from: 270, to: 708 })} />
        <span className="ld-bs-pin" />
      </div>
      <span className="ld-bs-pill ld-bs-arrived" {...fx({ st: 3, a: 0.48, b: 0.6, x: 120, rx: -90 })}><Clock3 size={14} /> Arrived 3:58 PM · on time</span>
      <div className="ld-bs-card ld-bs-panel" {...fx({ st: 3, a: 0.56, b: 0.72, x: -160, y: 40, ry: 75 })}>
        <small><CalendarCheck2 size={14} /> Today at Glow Studio</small>
        <p><b {...fx({ st: 3, a: 0.6, b: 0.9, k: 'count', from: 8, to: 12 })}>8</b> of 12 slots booked</p>
        <div className="ld-bs-meter"><i {...fx({ st: 3, a: 0.6, b: 0.9, k: 'width', from: 62, to: 100 })} /></div>
        <small className="ld-bs-note"><Sparkles size={12} /> 0 no-shows this week</small>
      </div>
    </>
  );
}

const OVERLAYS: Record<(typeof SCENES)[number]['id'], () => ReactNode> = {
  website: WebsiteOverlay,
  booking: BookingOverlay,
  confirm: ConfirmOverlay,
  arrive: ArriveOverlay,
};

export default function BookingStory() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const pieces = Array.from(section.querySelectorAll<HTMLElement>('[data-fx]')).map((el) => ({
      el,
      f: JSON.parse(el.dataset.fx ?? '{}') as Fx,
    }));
    const scenes = Array.from(section.querySelectorAll<HTMLElement>('[data-scene]'));
    const bar = section.querySelector<HTMLElement>('.ld-bs-progress i');

    const render = (p: number) => {
      scenes.forEach((scene, i) => {
        const o = sceneOpacity(p, i);
        const e = SCENE_ENTER[i % SCENE_ENTER.length];
        const rest = 1 - easeOut(o);
        scene.style.opacity = String(o);
        // Hidden photos skip painting entirely, keeping the phone's GPU free for the one on screen.
        scene.style.visibility = o < 0.01 ? 'hidden' : 'visible';
        scene.style.transform =
          `translate3d(${e.x * rest}%, ${e.y * rest}%, ${e.z * rest}px) rotateX(${e.rx * rest}deg) rotateY(${e.ry * rest}deg)`;
        const img = scene.firstElementChild as HTMLElement | null;
        if (img) img.style.transform = `scale(${mix(1.12, 1, localOf(p, i))})`;
      });
      pieces.forEach(({ el, f }) => applyFx(el, f, p));
      if (bar) bar.style.transform = `scaleX(${p})`;
    };

    const measure = () => {
      const rect = section.getBoundingClientRect();
      return clamp01(-rect.top / Math.max(rect.height - window.innerHeight, 1));
    };

    if (!MOTION_ENABLED) {
      render(0.24); // reduced motion: show the finished first scene, no scroll story
      return;
    }

    let current = -1;
    let drawn = -1;
    let frame = 0;
    let last = 0;
    const tick = (now: number) => {
      frame = 0;
      const target = measure();
      const dt = last ? Math.min(now - last, 64) : 16.7;
      last = now;
      // Frame-rate independent easing toward the scroll position: smooth on 60Hz and 120Hz screens alike.
      current = current < 0 ? target : current + (target - current) * (1 - (1 - SMOOTHING) ** (dt / 16.7));
      if (Math.abs(target - current) < 0.0003) current = target;
      if (current !== drawn) {
        render(current);
        drawn = current;
      }
      if (current !== target) frame = window.requestAnimationFrame(tick);
      else last = 0;
    };
    const wake = () => {
      if (!frame) frame = window.requestAnimationFrame(tick);
    };
    wake();
    window.addEventListener('scroll', wake, { passive: true });
    window.addEventListener('resize', wake);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', wake);
      window.removeEventListener('resize', wake);
    };
  }, []);

  return (
    <section className="ld-bs" ref={sectionRef} aria-label="How online booking brings customers to your shop">
      <div className="ld-bs-sticky">
        <div className="ld-bs-stage">
          {SCENES.map((scene, index) => {
            const Overlay = OVERLAYS[scene.id];
            return (
              <div className="ld-bs-scene" data-scene={index} key={scene.id}>
                <img src={scene.image} alt={scene.alt} loading="eager" decoding="async" width={1600} height={1200} />
                <div className="ld-bs-shade" aria-hidden="true" />
                <div className="ld-bs-layer"><Overlay /></div>
              </div>
            );
          })}
        </div>
        <div className="ld-bs-progress" aria-hidden="true"><i /></div>
      </div>
    </section>
  );
}
