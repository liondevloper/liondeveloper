import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import App from './App.tsx';
import AdminApp from './admin/AdminApp.tsx';
import { ADMIN_PATH } from './admin/route.ts';
import './index.css';
// Imported after index.css so the theme stylesheet it carries wins over the older styles.
import { WithScene } from './motion/scene.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WithScene><App /></WithScene>} />
        <Route path={`${ADMIN_PATH}/*`} element={<AdminApp />} />
        <Route path="*" element={<WithScene><App /></WithScene>} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
