import type { ReactNode } from 'react';
import { useDepthCards } from './depth';
import './theme.css';
// Light theme + 3D card depth. Loaded last so it wins over every older stylesheet.
import './light.css';

// The moving star/warp-line canvas, the spinning particle globe and the scrolling floor grid that used to sit
// behind the whole site were removed on request, so the background stays calm. Card depth stays.
export function WithScene({ children }: { children: ReactNode }) {
  useDepthCards();
  return <>{children}</>;
}
