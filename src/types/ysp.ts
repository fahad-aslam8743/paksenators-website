export type Language = 'en' | 'ur';

export type UserRole = 
  | 'Super Admin'
  | 'Administrator'
  | 'Content Manager'
  | 'Membership Manager'
  | 'Event Manager'
  | 'Committee Manager'
  | 'District Manager'
  | 'Finance Manager'
  | 'Member';

export type ApplicationStatus = 'Submitted' | 'Under Review' | 'Interview Required' | 'Approved' | 'Rejected' | 'Pending';

export type PaymentStatus = 'Pending' | 'Paid' | 'Verified' | 'Rejected' | 'Refunded';

export type SessionStatus = 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled';

export type QuestionStatus = 'Submitted' | 'Under Review' | 'Answered' | 'Closed';

export type ResolutionStatus = 'Draft' | 'Submitted' | 'Passed' | 'Rejected' | 'Deferred';

export interface SiteSettings {
  organizationName: string;
  organizationShortName: string;
  logoUrl?: string;
  heroImageUrl?: string;
  heroHeadline: string;
  heroSubheadline: string;
  heroDescription: string;
  visionStatement: string;
  missionStatement: string;
  coreObjectives: { title: string; description: string; iconName: string }[];
  officialEmail: string;
  officialPhone: string;
  officeAddress: string;
  officeHours: string;
  membershipFeeAmount: number;
  currency: string;
  bankPaymentDetails: string;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
    linkedin?: string;
    tiktok?: string;
  };
  legalDisclaimer: string;
  allowDemoData: boolean;
}

export interface LeadershipMember {
  id: string;
  name: string;
  designation: string;
  category: 
    | 'Founder Chairman'
    | 'President'
    | 'Vice President'
    | 'Finance Secretary'
    | 'Joint Secretary'
    | 'Press Secretary'
    | 'Office Secretary'
    | 'Chairman'
    | 'Deputy Chairman'
    | 'Leader of the House'
    | 'Standing Committee Chairpersons'
    | 'District Presidents'
    | 'District Secretaries'
    | 'Other Executive Members'
    | 'Executive Council'
    | 'Provincial Leadership'
    | 'District Leadership';
  photoUrl: string;
  photoStoragePath?: string;
  province: string;
  district: string;
  biography: string;
  message?: string;
  email?: string;
  phone?: string;
  socials?: { twitter?: string; linkedin?: string; facebook?: string };
  order: number;
  isActive: boolean;
  isDemo?: boolean;
  updatedAt?: string;
}

export interface Committee {
  id: string;
  name: string;
  code: string;
  chairpersonName: string;
  chairpersonPhotoUrl?: string;
  viceChairpersonName?: string;
  mandate: string;
  objectives: string[];
  meetingSchedule: string;
  memberCount: number;
  category: string;
  coverImage?: string;
  isDemo?: boolean;
}

export interface Senator {
  id: string;
  membershipId: string;
  name: string;
  fatherName?: string;
  cnicNumber?: string;
  designation: string;
  district: string;
  province: string;
  committeeId?: string;
  committeeName?: string;
  address?: string;
  photoUrl: string;
  joiningDate: string;
  validUntil: string;
  biography: string;
  parliamentaryRole: string;
  attendancePercentage: number;
  sessionsAttendedCount: number;
  eventsAttendedCount: number;
  certificatesCount: number;
  status: 'Active' | 'Inactive' | 'Suspended';
  email: string;
  phonePrivate?: string; // Private, not shown on public profile
  portalPassword?: string; // Member portal login password, generated on approval
  isDemo?: boolean;
}

export interface DistrictChapter {
  id: string;
  name: string;
  province: 'Khyber Pakhtunkhwa' | 'Punjab' | 'Sindh' | 'Balochistan' | 'Islamabad Capital Territory' | 'Gilgit-Baltistan' | 'Azad Jammu & Kashmir';
  coordinatorName?: string;
  coordinatorContact?: string;
  presidentName?: string;
  presidentPhotoUrl?: string;
  senatorCount: number;
  establishedDate: string;
  description: string;
  status: 'Active' | 'Forming';
  isDemo?: boolean;
}

export interface Session {
  id: string;
  sessionNumber: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  host: string;
  agenda: string;
  status: SessionStatus;
  proceedingsSummary?: string;
  pdfDocumentUrl?: string;
  participantsCount: number;
  coverImage?: string;
  isDemo?: boolean;
}

export interface EventItem {
  id: string;
  title: string;
  category: 'Youth Conferences' | 'Seminars' | 'Workshops' | 'Training Sessions' | 'Parliamentary Sessions' | 'Study Visits' | 'Government Visits' | 'Awareness Campaigns' | 'Independence Events' | 'Youth Conventions' | 'Community Activities';
  date: string;
  time: string;
  venue: string;
  city: string;
  district: string;
  province: string;
  description: string;
  speakers: string[];
  chiefGuests?: string[];
  imageUrl: string;
  registrationOpen: boolean;
  registeredCount: number;
  isDemo?: boolean;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  eventTitle: string;
  fullName: string;
  fatherName: string;
  email: string;
  phone: string;
  province: string;
  district: string;
  membershipNumber?: string;
  organization: string;
  message?: string;
  registeredAt: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  attended: boolean;
  isDemo?: boolean;
}

export interface NewsItem {
  id: string;
  title: string;
  slug: string;
  category: 'News' | 'Press Release' | 'Official Statement' | 'Announcement' | 'Media Coverage' | 'Notice' | 'Youth Senate Update';
  date: string;
  author: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  isPublished: boolean;
  isDemo?: boolean;
}

export interface Publication {
  id: string;
  title: string;
  category: 'Annual Reports' | 'Session Reports' | 'Committee Reports' | 'Policy Recommendations' | 'Research Papers' | 'Newsletters' | 'Magazines' | 'Official Documents';
  publishDate: string;
  description: string;
  coverImage: string;
  fileUrl: string;
  fileSize: string;
  downloadCount: number;
  isDemo?: boolean;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: 'Sessions' | 'Events' | 'Leadership' | 'Government Visits' | 'Training' | 'District Activities' | 'Conferences' | 'Youth Conventions';
  mediaType: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  date: string;
  description?: string;
  isDemo?: boolean;
}

/**
 * A curated set of multiple photos uploaded together as one named album —
 * e.g. "Session 12 — Peshawar" with 10 photos, one title, one description.
 * Distinct from GalleryItem above (which is one single photo/video per
 * entry) — this is specifically for the admin panel's "select several
 * photos at once" upload flow.
 */
export interface GalleryCollection {
  id: string;
  title: string;
  description?: string;
  photoUrls: string[];
  date: string;
  isDemo?: boolean;
}

export type VideoCategory = 
  | 'Parliamentary Sessions'
  | 'Youth Senate Events'
  | 'Seminars'
  | 'Conferences'
  | 'Training Sessions'
  | 'District Activities'
  | 'Media Coverage'
  | 'Interviews'
  | 'Official Messages'
  | 'Independence Events'
  | 'Awareness Programs'
  | 'Other';

export interface VideoItem {
  id: string;
  title: string;
  description: string;
  category: VideoCategory;
  videoUrl: string;
  storagePath: string;
  thumbnailUrl?: string;
  thumbnailStoragePath?: string;
  duration?: string;
  uploadedBy?: string;
  createdAt: string;
  updatedAt: string;
  status: 'published' | 'unpublished';
  sortOrder: number;
  isDemo?: boolean;
}

export interface Certificate {
  id: string;
  certificateNumber: string;
  type: 'Membership Certificate' | 'Participation Certificate' | 'Appointment Letter' | 'Excellence Award' | 'Training Completion';
  recipientName: string;
  recipientEmail?: string;
  membershipId?: string;
  eventNameOrRole: string;
  issueDate: string;
  issuedBy: string;
  isValid: boolean;
  qrCodeDataUrl?: string;
  isDemo?: boolean;
}

export interface MembershipApplication {
  id: string;
  applicationType?: 'Youth Senate' | 'MUN'; // Distinguishes which membership form this came from. Missing/undefined = legacy Youth Senate application.
  fullName: string;
  fatherName: string;
  dateOfBirth: string;
  gender: string;
  cnicNumber: string; // Private
  province: string;
  district: string;
  city: string;
  education: string;
  institution: string;
  profession: string;
  phone: string;
  email: string;
  address: string;
  photoUrl: string;
  passportPhotoUrl?: string;
  cnicFrontUrl?: string;
  cnicBackUrl?: string;
  paymentReceiptUrl?: string;
  whyJoin: string;
  skills: string;
  areasOfInterest: string[];
  preferredCommittee: string;
  emergencyContact: string;
  termsAccepted: boolean;
  appliedDate: string;
  status: ApplicationStatus;
  paymentStatus: PaymentStatus;
  reviewNotes?: string;
  assignedMembershipId?: string;
  isDemo?: boolean;
}

/**
 * An approved / inducted Youth MUN Member — the MUN counterpart of `Senator`.
 * Created by the admin panel (MUN Admin tab) once a MUN Membership
 * application has been accepted after interview shortlisting.
 */
export interface MunMember {
  id: string;
  membershipId: string;
  name: string;
  fatherName?: string;
  cnicNumber?: string;
  district: string;
  province: string;
  committeeName?: string;
  address?: string;
  photoUrl: string;
  email: string;
  phone?: string;
  joiningDate: string;
  validUntil: string;
  biography?: string;
  role: string; // e.g. "Youth MUN Member", "Delegate", "Committee Chair"
  status: 'Active' | 'Inactive' | 'Suspended';
  isDemo?: boolean;
}

export interface ParliamentaryQuestion {
  id: string;
  questionNumber: string;
  memberId: string;
  memberName: string;
  committeeName: string;
  questionText: string;
  dateSubmitted: string;
  answerText?: string;
  status: QuestionStatus;
  documentUrl?: string;
  isDemo?: boolean;
}

export interface Resolution {
  id: string;
  resolutionNumber: string;
  title: string;
  moverName: string;
  dateSubmitted: string;
  sessionId?: string;
  sessionTitle?: string;
  text: string;
  status: ResolutionStatus;
  outcome?: string;
  pdfUrl?: string;
  isDemo?: boolean;
}

export interface PolicyRecommendation {
  id: string;
  title: string;
  category: 'Education' | 'Youth Affairs' | 'Climate' | 'Employment' | 'Technology' | 'Health' | 'Governance' | 'Social Development' | 'International Relations';
  issueBackground: string;
  youthPerspective: string;
  recommendations: string[];
  committeeName: string;
  publishDate: string;
  pdfUrl?: string;
  isDemo?: boolean;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  submittedAt: string;
  isRead: boolean;
  repliedAt?: string;
  isDemo?: boolean;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  subscribedAt: string;
  isActive: boolean;
  isDemo?: boolean;
}

export interface PageContent {
  id: string;
  pageName: string;
  slug: string;
  title: string;
  subtitle: string;
  content: string;
  heroImage?: string;
  heroImageStoragePath?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  isPublished: boolean;
  updatedAt?: string;
}

export interface MenuItem {
  id: string;
  title: string;
  viewKey: string;
  path: string;
  order: number;
  isExternal?: boolean;
  externalUrl?: string;
  isEnabled: boolean;
  parentId?: string;
}

export interface MediaItem {
  id: string;
  title: string;
  type: 'image' | 'video' | 'document' | 'logo';
  url: string;
  storagePath?: string;
  fileSize?: string;
  uploadedAt: string;
  usedIn?: string[];
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  membershipId?: string;
  senatorProfile?: Senator;
  password?: string;
}

/**
 * AdminUser represents an authenticated Firebase Auth identity that has been
 * verified via the `admin` custom claim on their ID token (set server-side).
 * This is completely separate from the member/senator `SystemUser` session.
 */
export interface AdminUser {
  uid: string;
  name: string;
  email: string;
  role: 'Super Admin' | 'Administrator' | 'Editor';
  createdAt?: string;
}
