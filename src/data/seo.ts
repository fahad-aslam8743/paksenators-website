import { SEOConfig } from '../hooks/useSEO';

// One entry per `currentView` value handled in App.tsx's renderView() switch.
// Keeping this centralized means every page gets an accurate, unique title
// and meta description without touching 25+ individual view files.
export const PAGE_SEO: Record<string, SEOConfig> = {
  home: {
    title: 'Youth Senate of Pakistan',
    description: 'Youth Senate of Pakistan (YSP) is a non-partisan youth parliamentary platform empowering young Pakistanis through parliamentary training, leadership development, and civic engagement across all provinces.',
    keywords: 'Youth Senate of Pakistan, YSP, youth parliament Pakistan, youth leadership Pakistan, parliamentary training, civic engagement Pakistan'
  },
  about: {
    title: 'About Us',
    description: 'Learn about Youth Senate of Pakistan\'s vision, mission, and core objectives — building an informed, empowered generation of youth leaders through parliamentary democracy.',
    keywords: 'about Youth Senate of Pakistan, YSP mission, YSP vision, youth organization Pakistan'
  },
  founder: {
    title: 'Founder & President',
    description: 'Meet the Founder Chairman and President of Youth Senate of Pakistan, and learn about the leadership vision behind the organization.',
    keywords: 'Youth Senate of Pakistan founder, YSP president, YSP chairman'
  },
  leadership: {
    title: 'Executive Leadership',
    description: 'Meet the executive leadership team of Youth Senate of Pakistan — the office bearers guiding the organization\'s national mission and youth programs.',
    keywords: 'Youth Senate of Pakistan leadership, YSP executive body, YSP office bearers'
  },
  'youth-senate': {
    title: 'The Youth Senate',
    description: 'Explore how the Youth Senate of Pakistan operates — its parliamentary structure, sessions, and the platform it gives young Pakistanis to shape policy dialogue.',
    keywords: 'youth senate structure, youth parliament Pakistan, youth policy dialogue'
  },
  structure: {
    title: 'Organizational Structure',
    description: 'An overview of the organizational structure of Youth Senate of Pakistan, from national leadership down to district-level chapters.',
    keywords: 'YSP organizational structure, youth senate hierarchy Pakistan'
  },
  committees: {
    title: 'Committees',
    description: 'Browse the standing committees of Youth Senate of Pakistan and the young leaders chairing policy discussion in education, climate, employment, and technology.',
    keywords: 'Youth Senate committees, YSP standing committees, youth policy committees Pakistan'
  },
  senators: {
    title: 'Youth Senators',
    description: 'Meet the elected and appointed Youth Senators of Youth Senate of Pakistan, representing districts and provinces across the country.',
    keywords: 'Youth Senators Pakistan, YSP senators, youth representatives Pakistan'
  },
  chapters: {
    title: 'District Chapters',
    description: 'Find Youth Senate of Pakistan district chapters near you — active and forming chapters connecting young leaders across every province.',
    keywords: 'YSP district chapters, youth senate chapters Pakistan, youth chapters by district'
  },
  sessions: {
    title: 'Parliamentary Sessions',
    description: 'Follow upcoming and past parliamentary sessions hosted by Youth Senate of Pakistan, including agendas, venues, and proceedings summaries.',
    keywords: 'YSP parliamentary sessions, youth parliament sessions Pakistan, mock parliament Pakistan'
  },
  events: {
    title: 'Events',
    description: 'Stay updated on Youth Senate of Pakistan events — conventions, training workshops, and district-level youth gatherings happening across Pakistan.',
    keywords: 'Youth Senate events Pakistan, YSP conventions, youth workshops Pakistan'
  },
  news: {
    title: 'News & Announcements',
    description: 'Read the latest news and official announcements from Youth Senate of Pakistan.',
    keywords: 'Youth Senate news, YSP announcements, youth parliament Pakistan news'
  },
  publications: {
    title: 'Publications',
    description: 'Browse official publications, reports, and policy papers released by Youth Senate of Pakistan.',
    keywords: 'YSP publications, youth senate reports Pakistan, youth policy papers'
  },
  gallery: {
    title: 'Photo & Video Gallery',
    description: 'Photo highlights from Youth Senate of Pakistan\'s parliamentary assemblies, committee meetings, and district conventions.',
    keywords: 'Youth Senate photo gallery, YSP pictures, youth parliament Pakistan photos'
  },
  videos: {
    title: 'Video Gallery',
    description: 'Watch official videos from Youth Senate of Pakistan — parliamentary sessions, events, and youth leadership highlights.',
    keywords: 'Youth Senate videos, YSP video gallery, youth parliament Pakistan videos'
  },
  'video-gallery': {
    title: 'Video Gallery',
    description: 'Watch official videos from Youth Senate of Pakistan — parliamentary sessions, events, and youth leadership highlights.',
    keywords: 'Youth Senate videos, YSP video gallery, youth parliament Pakistan videos'
  },
  membership: {
    title: 'Membership',
    description: 'Join Youth Senate of Pakistan — learn about membership benefits, eligibility, and how to become a Youth Senator.',
    keywords: 'join Youth Senate of Pakistan, YSP membership, become a youth senator Pakistan'
  },
  apply: {
    title: 'Apply for Membership',
    description: 'Apply to become a member of Youth Senate of Pakistan and start your journey in youth leadership and parliamentary training.',
    keywords: 'YSP membership application, apply youth senate Pakistan, youth senator application'
  },
  portal: {
    title: 'Member Portal',
    description: 'Sign in to the Youth Senate of Pakistan member portal.',
    noindex: true
  },
  verify: {
    title: 'Certificate Verification',
    description: 'Verify the authenticity of a Youth Senate of Pakistan membership or achievement certificate.',
    keywords: 'verify YSP certificate, Youth Senate certificate verification'
  },
  constitution: {
    title: 'Constitution',
    description: 'Read the official constitution of Youth Senate of Pakistan, outlining its governing rules, structure, and principles.',
    keywords: 'Youth Senate constitution, YSP governing rules'
  },
  downloads: {
    title: 'Downloads',
    description: 'Download official documents, forms, and resources from Youth Senate of Pakistan.',
    keywords: 'YSP downloads, Youth Senate forms, youth senate documents'
  },
  resolutions: {
    title: 'Resolutions',
    description: 'Browse resolutions submitted, reviewed, and passed by Youth Senate of Pakistan on national and community issues.',
    keywords: 'YSP resolutions, youth parliament resolutions Pakistan'
  },
  questions: {
    title: 'Parliamentary Questions',
    description: 'Explore parliamentary questions raised by Youth Senators and the official responses from committees of Youth Senate of Pakistan.',
    keywords: 'YSP parliamentary questions, youth senate Q&A Pakistan'
  },
  policy: {
    title: 'Policy Recommendations',
    description: 'Read youth-driven policy recommendations from Youth Senate of Pakistan on education, climate, employment, and technology.',
    keywords: 'YSP policy recommendations, youth policy Pakistan, youth-led policy papers'
  },
  contact: {
    title: 'Contact Us',
    description: 'Get in touch with Youth Senate of Pakistan — office address, phone, email, and office hours.',
    keywords: 'contact Youth Senate of Pakistan, YSP contact, YSP office address'
  },
  faq: {
    title: 'Frequently Asked Questions',
    description: 'Answers to common questions about Youth Senate of Pakistan — membership, eligibility, chapters, and how the organization works.',
    keywords: 'YSP FAQ, Youth Senate of Pakistan questions answered'
  },
  disclaimer: {
    title: 'Legal Disclaimer',
    description: 'Legal disclaimer for Youth Senate of Pakistan — a non-governmental, non-partisan youth parliamentary platform.',
    noindex: false
  },
  admin: {
    title: 'Admin Panel',
    description: 'Youth Senate of Pakistan administrative dashboard.',
    noindex: true
  }
};

export const DEFAULT_SEO: SEOConfig = PAGE_SEO.home;
