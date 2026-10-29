// Sample design concepts for the industries Lion Digital Solution builds for.
// They are previews, not client projects, and the section copy says so.
const cdn = (id: string) => `https://hercules-cdn.com/cdn-cgi/image/w=1400,quality=80,fit=scale-down,format=auto/${id}`;

export type ShowcaseItem = { title: string; tag: string; domain: string; image: string };

export const SHOWCASE: ShowcaseItem[] = [
  { title: 'Salon', tag: 'Online booking', domain: 'yoursalon.in', image: cdn('file_BHVzdcRhXpFF06qN7vI1Hhc2') },
  { title: 'Restaurant', tag: 'Menu + table booking', domain: 'yourrestaurant.in', image: cdn('file_SArDT6eM0bP6iWFbSTrjf3R8') },
  { title: 'Hotel', tag: 'Room enquiries', domain: 'yourhotel.com', image: cdn('file_G0JTZlGp44XAw2aUlSbgFD2M') },
  { title: 'Gym', tag: 'Membership plans', domain: 'yourgym.in', image: cdn('file_2VUyclB2xXDtE2F8UCa76OhA') },
  { title: 'Clinic', tag: 'Appointments', domain: 'yourclinic.in', image: cdn('file_wOjDeHyBzatw66FmXlU0SXIk') },
  { title: 'Boutique', tag: 'Online store', domain: 'yourboutique.com', image: cdn('file_iLLlA885HrhiB1ZVocBNoG3g') },
];
