import {
  SiteSettings,
  LeadershipMember,
  Committee,
  Senator,
  DistrictChapter,
  Session,
  EventItem,
  NewsItem,
  Publication,
  GalleryItem,
  Certificate,
  Resolution,
  PolicyRecommendation,
  ParliamentaryQuestion,
  MembershipApplication,
  MunMember,
  VideoItem,
  PageContent,
  MenuItem,
  MediaItem,
  SystemUser
} from '../types/ysp';

export const initialSiteSettings: SiteSettings = {
  organizationName: 'Youth Senate of Pakistan',
  organizationShortName: 'YSP',
  heroHeadline: "Empowering Pakistan's Youth Through Parliamentary Democracy",
  heroSubheadline: "Learn. Debate. Lead. Serve.",
  heroDescription: "Youth Senate of Pakistan provides a structured platform for young people to develop parliamentary understanding, leadership skills, civic responsibility, and constructive policy dialogue.",
  visionStatement: "To develop an informed, responsible, and empowered generation of Pakistani youth capable of contributing positively to democratic governance, national development, and community leadership.",
  missionStatement: "To provide practical parliamentary education, foster leadership skills, encourage civic participation, and facilitate constructive youth dialogue on national policy and community development across all provinces and districts of Pakistan.",
  coreObjectives: [
    { title: 'Parliamentary Training', description: 'Hands-on experience in parliamentary procedures, rules of order, and legislative debate.', iconName: 'Landmark' },
    { title: 'Leadership Development', description: 'Nurturing public speaking, negotiation, policy writing, and executive leadership capabilities.', iconName: 'Award' },
    { title: 'Civic Engagement', description: 'Promoting active youth participation in community development and national civic duty.', iconName: 'Users' },
    { title: 'Democratic Awareness', description: 'Instilling democratic values, constitutional respect, and transparent governance principles.', iconName: 'ShieldCheck' },
    { title: 'Policy Dialogue', description: 'Creating youth policy recommendations on climate, education, employment, and technology.', iconName: 'FileText' },
    { title: 'Youth Empowerment', description: 'Giving young citizens a voice in regional and national policymaking platforms.', iconName: 'Zap' },
    { title: 'Community Service', description: 'Organizing grassroots community action and civic support initiatives nationwide.', iconName: 'HeartHandshake' },
    { title: 'National Development', description: 'Uniting youth across all provinces to build a prosperous, harmonious Pakistan.', iconName: 'Flag' }
  ],
  officialEmail: 'info@youthsenate.org.pk',
  officialPhone: '091-2561389, 0315-9193927',
  officeAddress: 'Opposite BRT Bus Station, Hashtnagri, Sikandar Pura, Peshawar City, Khyber Pakhtunkhwa, Pakistan',
  officeHours: 'Monday - Friday: 09:00 AM - 05:00 PM PKT',
  membershipFeeAmount: 3000,
  currency: 'PKR',
  bankPaymentDetails: 'EasyPaisa Account: 03459193927 | Account Title: Irfan Mateen | Registration Fee: PKR 3,000',
  socialLinks: {
    facebook: 'https://facebook.com',
    instagram: 'https://instagram.com',
    twitter: 'https://x.com',
    youtube: 'https://youtube.com',
    linkedin: 'https://linkedin.com'
  },
  legalDisclaimer: 'Youth Senate of Pakistan is a non-governmental, non-partisan youth parliamentary platform dedicated to leadership development, civic learning, and democratic participation. It is not an official organ of the Government of Pakistan or the Senate of Pakistan.',
  allowDemoData: true
};

export const initialLeadership: LeadershipMember[] = [
  {
    id: 'lead-01',
    name: 'Irfan Mateen',
    designation: 'Founder Chairman',
    category: 'Founder Chairman',
    photoUrl: '/src/assets/images/irfan_mateen_original_1786443966305.jpg',
    province: 'Islamabad Capital Territory',
    district: 'Islamabad',
    biography: 'Irfan Mateen is the visionary Founder Chairman of Youth Senate of Pakistan. Dedicated to empowering the next generation of Pakistani leaders, he established YSP to bridge the gap between youth civic passion and formal parliamentary knowledge.',
    message: 'Pakistan\'s future rests in the hands of its vibrant youth. Through Youth Senate of Pakistan, our objective is to instill constitutional knowledge, democratic values, and leadership integrity in young minds across every district of our nation.',
    email: 'chairman@youthsenate.pk',
    order: 1,
    isActive: true,
    isDemo: false
  },
  {
    id: 'lead-02',
    name: 'Haroon Mateen',
    designation: 'President',
    category: 'President',
    photoUrl: '/src/assets/images/haroon_mateen_president_1786445857055.jpg',
    province: 'Khyber Pakhtunkhwa / Islamabad',
    district: 'Peshawar / Islamabad',
    phone: '0343-2810025',
    email: 'president@youthsenate.pk',
    biography: 'Haroon Mateen is the President of Youth Senate of Pakistan (بااختیار نوجوان، مضبوط پاکستان). He directs executive council operations, leads youth parliamentary assemblies, and guides provincial chapters across Pakistan.',
    message: 'Youth empowerment, constructive civic debate, and democratic leadership are essential for Pakistan\'s progress and national unity. (بااختیار نوجوان، مضبوط پاکستان)',
    order: 2,
    isActive: true,
    isDemo: false
  },
  {
    id: 'lead-03',
    name: 'Vice President [DEMO]',
    designation: 'Vice President',
    category: 'Vice President',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
    province: 'Khyber Pakhtunkhwa',
    district: 'Peshawar',
    biography: 'Leads youth outreach initiatives across KPK and northern chapters.',
    order: 3,
    isActive: true,
    isDemo: true
  },
  {
    id: 'lead-04',
    name: 'Secretary General [DEMO]',
    designation: 'Executive Secretary',
    category: 'Executive Council',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
    province: 'Sindh',
    district: 'Karachi Central',
    biography: 'Coordinates administrative workflows, committee agendas, and parliamentary proceedings.',
    order: 4,
    isActive: true,
    isDemo: true
  }
];

export const initialCommittees: Committee[] = [
  {
    id: 'com-edu',
    name: 'Standing Committee on Education & Youth Skill Development',
    code: 'EDU-SKILLS',
    chairpersonName: 'Senator Ayesha Khan [DEMO]',
    mandate: 'Formulates policy recommendations on modernizing curriculum, TVET vocational training, higher education access, and youth digital literacy.',
    objectives: [
      'Evaluate educational equity across rural and urban districts.',
      'Propose TVET skill development frameworks for Pakistani youth.',
      'Advocate for digital education infrastructure in public institutions.'
    ],
    meetingSchedule: 'Bi-monthly (1st & 3rd Saturday)',
    memberCount: 24,
    category: 'Education',
    coverImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
    isDemo: true
  },
  {
    id: 'com-climate',
    name: 'Standing Committee on Climate Change & Environmental Protection',
    code: 'CLIMATE-ENV',
    chairpersonName: 'Senator Hamza Ali [DEMO]',
    mandate: 'Focuses on disaster resilience, flood mitigation, urban forestry, renewable energy transition, and youth climate advocacy.',
    objectives: [
      'Draft youth climate resolution for national implementation.',
      'Organize tree-plantation and clean-up drives in all 4 provinces.',
      'Review regional water management policies.'
    ],
    meetingSchedule: 'Monthly (2nd Friday)',
    memberCount: 18,
    category: 'Environment',
    coverImage: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80',
    isDemo: true
  },
  {
    id: 'com-info',
    name: 'Standing Committee on Information & Broadcasting',
    code: 'INFO-MEDIA',
    chairpersonName: 'Senator Mariam Tariq [DEMO]',
    mandate: 'Monitors media literacy, combats digital disinformation, promotes positive youth journalism, and oversees official YSP press releases.',
    objectives: [
      'Establish media ethics workshops for student journalists.',
      'Promote Pakistan\'s youth achievements through international media.',
      'Review digital rights and cyber safety guidelines.'
    ],
    meetingSchedule: 'Monthly (4th Thursday)',
    memberCount: 15,
    category: 'Media',
    coverImage: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80',
    isDemo: true
  },
  {
    id: 'com-zakat',
    name: 'Standing Committee on Zakat, Social Welfare & Poverty Alleviation',
    code: 'ZAKAT-WELFARE',
    chairpersonName: 'Senator Bilal Ahmed [DEMO]',
    mandate: 'Evaluates community welfare models, youth entrepreneurship stipends, micro-grants, and social assistance for vulnerable youth.',
    objectives: [
      'Formulate transparent community aid distribution frameworks.',
      'Promote youth social entrepreneurship initiatives.',
      'Engage local philanthropic bodies for education support.'
    ],
    meetingSchedule: 'Monthly (1st Wednesday)',
    memberCount: 20,
    category: 'Social Welfare',
    coverImage: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=800&q=80',
    isDemo: true
  },
  {
    id: 'com-global',
    name: 'Standing Committee on Global Youth Affairs & International Relations',
    code: 'GLOBAL-YOUTH',
    chairpersonName: 'Senator Zainab Shah [DEMO]',
    mandate: 'Fosters global youth diplomacy, international student exchanges, United Nations SDG alignment, and diaspora engagement.',
    objectives: [
      'Represent Pakistani youth in international youth summits.',
      'Connect overseas Pakistani youth with national initiatives.',
      'Draft policy recommendations on youth mobility and scholarships.'
    ],
    meetingSchedule: 'Bi-monthly (2nd & 4th Tuesday)',
    memberCount: 22,
    category: 'Diplomacy',
    coverImage: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80',
    isDemo: true
  },
  {
    id: 'com-legal',
    name: 'Standing Committee on Constitutional & Legal Affairs',
    code: 'CONST-LEGAL',
    chairpersonName: 'Senator Hassan Raza [DEMO]',
    mandate: 'Examines youth legislation, parliamentary rules of procedure, constitutional literacy, and civic rights awareness.',
    objectives: [
      'Conduct parliamentary procedure masterclasses.',
      'Draft amendments for Youth Senate internal regulations.',
      'Host moot court and parliamentary debate competitions.'
    ],
    meetingSchedule: 'Monthly (3rd Monday)',
    memberCount: 19,
    category: 'Legal',
    coverImage: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
    isDemo: true
  }
];

export const initialSenators: Senator[] = [
  {
    id: 'sen-01',
    membershipId: 'YSP-2025-0101',
    name: 'Muhammad Saad Khan [DEMO]',
    designation: 'Youth Senator',
    district: 'Peshawar',
    province: 'Khyber Pakhtunkhwa',
    committeeId: 'com-edu',
    committeeName: 'Standing Committee on Education & Youth Skill Development',
    photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
    joiningDate: '2025-01-15',
    validUntil: '2026-12-31',
    biography: 'Active youth advocate focused on STEM education and digital skill centers in KPK.',
    parliamentaryRole: 'Member of Standing Committee on Education',
    attendancePercentage: 94,
    sessionsAttendedCount: 8,
    eventsAttendedCount: 12,
    certificatesCount: 3,
    status: 'Active',
    email: 'saad.khan@demo.ysp',
    isDemo: true
  },
  {
    id: 'sen-02',
    membershipId: 'YSP-2025-0102',
    name: 'Fatima Zohra [DEMO]',
    designation: 'Youth Senator',
    district: 'Lahore',
    province: 'Punjab',
    committeeId: 'com-climate',
    committeeName: 'Standing Committee on Climate Change & Environmental Protection',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
    joiningDate: '2025-02-01',
    validUntil: '2026-12-31',
    biography: 'Environmental law researcher and youth climate activist in Punjab.',
    parliamentaryRole: 'Member of Standing Committee on Climate Change',
    attendancePercentage: 100,
    sessionsAttendedCount: 10,
    eventsAttendedCount: 15,
    certificatesCount: 4,
    status: 'Active',
    email: 'fatima.z@demo.ysp',
    isDemo: true
  },
  {
    id: 'sen-03',
    membershipId: 'YSP-2025-0103',
    name: 'Usman Baloch [DEMO]',
    designation: 'Youth Senator',
    district: 'Quetta',
    province: 'Balochistan',
    committeeId: 'com-global',
    committeeName: 'Standing Committee on Global Youth Affairs',
    photoUrl: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=600&q=80',
    joiningDate: '2025-01-20',
    validUntil: '2026-12-31',
    biography: 'Youth leader working on regional connectivity and youth entrepreneurship in Balochistan.',
    parliamentaryRole: 'Provincial Youth Coordinator',
    attendancePercentage: 88,
    sessionsAttendedCount: 7,
    eventsAttendedCount: 9,
    certificatesCount: 2,
    status: 'Active',
    email: 'usman.b@demo.ysp',
    isDemo: true
  },
  {
    id: 'sen-04',
    membershipId: 'YSP-2025-0104',
    name: 'Sobia Farooq [DEMO]',
    designation: 'Youth Senator',
    district: 'Karachi South',
    province: 'Sindh',
    committeeId: 'com-info',
    committeeName: 'Standing Committee on Information & Broadcasting',
    photoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80',
    joiningDate: '2025-03-05',
    validUntil: '2026-12-31',
    biography: 'Journalism graduate promoting youth media literacy and digital inclusion.',
    parliamentaryRole: 'Press Committee Deputy Lead',
    attendancePercentage: 92,
    sessionsAttendedCount: 9,
    eventsAttendedCount: 11,
    certificatesCount: 3,
    status: 'Active',
    email: 'sobia.f@demo.ysp',
    isDemo: true
  }
];

export const initialDistrictChapters: DistrictChapter[] = [
  {
    id: 'dist-isb',
    name: 'Islamabad Capital Territory Chapter',
    province: 'Islamabad Capital Territory',
    coordinatorName: 'Federal Coordinator [DEMO]',
    senatorCount: 15,
    establishedDate: '2024-06-01',
    description: 'Central chapter hosting national sessions, parliamentary workshops, and executive meetings.',
    status: 'Active',
    isDemo: true
  },
  {
    id: 'dist-lhr',
    name: 'Lahore District Chapter',
    province: 'Punjab',
    coordinatorName: 'District Coordinator Lahore [DEMO]',
    senatorCount: 22,
    establishedDate: '2024-07-15',
    description: 'Active chapter organizing youth debates, policy forums, and university outreach programs.',
    status: 'Active',
    isDemo: true
  },
  {
    id: 'dist-pesh',
    name: 'Peshawar District Chapter',
    province: 'Khyber Pakhtunkhwa',
    coordinatorName: 'District Coordinator Peshawar [DEMO]',
    senatorCount: 18,
    establishedDate: '2024-08-10',
    description: 'Leading youth civic advocacy and community engagement in KPK.',
    status: 'Active',
    isDemo: true
  },
  {
    id: 'dist-khi',
    name: 'Karachi District Chapter',
    province: 'Sindh',
    coordinatorName: 'District Coordinator Karachi [DEMO]',
    senatorCount: 25,
    establishedDate: '2024-08-01',
    description: 'Covers Karachi divisions promoting youth entrepreneurship and urban development policy.',
    status: 'Active',
    isDemo: true
  },
  {
    id: 'dist-qta',
    name: 'Quetta District Chapter',
    province: 'Balochistan',
    coordinatorName: 'District Coordinator Quetta [DEMO]',
    senatorCount: 12,
    establishedDate: '2024-09-01',
    description: 'Promoting youth leadership and educational empowerment across Balochistan.',
    status: 'Active',
    isDemo: true
  },
  {
    id: 'dist-glt',
    name: 'Gilgit District Chapter',
    province: 'Gilgit-Baltistan',
    coordinatorName: 'GB Regional Coordinator [DEMO]',
    senatorCount: 8,
    establishedDate: '2024-10-01',
    description: 'Youth chapter dedicated to eco-tourism, climate protection, and youth leadership in GB.',
    status: 'Active',
    isDemo: true
  },
  {
    id: 'dist-mzr',
    name: 'Muzaffarabad District Chapter',
    province: 'Azad Jammu & Kashmir',
    coordinatorName: 'AJK Regional Coordinator [DEMO]',
    senatorCount: 10,
    establishedDate: '2024-10-15',
    description: 'AJK chapter supporting youth diplomacy, civic rights, and academic development.',
    status: 'Active',
    isDemo: true
  }
];

export const initialSessions: Session[] = [
  {
    id: 'sess-01',
    sessionNumber: 'Session 12',
    title: 'National Youth Parliamentary Assembly on Economic Empowerment & Tech Governance [DEMO]',
    date: '2026-09-15',
    time: '10:00 AM PKT',
    venue: 'Youth Senate Main Hall / Online Assembly, Islamabad',
    host: 'Executive Bureau YSP',
    agenda: '1. Review of Standing Committee Reports on Youth Skill Development.\n2. Presentation of Youth Resolution on AI & Digital Economy.\n3. Question Hour with Committee Leads.',
    status: 'Upcoming',
    participantsCount: 120,
    coverImage: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80',
    isDemo: true
  },
  {
    id: 'sess-02',
    sessionNumber: 'Session 11',
    title: 'Special Sitting on Climate Resilience & Youth Action Plan 2026 [DEMO]',
    date: '2026-05-20',
    time: '11:00 AM PKT',
    venue: 'Convention Center, Lahore',
    host: 'Standing Committee on Climate Change',
    agenda: 'Debate on youth flood response strategies and urban forestry policy recommendations.',
    status: 'Completed',
    proceedingsSummary: 'The Youth Senate unanimously passed Resolution No. 08 demanding increased youth allocation in national climate resilience funds.',
    pdfDocumentUrl: '#',
    participantsCount: 95,
    coverImage: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=800&q=80',
    isDemo: true
  }
];

export const initialEvents: EventItem[] = [
  {
    id: 'evt-01',
    title: 'All-Pakistan Youth Parliamentary Leadership Convention 2026 [DEMO]',
    category: 'Youth Conventions',
    date: '2026-10-10',
    time: '09:00 AM - 05:00 PM',
    venue: 'Islamabad Marriott Hotel / YSP Center',
    city: 'Islamabad',
    district: 'Islamabad',
    province: 'Islamabad Capital Territory',
    description: 'A national gathering of Youth Senators, committee leaders, and civic activists from all 4 provinces, GB, and AJK to debate national policy priorities.',
    speakers: ['Irfan Mateen (Founder Chairman)', 'Guest Parliamentarians', 'Youth Policy Experts'],
    chiefGuests: ['Prominent Civic Leaders'],
    imageUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80',
    registrationOpen: true,
    registeredCount: 180,
    isDemo: true
  },
  {
    id: 'evt-02',
    title: 'Parliamentary Procedure & Legislative Drafting Workshop [DEMO]',
    category: 'Training Sessions',
    date: '2026-09-02',
    time: '02:00 PM - 06:00 PM',
    venue: 'Peshawar Chapter Training Hall',
    city: 'Peshawar',
    district: 'Peshawar',
    province: 'Khyber Pakhtunkhwa',
    description: 'Hands-on training session on drafting parliamentary questions, calling attention notices, and resolutions according to standard parliamentary rules.',
    speakers: ['Senior Legal Consultants', 'Youth Senate Standing Leads'],
    imageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80',
    registrationOpen: true,
    registeredCount: 64,
    isDemo: true
  }
];

export const initialNews: NewsItem[] = [
  {
    id: 'news-01',
    title: 'Youth Senate of Pakistan Launches National Membership Drive 2026 [DEMO]',
    slug: 'ysp-launches-national-membership-drive-2026',
    category: 'Announcement',
    date: '2026-08-01',
    author: 'YSP Press Secretariat',
    excerpt: 'Youth Senate of Pakistan announces the opening of online applications for passionate young leaders across all districts of Pakistan.',
    content: 'The Youth Senate of Pakistan (YSP) has officially opened its online membership portal for the 2026 session. Founder Chairman Irfan Mateen emphasized that YSP remains committed to serving as a non-partisan platform for parliamentary learning, democratic debate, and youth empowerment.\n\nYoung citizens aged 18-35 from Punjab, Sindh, Khyber Pakhtunkhwa, Balochistan, ICT, GB, and AJK are invited to submit their applications online.',
    imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
    isPublished: true,
    isDemo: true
  },
  {
    id: 'news-02',
    title: 'YSP Standing Committee Presents Policy Recommendations on Education Reform [DEMO]',
    slug: 'ysp-presents-policy-recommendations-education',
    category: 'Press Release',
    date: '2026-07-20',
    author: 'Information & Broadcasting Secretariat',
    excerpt: 'The Standing Committee on Education submitted a comprehensive 15-page policy document focusing on technical skills and IT training.',
    content: 'Following extensive consultations with student bodies and educators, the Standing Committee on Education & Youth Skill Development released its report urging national and provincial authorities to prioritize digital literacy centers in rural districts.',
    imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80',
    isPublished: true,
    isDemo: true
  }
];

export const initialPublications: Publication[] = [
  {
    id: 'pub-01',
    title: 'Youth Senate of Pakistan Annual Policy Review 2025-2026 [DEMO]',
    category: 'Annual Reports',
    publishDate: '2026-01-10',
    description: 'A comprehensive summary of parliamentary sessions, committee reports, youth resolutions, and district activities conducted during 2025.',
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    fileUrl: '#',
    fileSize: '3.4 MB',
    downloadCount: 412,
    isDemo: true
  },
  {
    id: 'pub-02',
    title: 'Youth Parliamentary Guidebook: Rules & Procedure [DEMO]',
    category: 'Official Documents',
    publishDate: '2025-11-01',
    description: 'Official guidebook explaining parliamentary motions, question hour, committee frameworks, and debate etiquette.',
    coverImage: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80',
    fileUrl: '#',
    fileSize: '1.8 MB',
    downloadCount: 890,
    isDemo: true
  }
];

export const initialGallery: GalleryItem[] = [
  {
    id: 'gal-01',
    title: 'Youth Parliamentary Assembly Sitting in Session [DEMO]',
    category: 'Sessions',
    mediaType: 'image',
    url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80',
    date: '2026-05-20',
    description: 'Youth Senators engaged in parliamentary debate.',
    isDemo: true
  },
  {
    id: 'gal-02',
    title: 'Standing Committee Consultation Meeting [DEMO]',
    category: 'Training',
    mediaType: 'image',
    url: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=800&q=80',
    date: '2026-06-12',
    description: 'Committee members reviewing policy draft.',
    isDemo: true
  },
  {
    id: 'gal-03',
    title: 'Youth Leadership Convention Delegates [DEMO]',
    category: 'Events',
    mediaType: 'image',
    url: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80',
    date: '2026-04-10',
    description: 'Delegates from all provinces gathered in Islamabad.',
    isDemo: true
  }
];

export const initialCertificates: Certificate[] = [
  {
    id: 'cert-01',
    certificateNumber: 'YSP-CERT-2025-8801',
    type: 'Membership Certificate',
    recipientName: 'Muhammad Saad Khan',
    membershipId: 'YSP-2025-0101',
    eventNameOrRole: 'Youth Senator - District Peshawar',
    issueDate: '2025-01-15',
    issuedBy: 'Youth Senate Secretariat',
    isValid: true,
    isDemo: true
  },
  {
    id: 'cert-02',
    certificateNumber: 'YSP-CERT-2025-8802',
    type: 'Participation Certificate',
    recipientName: 'Fatima Zohra',
    membershipId: 'YSP-2025-0102',
    eventNameOrRole: 'National Climate Assembly 2025',
    issueDate: '2025-05-20',
    issuedBy: 'Chairman Executive Board',
    isValid: true,
    isDemo: true
  }
];

export const initialResolutions: Resolution[] = [
  {
    id: 'res-01',
    resolutionNumber: 'YSP-RES-2026-01',
    title: 'Resolution on National Youth IT & AI Skill Empowerment Framework [DEMO]',
    moverName: 'Senator Muhammad Saad Khan',
    dateSubmitted: '2026-05-20',
    sessionId: 'sess-02',
    sessionTitle: 'Session 11 Special Sitting',
    text: 'Whereas technology and artificial intelligence form the cornerstone of economic growth, this Youth Senate recommends that provincial governments establish specialized youth coding hubs in secondary districts.',
    status: 'Passed',
    outcome: 'Unanimously passed by 88 votes in favor.',
    isDemo: true
  }
];

export const initialQuestions: ParliamentaryQuestion[] = [
  {
    id: 'pq-01',
    questionNumber: 'YSP-PQ-2026-04',
    memberId: 'sen-02',
    memberName: 'Senator Fatima Zohra',
    committeeName: 'Standing Committee on Climate Change',
    questionText: 'Will the Chairperson state the progress made regarding urban forestry expansion in major provincial capitals?',
    dateSubmitted: '2026-06-01',
    answerText: 'The Standing Committee has formulated guidelines recommending 10% urban green cover allocation in all municipal master plans.',
    status: 'Answered',
    isDemo: true
  }
];

export const initialPolicyRecommendations: PolicyRecommendation[] = [
  {
    id: 'pol-01',
    title: 'Bridging the Rural-Urban Youth Digital Divide [DEMO]',
    category: 'Technology',
    issueBackground: 'Over 40% of rural youth lack access to reliable internet and vocational tech training.',
    youthPerspective: 'Access to the digital economy should be a basic right for every young Pakistani citizen regardless of district.',
    recommendations: [
      'Deploy subsidized broadband expansion in priority districts.',
      'Establish community youth tech centers powered by solar energy.',
      'Introduce digital freelancing courses in local languages.'
    ],
    committeeName: 'Standing Committee on Education & Youth Skill Development',
    publishDate: '2026-04-15',
    isDemo: true
  }
];

export const initialApplications: MembershipApplication[] = [
  {
    id: 'app-01',
    fullName: 'Hamza Noman [DEMO]',
    fatherName: 'Noman Ahmad',
    dateOfBirth: '2001-04-12',
    gender: 'Male',
    cnicNumber: '17301-XXXXXXX-1',
    province: 'Khyber Pakhtunkhwa',
    district: 'Swat',
    city: 'Mingora',
    education: 'BS Political Science',
    institution: 'University of Swat',
    profession: 'Student & Youth Activist',
    phone: '+92 300 0000000',
    email: 'hamza.swat@demo.com',
    address: 'Mingora, District Swat, KPK',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    whyJoin: 'I wish to represent the youth of Swat valley and contribute to educational advocacy.',
    skills: 'Public speaking, policy analysis, community organizing',
    areasOfInterest: ['Education', 'Civic Engagement', 'Tourism Policy'],
    preferredCommittee: 'Standing Committee on Education',
    emergencyContact: '+92 301 0000000',
    termsAccepted: true,
    appliedDate: '2026-08-05',
    status: 'Under Review',
    paymentStatus: 'Paid',
    applicationType: 'Youth Senate',
    isDemo: true
  }
];

export const initialMunMembers: MunMember[] = [];

export const initialVideos: VideoItem[] = [
  {
    id: 'vid-01',
    title: 'Founder Chairman Irfan Mateen Keynote Address at Youth Senate Inaugural Assembly',
    description: 'Official opening speech by Founder Chairman Irfan Mateen highlighting youth parliamentary training, civic responsibility, and constitutional literacy.',
    category: 'Official Messages',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    storagePath: 'youth-senate/videos/vid-01_irfan_mateen_keynote.mp4',
    thumbnailUrl: '/src/assets/images/irfan_mateen_original_1786443966305.jpg',
    duration: '04:12',
    uploadedBy: 'Irfan Mateen (Founder Chairman)',
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-08-01T10:00:00Z',
    status: 'published',
    sortOrder: 1,
    isDemo: false
  },
  {
    id: 'vid-02',
    title: 'Youth Senate Session 12: Debate on Economic Empowerment & Digital Skills',
    description: 'Full proceedings of the 12th Parliamentary Session focusing on youth IT training hubs, freelancing opportunities, and provincial policy recommendations.',
    category: 'Parliamentary Sessions',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    storagePath: 'youth-senate/videos/vid-02_session_12.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80',
    duration: '09:56',
    uploadedBy: 'Secretariat Media Team',
    createdAt: '2026-07-20T14:30:00Z',
    updatedAt: '2026-07-20T14:30:00Z',
    status: 'published',
    sortOrder: 2,
    isDemo: true
  },
  {
    id: 'vid-03',
    title: 'National Youth Parliamentary Leadership Convention 2026 - Highlights',
    description: 'Highlights from the All-Pakistan Youth Leadership Convention featuring delegates from all 4 provinces, Gilgit-Baltistan, and Azad Jammu & Kashmir.',
    category: 'Youth Senate Events',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    storagePath: 'youth-senate/videos/vid-03_convention_highlights.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80',
    duration: '03:45',
    uploadedBy: 'Event Manager',
    createdAt: '2026-06-15T11:20:00Z',
    updatedAt: '2026-06-15T11:20:00Z',
    status: 'published',
    sortOrder: 3,
    isDemo: true
  },
  {
    id: 'vid-04',
    title: 'Parliamentary Procedure & Legislative Drafting Workshop - Peshawar Session',
    description: 'Training workshop on parliamentary rules of order, bill drafting techniques, and committee leadership.',
    category: 'Training Sessions',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    storagePath: 'youth-senate/videos/vid-04_peshawar_workshop.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=800&q=80',
    duration: '06:20',
    uploadedBy: 'KPK Chapter Coordinator',
    createdAt: '2026-05-10T09:15:00Z',
    updatedAt: '2026-05-10T09:15:00Z',
    status: 'published',
    sortOrder: 4,
    isDemo: true
  }
];

export const initialPages: PageContent[] = [
  {
    id: 'constitution',
    pageName: 'Constitution & Rules of Procedure',
    slug: 'constitution',
    title: 'Constitution & Rules of Procedure',
    subtitle: 'Rules of order, code of conduct, committee regulations, and parliamentary ethics governing Youth Senate of Pakistan.',
    content: `Article 1: Preamble & Name
The Youth Senate of Pakistan is established as a non-partisan, independent youth parliamentary platform to foster democratic awareness, parliamentary procedure, and civic leadership across all provinces and territories of Pakistan.

Article 2: Rules of Conduct & Etiquette
All Youth Senators and delegates shall maintain parliamentary dignity, decorum, and respectful speech during all sittings, committee meetings, and public forums.

Article 3: Standing Committee Governance
Standing committees are empowered to examine policy matters, conduct consultations, and submit formal youth recommendations to the Youth Senate Secretariat.`,
    heroImage: '',
    isPublished: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'home',
    pageName: 'Home Page',
    slug: 'home',
    title: "Empowering Pakistan's Youth Through Parliamentary Democracy",
    subtitle: "Learn. Debate. Lead. Serve.",
    content: "Youth Senate of Pakistan provides a structured platform for young people to develop parliamentary understanding, leadership skills, civic responsibility, and constructive policy dialogue.",
    isPublished: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'about',
    pageName: 'About Us',
    slug: 'about',
    title: "About Youth Senate of Pakistan",
    subtitle: "Non-partisan, youth-led democratic leadership platform",
    content: "Youth Senate of Pakistan is an independent non-governmental movement empowering young citizens from all provinces and districts of Pakistan with parliamentary skills and constitutional knowledge.",
    isPublished: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'founder',
    pageName: 'Founder Chairman',
    slug: 'founder',
    title: "Founder Chairman - Irfan Mateen",
    subtitle: "Visionary Founder & Patron of Youth Senate of Pakistan",
    content: "Irfan Mateen established Youth Senate of Pakistan to nurture ethical leadership and democratic responsibility in Pakistani youth.",
    isPublished: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'president',
    pageName: 'President Office',
    slug: 'president',
    title: "President - Haroon Mateen",
    subtitle: "President of Youth Senate of Pakistan (بااختیار نوجوان، مضبوط پاکستان)",
    content: "Haroon Mateen leads executive council operations and directs provincial chapters to champion youth parliamentary participation across Pakistan.",
    isPublished: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'leadership',
    pageName: 'Executive Leadership',
    slug: 'leadership',
    title: "Executive Leadership Body",
    subtitle: "Guiding Youth Senate of Pakistan across all regions",
    content: "Our Executive Council consists of dedicated youth leaders managing provincial chapters, standing committees, and national parliamentary sessions.",
    isPublished: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'senators',
    pageName: 'Youth Senators Directory',
    slug: 'senators',
    title: "Youth Senators Directory",
    subtitle: "Elected and inducted youth representatives across Pakistan",
    content: "Directory of active Youth Senators representing districts across Khyber Pakhtunkhwa, Punjab, Sindh, Balochistan, ICT, Gilgit-Baltistan, and AJK.",
    isPublished: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'events',
    pageName: 'Events & Conferences',
    slug: 'events',
    title: "Events, Conferences & Youth Conventions",
    subtitle: "Engaging youth in civic conventions, training workshops, and policy dialogues",
    content: "Upcoming and past parliamentary sessions, national youth conventions, and district leadership workshops.",
    isPublished: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'news',
    pageName: 'News & Media Releases',
    slug: 'news',
    title: "News, Press Releases & Updates",
    subtitle: "Official statements and media coverage of Youth Senate activities",
    content: "Latest news, official press statements, and updates from the Youth Senate Secretariat.",
    isPublished: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'videos',
    pageName: 'Video Gallery',
    slug: 'videos',
    title: "Youth Senate Video Library",
    subtitle: "Parliamentary session recordings, press conferences, and event highlights",
    content: "Watch recordings of parliamentary debates, youth speeches, and leadership interviews.",
    isPublished: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'gallery',
    pageName: 'Photo Gallery',
    slug: 'gallery',
    title: "Official Photo Gallery",
    subtitle: "Glimpses of sessions, conventions, and community activities",
    content: "High-resolution photo coverage of parliamentary proceedings and regional events.",
    isPublished: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'contact',
    pageName: 'Contact Us',
    slug: 'contact',
    title: "Contact Youth Senate Secretariat",
    subtitle: "Get in touch with our central office in Peshawar & Islamabad",
    content: "Reach out to the Youth Senate Secretariat for inquiries, chapter registrations, or media relations.",
    isPublished: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'mun',
    pageName: 'Youth MUN',
    slug: 'mun',
    title: "Empowering Young Voices Through Model United Nations",
    subtitle: "Learn. Debate. Negotiate. Lead.",
    content: "To create a generation of confident, informed, and responsible young leaders who can understand global challenges, engage in constructive dialogue, and contribute positively to society. Youth MUN members participate in Model United Nations conferences, training sessions, public speaking, negotiation, and resolution writing.",
    isPublished: true,
    updatedAt: new Date().toISOString()
  }
];

export const initialMenuItems: MenuItem[] = [
  { id: 'm-01', title: 'Home', viewKey: 'home', path: '/', order: 1, isEnabled: true },
  { id: 'm-02', title: 'About Us', viewKey: 'about', path: '/about', order: 2, isEnabled: true },
  { id: 'm-03', title: 'Founder Chairman', viewKey: 'founder', path: '/founder', order: 3, isEnabled: true },
  { id: 'm-04', title: 'Leadership', viewKey: 'leadership', path: '/leadership', order: 4, isEnabled: true },
  { id: 'm-05', title: 'Youth Senators', viewKey: 'senators', path: '/senators', order: 5, isEnabled: true },
  { id: 'm-06', title: 'Committees', viewKey: 'committees', path: '/committees', order: 6, isEnabled: true },
  { id: 'm-07', title: 'Districts', viewKey: 'chapters', path: '/chapters', order: 7, isEnabled: true },
  { id: 'm-08', title: 'Events', viewKey: 'events', path: '/events', order: 8, isEnabled: true },
  { id: 'm-09', title: 'News', viewKey: 'news', path: '/news', order: 9, isEnabled: true },
  { id: 'm-10', title: 'Video Gallery', viewKey: 'videos', path: '/videos', order: 10, isEnabled: true },
  { id: 'm-11', title: 'Photo Gallery', viewKey: 'gallery', path: '/gallery', order: 11, isEnabled: true },
  { id: 'm-12', title: 'Apply Membership', viewKey: 'apply', path: '/apply', order: 12, isEnabled: true },
  { id: 'm-13', title: 'Contact', viewKey: 'contact', path: '/contact', order: 13, isEnabled: true }
];

export const initialMediaItems: MediaItem[] = [
  {
    id: 'med-01',
    title: 'Founder Chairman Official Portrait',
    type: 'image',
    url: '/src/assets/images/irfan_mateen_original_1786443966305.jpg',
    fileSize: '1.2 MB',
    uploadedAt: '2026-08-11T10:00:00Z',
    usedIn: ['Founder Chairman Profile', 'Homepage Leadership Section']
  },
  {
    id: 'med-02',
    title: 'President Haroon Mateen Photo',
    type: 'image',
    url: '/src/assets/images/haroon_mateen_president_1786445857055.jpg',
    fileSize: '1.5 MB',
    uploadedAt: '2026-08-11T10:30:00Z',
    usedIn: ['President Profile', 'Leadership Page']
  },
  {
    id: 'med-03',
    title: 'Youth Senate Official Logo',
    type: 'logo',
    url: '/src/assets/images/ysp_official_logo_1786441197850.jpg',
    fileSize: '350 KB',
    uploadedAt: '2026-08-11T09:00:00Z',
    usedIn: ['Website Header', 'Footer', 'Certificates']
  }
];

export const initialSystemUsers: SystemUser[] = [
  {
    id: 'user-01',
    name: 'Irfan Mateen (Chairman / Super Admin)',
    email: 'irfanmateen184@gmail.com',
    role: 'Super Admin',
    isActive: true
  },
  {
    id: 'user-02',
    name: 'Haroon Mateen',
    email: 'president@youthsenate.pk',
    role: 'Super Admin',
    isActive: true
  }
];

