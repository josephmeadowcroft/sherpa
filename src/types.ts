export interface UserProfile {
  uid: string;
  email: string;
  username: string;
  displayName: string;
  photoURL?: string;
  course: string;
  university: string;
  gradYear: string;
  targetRoles: string[];
  targetIndustries?: string[];
  cvText?: string;
  cvFileName?: string;
  cvUpdatedAt?: string;
  createdAt: string;
  onboardingCompleted?: boolean;
}

export interface CvTip {
  severity: 'high' | 'medium' | 'low';
  section: string;
  issue: string;
  fix: string;
  example: string;
}

export interface CvImprovedSection {
  section: string;
  original: string;
  improved: string;
}

export interface CvCategoryScores {
  impact: number;
  clarity: number;
  formatting: number;
  relevance: number;
  keywords: number;
}

export interface CvAnalysis {
  id?: string;
  userId: string;
  overallScore: number;
  categoryScores: CvCategoryScores;
  summary: string;
  tips: CvTip[];
  improvedSections: CvImprovedSection[];
  extractedText?: string;
  createdAt: string;
}

export interface GeneratedCv {
  texSource: string;
  pdfBase64: string;
}

export interface NextStepRecommendation {
  nextStep: string;
  reason: string;
  ctaLabel: string;
  ctaLink: '/cv' | '/tracker' | null;
}

export interface Internship {
  id: string;
  company: string;
  role: string;
  industry: string;
  location: string;
  deadline: string;
  applyUrl: string;
  programType?: string;
  notes?: string;
  source?: string;
  fetchedAt: string;
}

export type ApplicationStatus = 'Saved' | 'Applied' | 'Interview' | 'Offer' | 'Rejected';

export interface ApplicationRecord {
  id: string;
  userId: string;
  internshipId: string;
  company: string;
  role: string;
  industry: string;
  location: string;
  deadline: string;
  applyUrl: string;
  status: ApplicationStatus;
  updatedAt: string;
}

export interface ActivityItem {
  id: string;
  userId: string;
  username: string;
  userDisplayName?: string;
  userPhotoURL?: string;
  type: 'applied' | 'cv_improved' | 'joined' | 'offer';
  text: string;
  meta?: Record<string, any>;
  createdAt: string;
}

export interface FriendUser {
  uid: string;
  username: string;
  displayName: string;
  course?: string;
  university?: string;
  photoURL?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}
