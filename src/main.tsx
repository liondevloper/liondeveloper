import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import App from './App.tsx';
import AdminApp from './admin/AdminApp.tsx';
import { ADMIN_PATH } from './admin/route.ts';
import SiteFooter from './seo/ServiceLinks.tsx';
import './index.css';
// Imported after index.css so the theme stylesheet it carries wins over the older styles.
import { WithScene } from './motion/scene.tsx';
// Loaded last so its smoother easing and lighter effects apply on top of every other stylesheet.
import './motion/smooth.css';
// Tighter spacing, compact pricing cards and the WhatsApp entrance; also loaded last.
import './motion/layout.css';
// Pricing alignment, live preview and spacing fixes.
import './motion/fixes.css';
// Kinetic headings, liquid glass and 3D scroll zoom.
import './motion/trend.css';
// Short intro, calm cards, round shapes, paused off-screen animations; must stay the very last stylesheet.
import './motion/polish.css';

// The public site, followed by the shared footer (same footer as the static service, blog and country pages).
const PublicSite = () => (
  <WithScene>
    <App />
    <SiteFooter />
  </WithScene>
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicSite />} />
        <Route path={`${ADMIN_PATH}/*`} element={<AdminApp />} />
        <Route path="*" element={<PublicSite />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
