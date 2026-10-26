import type { Template } from '@/data/site';

// Digital invitation cards, shown under the "Invitation Cards" tab of the Templates section.
// Each card is a standalone page in /public/invitations, so it opens in the same live preview popup.
export const invitationTemplates: Template[] = [
  {
    title: 'Rahul & Pooja – Wedding Invitation',
    category: 'Invitation Cards',
    url: '/invitations/gujarati-wedding/index.html',
    image: 'https://hercules-cdn.com/cdn-cgi/image/w=1200,quality=85,fit=scale-down,format=auto/file_FDKmXH4h2fEno3a97Vd9bm68',
    tags: ['Gujarati', 'Hindi', 'English', 'Wax seal intro', 'Tahuko'],
  },
];

export const TEMPLATE_CATEGORIES = ['Websites', 'Invitation Cards'] as const;
export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];
