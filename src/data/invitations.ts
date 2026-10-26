import type { Template } from '@/data/site';

// Digital invitation cards, shown under the "Invitation Cards" tab of the Templates section.
// Each card is a standalone page in /public/invitations, so it opens in the same live preview popup.
// Invitation cards show only their name in the listing: no language or feature tags.
export const invitationTemplates: Template[] = [
  {
    title: 'Lumière',
    category: 'Invitation Cards',
    url: '/invitations/lumiere/index.html',
    image: 'https://hercules-cdn.com/cdn-cgi/image/w=1200,quality=85,fit=scale-down,format=auto/file_W3qN6vuXE17x23aU2DIsLdzE',
    tags: [],
  },
];

export const TEMPLATE_CATEGORIES = ['Websites', 'Invitation Cards'] as const;
export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];
