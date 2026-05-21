export type UserRole = 'client' | 'freelancer' | 'agency_owner' | 'admin';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending_verification';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  avatar?: string;
  phone?: string;
  country?: string;
  timezone?: string;
  role: UserRole;
  status: UserStatus;
  isEmailVerified: boolean;
  bio?: string;
  walletBalance: number;
  escrowBalance: number;
  averageRating: number;
  totalReviews: number;
  isFeatured: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  freelancerProfile?: FreelancerProfile;
  clientProfile?: ClientProfile;
  agencyProfile?: AgencyProfile;
  socialLinks?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    website?: string;
  };
}

export interface FreelancerProfile {
  id: string;
  userId: string;
  title?: string;
  overview?: string;
  experienceLevel: 'entry' | 'intermediate' | 'expert';
  hourlyRate: number;
  currency?: string;
  availability: 'available' | 'partially_available' | 'not_available';
  hoursPerWeek: number;
  totalJobsCompleted: number;
  totalEarned: number;
  successRate: number;
  isVerified: boolean;
  isTopRated: boolean;
  isRising: boolean;
  languages?: string;
  education?: Array<{ institution: string; degree: string; field: string; from: number; to: number }>;
  certifications?: Array<{ name: string; issuer: string; year: number; url?: string }>;
  skills?: Skill[];
  portfolioItems?: Portfolio[];
  agency?: Agency;
  responseTime: number;
  responseRate: number;
}

export interface ClientProfile {
  id: string;
  userId: string;
  clientType: 'individual' | 'company' | 'agency';
  companyName?: string;
  companySize?: string;
  industry?: string;
  website?: string;
  isVerified: boolean;
  totalProjectsPosted: number;
  totalProjectsCompleted: number;
  totalSpent: number;
}

export interface AgencyProfile {
  id: string;
  userId: string;
  agencyId: string;
  specializations?: string[];
}

export interface Agency {
  id: string;
  name: string;
  slug: string;
  description?: string;
  tagline?: string;
  logoUrl?: string;
  coverUrl?: string;
  website?: string;
  country?: string;
  city?: string;
  size: 'solo' | 'small' | 'medium' | 'large';
  status: 'active' | 'inactive' | 'suspended';
  foundedYear?: number;
  isVerified: boolean;
  isFeatured: boolean;
  hourlyRate: number;
  averageRating: number;
  totalReviews: number;
  totalProjectsCompleted: number;
  ownerId: string;
  skills?: Skill[];
  agencyMembers?: AgencyMember[];
}

export interface AgencyMember {
  id: string;
  agencyId: string;
  userId: string;
  role: 'owner' | 'manager' | 'member';
  status: 'active' | 'inactive' | 'pending' | 'rejected';
  title?: string;
  revenueShare: number;
  joinedAt?: string;
  user?: User;
}

export interface Skill {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  usageCount: number;
  categoryId?: string;
  category?: Category;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  projectCount: number;
  parentId?: string;
  children?: Category[];
  skills?: Skill[];
}

export interface Portfolio {
  id: string;
  freelancerProfileId: string;
  title: string;
  description?: string;
  projectUrl?: string;
  repositoryUrl?: string;
  images?: string[];
  thumbnailUrl?: string;
  client?: string;
  completedAt?: string;
  projectValue?: number;
  skills?: Skill[];
  likesCount: number;
  viewsCount: number;
}

export type ProjectStatus = 'draft' | 'open' | 'in_review' | 'in_progress' | 'paused' | 'completed' | 'cancelled' | 'closed';
export type ProjectType = 'fixed' | 'hourly';

export interface Project {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  type: ProjectType;
  budgetMin?: number;
  budgetMax?: number;
  hourlyRateMin?: number;
  hourlyRateMax?: number;
  duration?: string;
  experienceRequired: 'entry' | 'intermediate' | 'expert';
  visibility: 'public' | 'invite_only' | 'private';
  deadline?: string;
  bidsCount: number;
  viewsCount: number;
  isFeatured: boolean;
  isUrgent: boolean;
  allowAgencyBids: boolean;
  requirements?: string[];
  questions?: string[];
  preferredLocation?: string;
  currency?: string;
  clientId: string;
  client?: User;
  categoryId?: string;
  category?: Category;
  skills?: Skill[];
  bids?: Bid[];
  createdAt: string;
  updatedAt: string;
}

export type BidStatus = 'pending' | 'shortlisted' | 'accepted' | 'rejected' | 'withdrawn' | 'expired';

export interface Bid {
  id: string;
  projectId: string;
  project?: Project;
  bidderId: string;
  bidder?: User;
  agencyId?: string;
  agency?: Agency;
  bidType: 'freelancer' | 'agency';
  status: BidStatus;
  amount: number;
  currency?: string;
  deliveryTime?: number;
  deliveryUnit?: string;
  coverLetter: string;
  questionAnswers?: Array<{ question: string; answer: string }>;
  milestones?: BidMilestone[];
  expiresAt?: string;
  clientNote?: string;
  rejectionReason?: string;
  acceptedAt?: string;
  createdAt: string;
}

export interface BidMilestone {
  id: string;
  bidId: string;
  title: string;
  description?: string;
  amount: number;
  dueDate?: string;
  sortOrder: number;
}

export type ContractStatus = 'pending' | 'active' | 'paused' | 'disputed' | 'completed' | 'cancelled' | 'terminated';

export interface Contract {
  id: string;
  contractNumber: string;
  projectId: string;
  project?: Project;
  clientId: string;
  client?: User;
  freelancerId: string;
  freelancer?: User;
  bidId?: string;
  status: ContractStatus;
  type: 'fixed' | 'hourly' | 'retainer';
  terms?: string;
  totalAmount: number;
  paidAmount: number;
  escrowAmount: number;
  hourlyRate?: number;
  currency?: string;
  startDate?: string;
  endDate?: string;
  deadline?: string;
  clientSigned: boolean;
  freelancerSigned: boolean;
  platformFeePercent: number;
  platformFeeAmount: number;
  milestones?: Milestone[];
  createdAt: string;
}

export type MilestoneStatus = 'pending' | 'in_progress' | 'submitted' | 'under_review' | 'revision_requested' | 'approved' | 'rejected' | 'paid' | 'cancelled';

export interface Milestone {
  id: string;
  contractId: string;
  title: string;
  description?: string;
  amount: number;
  currency?: string;
  status: MilestoneStatus;
  dueDate?: string;
  sortOrder: number;
  revisionCount: number;
  maxRevisions: number;
  isEscrowFunded: boolean;
  escrowAmount: number;
  submissions?: MilestoneSubmission[];
}

export interface MilestoneSubmission {
  id: string;
  milestoneId: string;
  description: string;
  attachments?: string[];
  deliverableLinks?: string[];
  status: 'pending' | 'approved' | 'rejected' | 'revision_requested';
  clientFeedback?: string;
  revisionNumber: number;
  createdAt: string;
}

export interface Payment {
  id: string;
  transactionId: string;
  payerId: string;
  payeeId: string;
  contractId?: string;
  milestoneId?: string;
  type: string;
  status: string;
  method: string;
  amount: number;
  platformFee: number;
  netAmount: number;
  currency: string;
  description?: string;
  completedAt?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  reviewerId: string;
  reviewer?: User;
  revieweeId: string;
  contractId: string;
  type: 'client_to_freelancer' | 'freelancer_to_client';
  overallRating: number;
  communicationRating?: number;
  qualityRating?: number;
  timelinessRating?: number;
  comment?: string;
  response?: string;
  isPublic: boolean;
  helpfulCount: number;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface Dispute {
  id: string;
  disputeNumber: string;
  contractId: string;
  contract?: Contract;
  claimantId: string;
  claimant?: User;
  respondentId: string;
  respondent?: User;
  status: string;
  reason: string;
  title: string;
  description: string;
  claimAmount?: number;
  resolution?: string;
  messages?: DisputeMessage[];
  createdAt: string;
}

export interface DisputeMessage {
  id: string;
  disputeId: string;
  senderId?: string;
  sender?: User;
  senderType: string;
  message: string;
  attachments?: string[];
  createdAt: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}
