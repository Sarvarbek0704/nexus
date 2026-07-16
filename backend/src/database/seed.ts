/**
 * Nexus — Comprehensive Database Seeder
 * Run: npx ts-node src/database/seed.ts
 *
 * Fills the database with realistic demo data covering every
 * status / state for every module. Also creates 4 read-only
 * demo accounts (one per role).
 */

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

// ── entities ──────────────────────────────────────────────────────────────────
import { User, UserRole, UserStatus, AuthProvider } from './entities/user.entity';
import { FreelancerProfile, ExperienceLevel, AvailabilityStatus } from './entities/freelancer-profile.entity';
import { ClientProfile, ClientType } from './entities/client-profile.entity';
import { Agency, AgencySize, AgencyStatus } from './entities/agency.entity';
import { AgencyProfile } from './entities/agency-profile.entity';
import { AgencyMember, AgencyMemberRole, AgencyMemberStatus } from './entities/agency-member.entity';
import { Skill } from './entities/skill.entity';
import { Category } from './entities/category.entity';
import {
  Project, ProjectStatus, ProjectType,
  ProjectDuration, ExperienceRequired, ProjectVisibility,
} from './entities/project.entity';
import { Bid, BidStatus, BidType } from './entities/bid.entity';
import { Contract, ContractStatus, ContractType } from './entities/contract.entity';
import { Milestone, MilestoneStatus } from './entities/milestone.entity';
import { MilestoneSubmission } from './entities/milestone-submission.entity';
import { Payment, PaymentStatus, PaymentType, PaymentMethod } from './entities/payment.entity';
import { Review, ReviewType } from './entities/review.entity';
import { Dispute, DisputeStatus, DisputeReason } from './entities/dispute.entity';
import { DisputeMessage } from './entities/dispute-message.entity';
import { Invoice, InvoiceStatus } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { Notification, NotificationType } from './entities/notification.entity';
import { Portfolio } from './entities/portfolio.entity';
import { TimeLog } from './entities/time-log.entity';
import { Message, MessageStatus, MessageType } from './entities/message.entity';
import { Conversation, ConversationType } from './entities/conversation.entity';
import { BidMilestone } from './entities/bid-milestone.entity';

// ── DataSource ────────────────────────────────────────────────────────────────
// The connection string comes from the environment. It used to be hardcoded
// here — a live Neon database URL, password and all, committed to a public
// repository. That credential must be rotated in Neon; removing it from the
// code stops it leaking again but does not un-leak what is already in history.
const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env and fill it in.');
}

const AppDataSource = new DataSource({
  type: 'postgres',
  url: DB_URL,
  ssl: { rejectUnauthorized: false },
  entities: [
    User, FreelancerProfile, ClientProfile,
    Agency, AgencyProfile, AgencyMember,
    Skill, Category,
    Project, Bid, BidMilestone, Contract,
    Milestone, MilestoneSubmission,
    Payment, Review, TimeLog,
    Invoice, InvoiceItem,
    Dispute, DisputeMessage,
    Notification, Portfolio,
    Message, Conversation,
  ],
  synchronize: true,
  logging: false,
});

// ── helpers ───────────────────────────────────────────────────────────────────
const daysAgo  = (n: number) => new Date(Date.now() - n * 86_400_000);
const daysAhead = (n: number) => new Date(Date.now() + n * 86_400_000);
const pick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
let txCounter = 1;
const txId = () => `TXN-${String(txCounter++).padStart(8, '0')}`;
let contractCounter = 1;
const ctrNo = () => `CTR-2024-${String(contractCounter++).padStart(4, '0')}`;
let disputeCounter = 1;
const dispNo = () => `DSP-2024-${String(disputeCounter++).padStart(4, '0')}`;
let invoiceCounter = 1;
const invNo = () => `INV-2024-${String(invoiceCounter++).padStart(4, '0')}`;

const PASS_REGULAR = 'Nexus@1234';
const PASS_DEMO    = 'Demo@1234';

// ── TRUNCATE ──────────────────────────────────────────────────────────────────
async function truncateAll(ds: DataSource) {
  const tables = [
    'dispute_messages', 'disputes',
    'invoice_items', 'invoices',
    'time_logs', 'milestone_submissions', 'milestones',
    'payments', 'reviews',
    'bids', 'bid_milestones', 'contracts',
    'agency_members',
    'project_skills', 'projects',
    'freelancer_skills', 'agency_skills',
    'portfolios',
    'agency_profiles', 'agencies',
    'freelancer_profiles', 'client_profiles',
    'notifications', 'messages', 'conversations',
    'users', 'skills', 'categories',
  ];
  for (const t of tables) {
    await ds.query(`TRUNCATE TABLE "${t}" CASCADE`).catch(() => {});
  }
  console.log('✓ Tables cleared');
}

// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  await AppDataSource.initialize();
  console.log('✓ Connected to Neon PostgreSQL');

  // Add isDemo column if missing
  await AppDataSource.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS "isDemo" boolean NOT NULL DEFAULT false
  `).catch(() => {});

  await truncateAll(AppDataSource);

  // ── repositories ────────────────────────────────────────────────────────────
  const userRepo       = AppDataSource.getRepository(User);
  const catRepo        = AppDataSource.getRepository(Category);
  const skillRepo      = AppDataSource.getRepository(Skill);
  const fpRepo         = AppDataSource.getRepository(FreelancerProfile);
  const cpRepo         = AppDataSource.getRepository(ClientProfile);
  const agencyRepo     = AppDataSource.getRepository(Agency);
  const agProRepo      = AppDataSource.getRepository(AgencyProfile);
  const agMemRepo      = AppDataSource.getRepository(AgencyMember);
  const projRepo       = AppDataSource.getRepository(Project);
  const bidRepo        = AppDataSource.getRepository(Bid);
  const contractRepo   = AppDataSource.getRepository(Contract);
  const msRepo         = AppDataSource.getRepository(Milestone);
  const msSubRepo      = AppDataSource.getRepository(MilestoneSubmission);
  const payRepo        = AppDataSource.getRepository(Payment);
  const reviewRepo     = AppDataSource.getRepository(Review);
  const disputeRepo    = AppDataSource.getRepository(Dispute);
  const dispMsgRepo    = AppDataSource.getRepository(DisputeMessage);
  const invoiceRepo    = AppDataSource.getRepository(Invoice);
  const invItemRepo    = AppDataSource.getRepository(InvoiceItem);
  const notifRepo      = AppDataSource.getRepository(Notification);
  const portfolioRepo  = AppDataSource.getRepository(Portfolio);

  // ══════════════════════════════════════════════════════════════════════════
  // 1. CATEGORIES
  // ══════════════════════════════════════════════════════════════════════════
  const catData = [
    { name: 'Web Development',        slug: 'web-development',       icon: 'code',          sortOrder: 1 },
    { name: 'Mobile Development',     slug: 'mobile-development',    icon: 'smartphone',    sortOrder: 2 },
    { name: 'Design & Creative',      slug: 'design-creative',       icon: 'palette',       sortOrder: 3 },
    { name: 'Writing & Content',      slug: 'writing-content',       icon: 'pen',           sortOrder: 4 },
    { name: 'Digital Marketing',      slug: 'digital-marketing',     icon: 'trending-up',   sortOrder: 5 },
    { name: 'Data Science & AI',      slug: 'data-science-ai',       icon: 'brain',         sortOrder: 6 },
    { name: 'DevOps & Cloud',         slug: 'devops-cloud',          icon: 'cloud',         sortOrder: 7 },
    { name: 'Blockchain & Web3',      slug: 'blockchain-web3',       icon: 'link',          sortOrder: 8 },
    { name: 'Video & Animation',      slug: 'video-animation',       icon: 'video',         sortOrder: 9 },
    { name: 'Cybersecurity',          slug: 'cybersecurity',         icon: 'shield',        sortOrder: 10 },
  ];
  const categories = await catRepo.save(catData.map(d => catRepo.create({
    ...d, description: `${d.name} projects and services`, isActive: true,
  })));
  const [catWeb, catMob, catDesign, catWrite, catMkt, catData2, catDevOps, catChain, catVideo, catSec] = categories;
  console.log(`✓ ${categories.length} categories`);

  // ══════════════════════════════════════════════════════════════════════════
  // 2. SKILLS
  // ══════════════════════════════════════════════════════════════════════════
  const skillDefs: { name: string; cat: Category }[] = [
    // Web
    { name: 'React.js',        cat: catWeb },
    { name: 'Next.js',         cat: catWeb },
    { name: 'Node.js',         cat: catWeb },
    { name: 'TypeScript',      cat: catWeb },
    { name: 'Vue.js',          cat: catWeb },
    { name: 'Angular',         cat: catWeb },
    { name: 'Laravel / PHP',   cat: catWeb },
    // Mobile
    { name: 'React Native',    cat: catMob },
    { name: 'Flutter',         cat: catMob },
    { name: 'Swift / iOS',     cat: catMob },
    { name: 'Kotlin / Android',cat: catMob },
    // Design
    { name: 'UI/UX Design',    cat: catDesign },
    { name: 'Figma',           cat: catDesign },
    { name: 'Adobe XD',        cat: catDesign },
    { name: 'Logo Design',     cat: catDesign },
    { name: 'Brand Identity',  cat: catDesign },
    { name: 'Illustration',    cat: catDesign },
    // Writing
    { name: 'Content Writing', cat: catWrite },
    { name: 'Copywriting',     cat: catWrite },
    { name: 'Technical Writing', cat: catWrite },
    { name: 'SEO Writing',     cat: catWrite },
    // Marketing
    { name: 'SEO',             cat: catMkt },
    { name: 'Google Ads',      cat: catMkt },
    { name: 'Social Media Marketing', cat: catMkt },
    { name: 'Email Marketing', cat: catMkt },
    // Data / AI
    { name: 'Python',          cat: catData2 },
    { name: 'Machine Learning', cat: catData2 },
    { name: 'TensorFlow',      cat: catData2 },
    { name: 'Data Analysis',   cat: catData2 },
    { name: 'SQL',             cat: catData2 },
    // DevOps
    { name: 'Docker',          cat: catDevOps },
    { name: 'Kubernetes',      cat: catDevOps },
    { name: 'AWS',             cat: catDevOps },
    { name: 'CI/CD',           cat: catDevOps },
    { name: 'Terraform',       cat: catDevOps },
    // Blockchain
    { name: 'Solidity',        cat: catChain },
    { name: 'Smart Contracts', cat: catChain },
    { name: 'NFT Development', cat: catChain },
    { name: 'DeFi',            cat: catChain },
    // Video
    { name: 'Video Editing',   cat: catVideo },
    { name: 'After Effects',   cat: catVideo },
    { name: 'Motion Graphics', cat: catVideo },
    { name: '3D Modeling',     cat: catVideo },
    // Security
    { name: 'Penetration Testing', cat: catSec },
    { name: 'Network Security', cat: catSec },
    { name: 'Ethical Hacking', cat: catSec },
    { name: 'OWASP',           cat: catSec },
  ];
  const skills = await skillRepo.save(skillDefs.map(d =>
    skillRepo.create({ name: d.name, category: d.cat, categoryId: d.cat.id, isActive: true, usageCount: Math.floor(Math.random() * 200) + 10 })
  ));
  const byName = (n: string) => skills.find(s => s.name === n)!;
  console.log(`✓ ${skills.length} skills`);

  // ══════════════════════════════════════════════════════════════════════════
  // 3. USERS
  // ══════════════════════════════════════════════════════════════════════════
  const hashR = await bcrypt.hash(PASS_REGULAR, 10);
  const hashD = await bcrypt.hash(PASS_DEMO, 10);

  const makeUser = (data: Partial<User> & { email: string; firstName: string; lastName: string; role: UserRole; isDemo?: boolean; hash?: string }) => {
    const h = data.hash ?? hashR;
    return userRepo.create({
      email: data.email,
      password: h,
      firstName: data.firstName,
      lastName: data.lastName,
      username: data.email.split('@')[0].replace(/\./g, '_'),
      role: data.role,
      status: UserStatus.ACTIVE,
      provider: AuthProvider.LOCAL,
      isEmailVerified: true,
      isDemo: data.isDemo ?? false,
      isFeatured: data.isFeatured ?? false,
      country: data.country ?? 'United States',
      timezone: 'America/New_York',
      walletBalance: data.walletBalance ?? 0,
      escrowBalance: data.escrowBalance ?? 0,
      averageRating: data.averageRating ?? 0,
      totalReviews: data.totalReviews ?? 0,
      bio: data.bio ?? null,
      loginCount: Math.floor(Math.random() * 200) + 5,
      lastLoginAt: daysAgo(Math.floor(Math.random() * 3)),
    });
  };

  // Admin
  const admin = await userRepo.save(makeUser({
    email: 'admin@nexus.dev', firstName: 'System', lastName: 'Admin',
    role: UserRole.ADMIN, isFeatured: false,
    walletBalance: 12450, bio: 'Platform administrator',
  }));

  // Clients
  const [cl1, cl2, cl3, cl4, cl5] = await userRepo.save([
    makeUser({ email: 'alice.johnson@email.com', firstName: 'Alice', lastName: 'Johnson', role: UserRole.CLIENT, walletBalance: 8500, escrowBalance: 2200, totalReviews: 14, averageRating: 4.8, bio: 'Product manager at a SaaS startup. Love working with talented freelancers.' }),
    makeUser({ email: 'bob.smith@email.com', firstName: 'Bob', lastName: 'Smith', role: UserRole.CLIENT, walletBalance: 15200, escrowBalance: 4500, totalReviews: 22, averageRating: 4.6, bio: 'CTO at TechVentures. Outsource development projects regularly.', country: 'United Kingdom' }),
    makeUser({ email: 'carol.white@email.com', firstName: 'Carol', lastName: 'White', role: UserRole.CLIENT, walletBalance: 3800, escrowBalance: 0, totalReviews: 8, averageRating: 4.9, bio: 'E-commerce entrepreneur looking for design and marketing talent.' }),
    makeUser({ email: 'david.brown@email.com', firstName: 'David', lastName: 'Brown', role: UserRole.CLIENT, walletBalance: 6100, escrowBalance: 1800, totalReviews: 5, averageRating: 4.5, bio: 'Founder of a fintech startup.', country: 'Canada' }),
    makeUser({ email: 'eve.davis@email.com', firstName: 'Eve', lastName: 'Davis', role: UserRole.CLIENT, walletBalance: 22000, escrowBalance: 7800, totalReviews: 31, averageRating: 4.7, bio: 'Marketing director. Hire freelancers for campaigns and content.', isFeatured: true }),
  ]);

  // Freelancers
  const [fr1, fr2, fr3, fr4, fr5, fr6, fr7, fr8] = await userRepo.save([
    makeUser({ email: 'frank.miller@email.com', firstName: 'Frank', lastName: 'Miller', role: UserRole.FREELANCER, walletBalance: 18400, totalReviews: 47, averageRating: 4.95, bio: 'Full-stack engineer with 8 years of experience. React + Node.js specialist.', isFeatured: true }),
    makeUser({ email: 'grace.wilson@email.com', firstName: 'Grace', lastName: 'Wilson', role: UserRole.FREELANCER, walletBalance: 9200, totalReviews: 29, averageRating: 4.8, bio: 'Senior UI/UX designer. Figma expert, design systems specialist.', country: 'Australia' }),
    makeUser({ email: 'henry.moore@email.com', firstName: 'Henry', lastName: 'Moore', role: UserRole.FREELANCER, walletBalance: 24100, totalReviews: 63, averageRating: 4.9, bio: 'Mobile architect — React Native & Flutter. 10+ shipped apps.', isFeatured: true }),
    makeUser({ email: 'isabel.taylor@email.com', firstName: 'Isabel', lastName: 'Taylor', role: UserRole.FREELANCER, walletBalance: 5600, totalReviews: 18, averageRating: 4.7, bio: 'Content strategist and technical writer. SaaS and fintech focus.', country: 'Ireland' }),
    makeUser({ email: 'james.anderson@email.com', firstName: 'James', lastName: 'Anderson', role: UserRole.FREELANCER, walletBalance: 31000, totalReviews: 55, averageRating: 4.85, bio: 'Data scientist & ML engineer. Python, TensorFlow, LLM fine-tuning.' }),
    makeUser({ email: 'kate.thomas@email.com', firstName: 'Kate', lastName: 'Thomas', role: UserRole.FREELANCER, walletBalance: 14700, totalReviews: 38, averageRating: 4.92, bio: 'DevOps & cloud architect. AWS certified, Kubernetes expert.', country: 'Germany' }),
    makeUser({ email: 'liam.jackson@email.com', firstName: 'Liam', lastName: 'Jackson', role: UserRole.FREELANCER, walletBalance: 7300, totalReviews: 12, averageRating: 4.6, bio: 'Blockchain developer. Solidity, DeFi protocols, NFT platforms.', country: 'Singapore' }),
    makeUser({ email: 'mia.martin@email.com', firstName: 'Mia', lastName: 'Martin', role: UserRole.FREELANCER, walletBalance: 3200, totalReviews: 7, averageRating: 4.4, bio: 'Digital marketing specialist. SEO, Google Ads, content strategy.', country: 'France' }),
  ]);

  // Agency owners
  const [ao1, ao2] = await userRepo.save([
    makeUser({ email: 'noah.lee@email.com', firstName: 'Noah', lastName: 'Lee', role: UserRole.AGENCY_OWNER, walletBalance: 45000, totalReviews: 82, averageRating: 4.88, bio: 'Founder of TechForge Solutions. 50+ team, full-stack everything.', isFeatured: true }),
    makeUser({ email: 'olivia.harris@email.com', firstName: 'Olivia', lastName: 'Harris', role: UserRole.AGENCY_OWNER, walletBalance: 28000, totalReviews: 44, averageRating: 4.75, bio: 'Creative director at PixelCraft Studio.', country: 'Netherlands' }),
  ]);

  // Demo users
  const [demoClient, demoFreelancer, demoAgency, demoAdmin] = await userRepo.save([
    makeUser({ email: 'demo.client@nexus.dev', firstName: 'Demo', lastName: 'Client', role: UserRole.CLIENT, hash: hashD, isDemo: true, walletBalance: 5000, escrowBalance: 1500, totalReviews: 3, averageRating: 4.7, bio: '🔍 Demo account — read only. Password: Demo@1234' }),
    makeUser({ email: 'demo.freelancer@nexus.dev', firstName: 'Demo', lastName: 'Freelancer', role: UserRole.FREELANCER, hash: hashD, isDemo: true, walletBalance: 3200, totalReviews: 8, averageRating: 4.5, bio: '🔍 Demo account — read only. Password: Demo@1234' }),
    makeUser({ email: 'demo.agency@nexus.dev', firstName: 'Demo', lastName: 'Agency', role: UserRole.AGENCY_OWNER, hash: hashD, isDemo: true, walletBalance: 12000, totalReviews: 15, averageRating: 4.6, bio: '🔍 Demo account — read only. Password: Demo@1234' }),
    makeUser({ email: 'demo.admin@nexus.dev', firstName: 'Demo', lastName: 'Admin', role: UserRole.ADMIN, hash: hashD, isDemo: true, walletBalance: 0, bio: '🔍 Demo account — read only. Password: Demo@1234' }),
  ]);

  console.log(`✓ ${await userRepo.count()} users`);

  // ══════════════════════════════════════════════════════════════════════════
  // 4. CLIENT PROFILES
  // ══════════════════════════════════════════════════════════════════════════
  await cpRepo.save([
    cpRepo.create({ userId: cl1.id, clientType: ClientType.INDIVIDUAL, industry: 'Software', isVerified: true, isPaymentVerified: true, totalProjectsPosted: 18, totalProjectsCompleted: 14, totalSpent: 62400, hireRate: 78 }),
    cpRepo.create({ userId: cl2.id, clientType: ClientType.COMPANY, companyName: 'TechVentures Ltd', companySize: '11-50', industry: 'Technology', website: 'https://techventures.io', isVerified: true, isPaymentVerified: true, totalProjectsPosted: 35, totalProjectsCompleted: 30, totalSpent: 185000, hireRate: 86 }),
    cpRepo.create({ userId: cl3.id, clientType: ClientType.INDIVIDUAL, industry: 'E-commerce', isVerified: true, isPaymentVerified: true, totalProjectsPosted: 11, totalProjectsCompleted: 8, totalSpent: 28900, hireRate: 73 }),
    cpRepo.create({ userId: cl4.id, clientType: ClientType.COMPANY, companyName: 'FinTech Pulse', companySize: '1-10', industry: 'Finance', isVerified: false, isPaymentVerified: true, totalProjectsPosted: 6, totalProjectsCompleted: 4, totalSpent: 19500, hireRate: 67 }),
    cpRepo.create({ userId: cl5.id, clientType: ClientType.AGENCY, companyName: 'GrowthLab Agency', companySize: '11-50', industry: 'Marketing', website: 'https://growthlab.co', isVerified: true, isPaymentVerified: true, totalProjectsPosted: 48, totalProjectsCompleted: 43, totalSpent: 312000, hireRate: 90 }),
    cpRepo.create({ userId: demoClient.id, clientType: ClientType.INDIVIDUAL, industry: 'Technology', isVerified: true, isPaymentVerified: true, totalProjectsPosted: 5, totalProjectsCompleted: 3, totalSpent: 12500, hireRate: 60 }),
  ]);
  console.log('✓ Client profiles');

  // ══════════════════════════════════════════════════════════════════════════
  // 5. FREELANCER PROFILES  (with skills)
  // ══════════════════════════════════════════════════════════════════════════
  const fp1 = await fpRepo.save(fpRepo.create({ userId: fr1.id, title: 'Full-Stack Engineer (React / Node)', overview: 'I build scalable web apps from pixel to deployment. 8 years in production codebases.', experienceLevel: ExperienceLevel.EXPERT, hourlyRate: 95, currency: 'USD', availability: AvailabilityStatus.PARTIALLY_AVAILABLE, hoursPerWeek: 20, totalJobsCompleted: 47, totalEarned: 184000, successRate: 98, isVerified: true, isTopRated: true, languages: 'English, Spanish' }));
  fp1.skills = [byName('React.js'), byName('Next.js'), byName('Node.js'), byName('TypeScript'), byName('SQL')];
  await fpRepo.save(fp1);

  const fp2 = await fpRepo.save(fpRepo.create({ userId: fr2.id, title: 'Senior UI/UX Designer', overview: 'I craft delightful interfaces. From wireframes to design systems, I cover the full design lifecycle.', experienceLevel: ExperienceLevel.EXPERT, hourlyRate: 75, currency: 'USD', availability: AvailabilityStatus.AVAILABLE, hoursPerWeek: 40, totalJobsCompleted: 29, totalEarned: 92000, successRate: 96, isVerified: true, isTopRated: false, isRising: false, languages: 'English' }));
  fp2.skills = [byName('UI/UX Design'), byName('Figma'), byName('Adobe XD'), byName('Brand Identity')];
  await fpRepo.save(fp2);

  const fp3 = await fpRepo.save(fpRepo.create({ userId: fr3.id, title: 'Mobile App Architect', overview: '10+ shipped apps on App Store & Play Store. React Native + Flutter dual expertise.', experienceLevel: ExperienceLevel.EXPERT, hourlyRate: 110, currency: 'USD', availability: AvailabilityStatus.PARTIALLY_AVAILABLE, hoursPerWeek: 25, totalJobsCompleted: 63, totalEarned: 241000, successRate: 99, isVerified: true, isTopRated: true, languages: 'English' }));
  fp3.skills = [byName('React Native'), byName('Flutter'), byName('TypeScript'), byName('Swift / iOS')];
  await fpRepo.save(fp3);

  const fp4 = await fpRepo.save(fpRepo.create({ userId: fr4.id, title: 'Technical Writer & Content Strategist', overview: 'Clear, concise docs for SaaS products. API references, user guides, blog content.', experienceLevel: ExperienceLevel.INTERMEDIATE, hourlyRate: 45, currency: 'USD', availability: AvailabilityStatus.AVAILABLE, hoursPerWeek: 35, totalJobsCompleted: 18, totalEarned: 36000, successRate: 94, isVerified: true, languages: 'English, French' }));
  fp4.skills = [byName('Technical Writing'), byName('Content Writing'), byName('Copywriting'), byName('SEO Writing')];
  await fpRepo.save(fp4);

  const fp5 = await fpRepo.save(fpRepo.create({ userId: fr5.id, title: 'Data Scientist & ML Engineer', overview: 'Turn raw data into business decisions. LLM fine-tuning, predictive models, dashboards.', experienceLevel: ExperienceLevel.EXPERT, hourlyRate: 130, currency: 'USD', availability: AvailabilityStatus.NOT_AVAILABLE, hoursPerWeek: 0, totalJobsCompleted: 55, totalEarned: 310000, successRate: 97, isVerified: true, isTopRated: true, languages: 'English' }));
  fp5.skills = [byName('Python'), byName('Machine Learning'), byName('TensorFlow'), byName('Data Analysis'), byName('SQL')];
  await fpRepo.save(fp5);

  const fp6 = await fpRepo.save(fpRepo.create({ userId: fr6.id, title: 'DevOps & Cloud Architect', overview: 'AWS certified. I automate infra, set up CI/CD, and keep systems reliable at scale.', experienceLevel: ExperienceLevel.EXPERT, hourlyRate: 105, currency: 'USD', availability: AvailabilityStatus.AVAILABLE, hoursPerWeek: 40, totalJobsCompleted: 38, totalEarned: 147000, successRate: 98, isVerified: true, isTopRated: true, languages: 'English, German' }));
  fp6.skills = [byName('Docker'), byName('Kubernetes'), byName('AWS'), byName('CI/CD'), byName('Terraform')];
  await fpRepo.save(fp6);

  const fp7 = await fpRepo.save(fpRepo.create({ userId: fr7.id, title: 'Blockchain Developer', overview: 'DeFi protocols, NFT platforms, smart contract audits. Ethereum & EVM chains.', experienceLevel: ExperienceLevel.INTERMEDIATE, hourlyRate: 85, currency: 'USD', availability: AvailabilityStatus.AVAILABLE, hoursPerWeek: 40, totalJobsCompleted: 12, totalEarned: 73000, successRate: 92, isVerified: false, languages: 'English, Chinese' }));
  fp7.skills = [byName('Solidity'), byName('Smart Contracts'), byName('NFT Development'), byName('DeFi')];
  await fpRepo.save(fp7);

  const fp8 = await fpRepo.save(fpRepo.create({ userId: fr8.id, title: 'Digital Marketing Specialist', overview: 'SEO, Google Ads, and social campaigns that actually convert. 3 years in performance marketing.', experienceLevel: ExperienceLevel.ENTRY, hourlyRate: 35, currency: 'USD', availability: AvailabilityStatus.AVAILABLE, hoursPerWeek: 40, totalJobsCompleted: 7, totalEarned: 14000, successRate: 86, isVerified: false, isRising: true, languages: 'English, French' }));
  fp8.skills = [byName('SEO'), byName('Google Ads'), byName('Social Media Marketing'), byName('Email Marketing')];
  await fpRepo.save(fp8);

  // Demo freelancer profile
  const fpDemo = await fpRepo.save(fpRepo.create({ userId: demoFreelancer.id, title: 'Full-Stack Developer (Demo)', overview: 'Demo account for exploring the platform. Read-only access.', experienceLevel: ExperienceLevel.INTERMEDIATE, hourlyRate: 65, currency: 'USD', availability: AvailabilityStatus.AVAILABLE, hoursPerWeek: 40, totalJobsCompleted: 8, totalEarned: 24000, successRate: 88, isVerified: true }));
  fpDemo.skills = [byName('React.js'), byName('Node.js'), byName('TypeScript')];
  await fpRepo.save(fpDemo);

  console.log('✓ Freelancer profiles');

  // ══════════════════════════════════════════════════════════════════════════
  // 6. AGENCIES
  // ══════════════════════════════════════════════════════════════════════════
  const ag1 = await agencyRepo.save(agencyRepo.create({
    name: 'TechForge Solutions', slug: 'techforge-solutions',
    description: 'End-to-end software development agency. Web, mobile, cloud, and AI.', tagline: 'We engineer your vision.',
    website: 'https://techforge.io', country: 'United States', city: 'San Francisco',
    size: AgencySize.MEDIUM, status: AgencyStatus.ACTIVE,
    foundedYear: 2018, isVerified: true, isFeatured: true,
    minimumProjectSize: 5000, hourlyRate: 90,
    averageRating: 4.88, totalReviews: 82, totalProjectsCompleted: 127, totalEarned: 1850000, successRate: 96,
    ownerId: ao1.id,
    socialLinks: { linkedin: 'https://linkedin.com/company/techforge', twitter: 'https://twitter.com/techforge' },
  }));

  const ag2 = await agencyRepo.save(agencyRepo.create({
    name: 'PixelCraft Studio', slug: 'pixelcraft-studio',
    description: 'Award-winning creative agency specialising in UI/UX and branding.', tagline: 'Design that tells your story.',
    website: 'https://pixelcraft.studio', country: 'Netherlands', city: 'Amsterdam',
    size: AgencySize.SMALL, status: AgencyStatus.ACTIVE,
    foundedYear: 2020, isVerified: true, isFeatured: false,
    minimumProjectSize: 2000, hourlyRate: 75,
    averageRating: 4.75, totalReviews: 44, totalProjectsCompleted: 68, totalEarned: 720000, successRate: 93,
    ownerId: ao2.id,
  }));

  // Demo agency
  const agDemo = await agencyRepo.save(agencyRepo.create({
    name: 'Demo Agency', slug: 'demo-agency',
    description: 'Demo account for exploring agency features.', tagline: 'Read-only demo.',
    country: 'United States', size: AgencySize.SMALL, status: AgencyStatus.ACTIVE,
    foundedYear: 2022, isVerified: true,
    minimumProjectSize: 1000, hourlyRate: 60,
    averageRating: 4.6, totalReviews: 15, totalProjectsCompleted: 20, totalEarned: 180000, successRate: 90,
    ownerId: demoAgency.id,
  }));

  console.log('✓ Agencies');

  // ── Agency profiles (owner <-> agency link)
  await agProRepo.save([
    agProRepo.create({ userId: ao1.id, agencyId: ag1.id, specializations: ['Web Development', 'Mobile Apps', 'Cloud', 'AI/ML'], awards: [{ name: 'Best Dev Agency 2023', year: 2023, issuer: 'TechAwards' }] }),
    agProRepo.create({ userId: ao2.id, agencyId: ag2.id, specializations: ['UI/UX Design', 'Branding', 'Motion Graphics'] }),
    agProRepo.create({ userId: demoAgency.id, agencyId: agDemo.id, specializations: ['Web Development', 'Design'] }),
  ]);

  // Freelancer → agency membership
  const fpAo1 = await fpRepo.save(fpRepo.create({ userId: ao1.id, title: 'Agency Owner & Lead Architect', overview: 'Founder of TechForge Solutions.', experienceLevel: ExperienceLevel.EXPERT, hourlyRate: 90, currency: 'USD', availability: AvailabilityStatus.PARTIALLY_AVAILABLE, hoursPerWeek: 20, totalJobsCompleted: 127, totalEarned: 480000, successRate: 96, isVerified: true, isTopRated: true, agencyId: ag1.id }));
  fpAo1.skills = [byName('React.js'), byName('Node.js'), byName('AWS'), byName('Docker')];
  await fpRepo.save(fpAo1);

  const fpAo2 = await fpRepo.save(fpRepo.create({ userId: ao2.id, title: 'Creative Director', overview: 'Head of PixelCraft Studio.', experienceLevel: ExperienceLevel.EXPERT, hourlyRate: 75, currency: 'USD', availability: AvailabilityStatus.PARTIALLY_AVAILABLE, hoursPerWeek: 20, totalJobsCompleted: 68, totalEarned: 280000, successRate: 93, isVerified: true, agencyId: ag2.id }));
  fpAo2.skills = [byName('UI/UX Design'), byName('Figma'), byName('Brand Identity')];
  await fpRepo.save(fpAo2);

  // fr1 → ag1 member
  fp1.agencyId = ag1.id;
  await fpRepo.save(fp1);

  await agMemRepo.save([
    agMemRepo.create({ agencyId: ag1.id, userId: ao1.id, role: AgencyMemberRole.OWNER, status: AgencyMemberStatus.ACTIVE, title: 'Founder & CTO', revenueShare: 0, joinedAt: daysAgo(1800) }),
    agMemRepo.create({ agencyId: ag1.id, userId: fr1.id, role: AgencyMemberRole.MEMBER, status: AgencyMemberStatus.ACTIVE, title: 'Senior Full-Stack Dev', revenueShare: 70, joinedAt: daysAgo(900) }),
    agMemRepo.create({ agencyId: ag2.id, userId: ao2.id, role: AgencyMemberRole.OWNER, status: AgencyMemberStatus.ACTIVE, title: 'Creative Director', revenueShare: 0, joinedAt: daysAgo(1400) }),
    agMemRepo.create({ agencyId: ag2.id, userId: fr2.id, role: AgencyMemberRole.MEMBER, status: AgencyMemberStatus.ACTIVE, title: 'Lead Designer', revenueShare: 70, joinedAt: daysAgo(500) }),
    agMemRepo.create({ agencyId: agDemo.id, userId: demoAgency.id, role: AgencyMemberRole.OWNER, status: AgencyMemberStatus.ACTIVE, title: 'Owner', revenueShare: 0, joinedAt: daysAgo(365) }),
  ]);
  console.log('✓ Agencies & members');

  // ══════════════════════════════════════════════════════════════════════════
  // 7. PORTFOLIOS
  // ══════════════════════════════════════════════════════════════════════════
  await portfolioRepo.save([
    portfolioRepo.create({ freelancerProfileId: fp1.id, title: 'E-commerce Platform Rebuild', description: 'Migrated a legacy PHP shop to Next.js + NestJS. 3× faster load times.', projectUrl: 'https://demo.store', imageUrl: 'https://picsum.photos/seed/p1/800/500', tags: ['Next.js', 'NestJS', 'PostgreSQL'], completedAt: daysAgo(120) } as any),
    portfolioRepo.create({ freelancerProfileId: fp1.id, title: 'Real-time Collaboration Tool', description: 'Notion-like editor with CRDT, WebSocket sync, and end-to-end encryption.', imageUrl: 'https://picsum.photos/seed/p2/800/500', tags: ['React', 'Socket.io', 'TypeScript'], completedAt: daysAgo(60) } as any),
    portfolioRepo.create({ freelancerProfileId: fp2.id, title: 'FinTech App Redesign', description: 'Complete UX overhaul for a mobile banking app. 40% increase in NPS.', imageUrl: 'https://picsum.photos/seed/p3/800/500', tags: ['Figma', 'UI/UX', 'Mobile'], completedAt: daysAgo(90) } as any),
    portfolioRepo.create({ freelancerProfileId: fp3.id, title: 'Health Tracker App', description: 'Cross-platform Flutter app on iOS & Android with HealthKit / Google Fit integration.', projectUrl: 'https://healthtrack.app', imageUrl: 'https://picsum.photos/seed/p4/800/500', tags: ['Flutter', 'Dart', 'Firebase'], completedAt: daysAgo(200) } as any),
    portfolioRepo.create({ freelancerProfileId: fp5.id, title: 'Churn Prediction Model', description: 'XGBoost model reducing churn by 22% for a B2B SaaS with 50k users.', imageUrl: 'https://picsum.photos/seed/p5/800/500', tags: ['Python', 'XGBoost', 'Pandas'], completedAt: daysAgo(150) } as any),
    portfolioRepo.create({ freelancerProfileId: fp6.id, title: 'Zero-Downtime Migration', description: 'Moved a monolith to microservices on EKS with zero customer-facing downtime.', imageUrl: 'https://picsum.photos/seed/p6/800/500', tags: ['AWS', 'Kubernetes', 'Terraform'], completedAt: daysAgo(75) } as any),
  ]);
  console.log('✓ Portfolios');

  // ══════════════════════════════════════════════════════════════════════════
  // 8. PROJECTS  (all statuses)
  // ══════════════════════════════════════════════════════════════════════════
  const makeProject = (data: Partial<Project>) => projRepo.create({
    visibility: ProjectVisibility.PUBLIC,
    currency: 'USD',
    allowAgencyBids: true,
    bidsCount: 0,
    viewsCount: Math.floor(Math.random() * 500) + 50,
    isFeatured: false,
    isUrgent: false,
    ...data,
  });

  // DRAFT (2)
  const [p_draft1, p_draft2] = await projRepo.save([
    makeProject({ title: 'AI-Powered Customer Support Chatbot', description: 'Build an LLM-based chatbot integrated with Zendesk and Slack. Must handle ticket routing, escalation, and CSAT collection.', status: ProjectStatus.DRAFT, type: ProjectType.FIXED, budgetMin: 8000, budgetMax: 12000, categoryId: catData2.id, clientId: cl4.id, experienceRequired: ExperienceRequired.EXPERT, duration: ProjectDuration.THREE_TO_SIX_MONTHS, requirements: ['LLM integration', 'Zendesk API', 'Slack webhooks'], createdAt: daysAgo(2) }),
    makeProject({ title: 'Brand Identity Package', description: 'Logo, color palette, typography, business cards, and brand guidelines for a wellness startup.', status: ProjectStatus.DRAFT, type: ProjectType.FIXED, budgetMin: 1500, budgetMax: 2500, categoryId: catDesign.id, clientId: cl3.id, experienceRequired: ExperienceRequired.INTERMEDIATE, duration: ProjectDuration.LESS_THAN_1_MONTH, createdAt: daysAgo(1) }),
  ]);

  // OPEN (7)
  const [p_open1, p_open2, p_open3, p_open4, p_open5, p_open6, p_open7] = await projRepo.save([
    makeProject({ title: 'Full-Stack SaaS Dashboard', description: 'Analytics dashboard with real-time charts, role-based access, and Stripe billing. React + Node.js + PostgreSQL preferred.', status: ProjectStatus.OPEN, type: ProjectType.FIXED, budgetMin: 6000, budgetMax: 10000, categoryId: catWeb.id, clientId: cl1.id, bidsCount: 8, experienceRequired: ExperienceRequired.EXPERT, duration: ProjectDuration.ONE_TO_THREE_MONTHS, deadline: daysAhead(60), isFeatured: true, requirements: ['React 18', 'REST API', 'Stripe', 'Auth'], createdAt: daysAgo(5) }),
    makeProject({ title: 'React Native Fitness App', description: 'Cross-platform app with workout plans, progress tracking, nutrition logger, and Apple Health integration.', status: ProjectStatus.OPEN, type: ProjectType.FIXED, budgetMin: 12000, budgetMax: 20000, categoryId: catMob.id, clientId: cl2.id, bidsCount: 12, experienceRequired: ExperienceRequired.EXPERT, duration: ProjectDuration.THREE_TO_SIX_MONTHS, deadline: daysAhead(90), isFeatured: true, isUrgent: false, createdAt: daysAgo(8) }),
    makeProject({ title: 'SEO Audit & 3-Month Growth Plan', description: 'Comprehensive technical SEO audit, competitor analysis, keyword research, and a 90-day content roadmap.', status: ProjectStatus.OPEN, type: ProjectType.FIXED, budgetMin: 1800, budgetMax: 3000, categoryId: catMkt.id, clientId: cl3.id, bidsCount: 5, experienceRequired: ExperienceRequired.INTERMEDIATE, duration: ProjectDuration.ONE_TO_THREE_MONTHS, createdAt: daysAgo(3) }),
    makeProject({ title: 'Kubernetes Cluster Setup on AWS EKS', description: 'Set up production-grade EKS with Terraform, ArgoCD, Prometheus/Grafana monitoring, and automated backups.', status: ProjectStatus.OPEN, type: ProjectType.HOURLY, hourlyRateMin: 80, hourlyRateMax: 120, categoryId: catDevOps.id, clientId: cl2.id, bidsCount: 4, experienceRequired: ExperienceRequired.EXPERT, duration: ProjectDuration.ONE_TO_THREE_MONTHS, isUrgent: true, createdAt: daysAgo(6) }),
    makeProject({ title: 'NFT Marketplace Smart Contracts', description: 'ERC-721 & ERC-1155 contracts, marketplace with royalties, auction support, and OpenSea compatibility. Audit included.', status: ProjectStatus.OPEN, type: ProjectType.FIXED, budgetMin: 9000, budgetMax: 15000, categoryId: catChain.id, clientId: cl4.id, bidsCount: 6, experienceRequired: ExperienceRequired.EXPERT, duration: ProjectDuration.ONE_TO_THREE_MONTHS, createdAt: daysAgo(4) }),
    makeProject({ title: 'Product Documentation Rewrite', description: '40-page developer docs and user guide rewrite for a B2B SaaS. Must use Docusaurus with versioning.', status: ProjectStatus.OPEN, type: ProjectType.FIXED, budgetMin: 2000, budgetMax: 3500, categoryId: catWrite.id, clientId: cl5.id, bidsCount: 9, experienceRequired: ExperienceRequired.INTERMEDIATE, duration: ProjectDuration.LESS_THAN_1_MONTH, deadline: daysAhead(30), createdAt: daysAgo(7) }),
    makeProject({ title: 'E-commerce Product Video Ads (5 videos)', description: '15–30 second product showcase videos for social media. Must deliver in 4:5, 9:16, and 16:9 formats.', status: ProjectStatus.OPEN, type: ProjectType.FIXED, budgetMin: 3000, budgetMax: 5000, categoryId: catVideo.id, clientId: cl5.id, bidsCount: 14, experienceRequired: ExperienceRequired.INTERMEDIATE, duration: ProjectDuration.LESS_THAN_1_MONTH, deadline: daysAhead(21), createdAt: daysAgo(9) }),
  ]);

  // IN_REVIEW (2)
  const [p_rev1, p_rev2] = await projRepo.save([
    makeProject({ title: 'Data Pipeline for BI Tool', description: 'Airflow DAGs, dbt transformations, and Redshift data warehouse for a BI dashboard.', status: ProjectStatus.IN_REVIEW, type: ProjectType.FIXED, budgetMin: 7000, budgetMax: 11000, categoryId: catData2.id, clientId: cl2.id, bidsCount: 7, experienceRequired: ExperienceRequired.EXPERT, createdAt: daysAgo(20) }),
    makeProject({ title: 'Landing Page Redesign (5 variants for A/B test)', description: 'High-conversion landing page redesign with 5 A/B variants. Figma deliverable + HTML/CSS handoff.', status: ProjectStatus.IN_REVIEW, type: ProjectType.FIXED, budgetMin: 2500, budgetMax: 4000, categoryId: catDesign.id, clientId: cl1.id, bidsCount: 11, experienceRequired: ExperienceRequired.INTERMEDIATE, createdAt: daysAgo(18) }),
  ]);

  // IN_PROGRESS (5)
  const [p_prog1, p_prog2, p_prog3, p_prog4, p_prog5] = await projRepo.save([
    makeProject({ title: 'CRM Integration with Salesforce', description: 'Bidirectional sync between our internal DB and Salesforce using REST + Bulk API.', status: ProjectStatus.IN_PROGRESS, type: ProjectType.HOURLY, hourlyRateMin: 90, hourlyRateMax: 120, categoryId: catWeb.id, clientId: cl2.id, selectedFreelancerId: fr1.id, bidsCount: 6, experienceRequired: ExperienceRequired.EXPERT, createdAt: daysAgo(45), startDate: daysAgo(35) }),
    makeProject({ title: 'Mobile Banking App (Phase 2)', description: 'Adding investment portfolio, crypto wallet, and P2P payments to an existing mobile banking app.', status: ProjectStatus.IN_PROGRESS, type: ProjectType.FIXED, budgetMin: 25000, budgetMax: 35000, categoryId: catMob.id, clientId: cl2.id, selectedFreelancerId: fr3.id, bidsCount: 5, experienceRequired: ExperienceRequired.EXPERT, createdAt: daysAgo(60), startDate: daysAgo(50) }),
    makeProject({ title: 'ML-Driven Recommendation Engine', description: 'Collaborative filtering + content-based hybrid recommender for an e-commerce platform. Python API.', status: ProjectStatus.IN_PROGRESS, type: ProjectType.FIXED, budgetMin: 14000, budgetMax: 22000, categoryId: catData2.id, clientId: cl5.id, selectedFreelancerId: fr5.id, bidsCount: 4, experienceRequired: ExperienceRequired.EXPERT, createdAt: daysAgo(40), startDate: daysAgo(32) }),
    makeProject({ title: 'Multi-Region AWS Infrastructure', description: 'Multi-AZ, multi-region setup with Route53 failover, RDS Aurora, and full IaC.', status: ProjectStatus.IN_PROGRESS, type: ProjectType.FIXED, budgetMin: 18000, budgetMax: 25000, categoryId: catDevOps.id, clientId: cl2.id, selectedFreelancerId: fr6.id, bidsCount: 3, experienceRequired: ExperienceRequired.EXPERT, createdAt: daysAgo(55), startDate: daysAgo(45) }),
    makeProject({ title: 'Brand Campaign Copy (Q1)', description: '12 ad copies, 4 email sequences, and homepage copy refresh for Q1 campaign.', status: ProjectStatus.IN_PROGRESS, type: ProjectType.FIXED, budgetMin: 3000, budgetMax: 4500, categoryId: catWrite.id, clientId: cl5.id, selectedFreelancerId: fr4.id, bidsCount: 8, experienceRequired: ExperienceRequired.INTERMEDIATE, createdAt: daysAgo(25), startDate: daysAgo(18) }),
  ]);

  // PAUSED (1)
  const p_paused = await projRepo.save(makeProject({ title: 'iOS App Store Optimisation & Screenshots', description: 'ASO audit, keyword optimisation, new screenshots and preview video for App Store.', status: ProjectStatus.PAUSED, type: ProjectType.FIXED, budgetMin: 1200, budgetMax: 2000, categoryId: catMob.id, clientId: cl3.id, selectedFreelancerId: fr3.id, bidsCount: 5, createdAt: daysAgo(50), startDate: daysAgo(40) }));

  // COMPLETED (5)
  const [p_done1, p_done2, p_done3, p_done4, p_done5] = await projRepo.save([
    makeProject({ title: 'Next.js Blog Platform with CMS', description: 'Headless CMS (Sanity) + Next.js blog with SSG, full-text search, newsletter integration.', status: ProjectStatus.COMPLETED, type: ProjectType.FIXED, budgetMin: 5000, budgetMax: 7000, categoryId: catWeb.id, clientId: cl1.id, selectedFreelancerId: fr1.id, bidsCount: 10, createdAt: daysAgo(180), startDate: daysAgo(160), closedAt: daysAgo(100) }),
    makeProject({ title: 'Design System (Figma + Storybook)', description: '80-component Figma library + React Storybook with tokens, dark mode, and accessibility audit.', status: ProjectStatus.COMPLETED, type: ProjectType.FIXED, budgetMin: 8000, budgetMax: 12000, categoryId: catDesign.id, clientId: cl2.id, selectedFreelancerId: fr2.id, bidsCount: 7, createdAt: daysAgo(200), startDate: daysAgo(180), closedAt: daysAgo(120) }),
    makeProject({ title: 'Flutter Cross-Platform App', description: 'Task management app with offline-first architecture, push notifications, and team collaboration.', status: ProjectStatus.COMPLETED, type: ProjectType.FIXED, budgetMin: 15000, budgetMax: 22000, categoryId: catMob.id, clientId: cl1.id, selectedFreelancerId: fr3.id, bidsCount: 9, createdAt: daysAgo(220), startDate: daysAgo(200), closedAt: daysAgo(130) }),
    makeProject({ title: 'Fraud Detection ML Model', description: 'Real-time transaction fraud detection using gradient boosting. 99.2% precision on test set.', status: ProjectStatus.COMPLETED, type: ProjectType.FIXED, budgetMin: 18000, budgetMax: 24000, categoryId: catData2.id, clientId: cl2.id, selectedFreelancerId: fr5.id, bidsCount: 4, createdAt: daysAgo(300), startDate: daysAgo(275), closedAt: daysAgo(200) }),
    makeProject({ title: 'Google Ads Account Restructure', description: 'Full account restructure, negative keyword cleanup, smart bidding setup. Reduced CPA by 34%.', status: ProjectStatus.COMPLETED, type: ProjectType.FIXED, budgetMin: 2000, budgetMax: 3000, categoryId: catMkt.id, clientId: cl5.id, selectedFreelancerId: fr8.id, bidsCount: 11, createdAt: daysAgo(150), startDate: daysAgo(140), closedAt: daysAgo(110) }),
  ]);

  // CANCELLED (2)
  const [p_canc1, p_canc2] = await projRepo.save([
    makeProject({ title: 'VR Product Showcase (WebXR)', description: 'WebXR-based 3D product viewer. Cancelled due to budget cuts.', status: ProjectStatus.CANCELLED, type: ProjectType.FIXED, budgetMin: 12000, budgetMax: 18000, categoryId: catVideo.id, clientId: cl4.id, bidsCount: 3, createdAt: daysAgo(90), closedAt: daysAgo(70) }),
    makeProject({ title: 'Chrome Extension — AI Writing Assistant', description: 'Cancelled after competitor launched similar product.', status: ProjectStatus.CANCELLED, type: ProjectType.FIXED, budgetMin: 4000, budgetMax: 6000, categoryId: catWeb.id, clientId: cl3.id, bidsCount: 7, createdAt: daysAgo(60), closedAt: daysAgo(45) }),
  ]);

  // CLOSED (2)
  const [p_closed1, p_closed2] = await projRepo.save([
    makeProject({ title: 'Security Penetration Test (Web App)', description: 'Black-box + grey-box pentest for a fintech web app. OWASP Top 10.', status: ProjectStatus.CLOSED, type: ProjectType.FIXED, budgetMin: 5000, budgetMax: 8000, categoryId: catSec.id, clientId: cl4.id, selectedFreelancerId: fr6.id, bidsCount: 5, createdAt: daysAgo(250), closedAt: daysAgo(180) }),
    makeProject({ title: 'Email Marketing Automation Setup', description: 'Klaviyo setup, welcome flows, abandoned cart, and post-purchase sequences.', status: ProjectStatus.CLOSED, type: ProjectType.FIXED, budgetMin: 1500, budgetMax: 2500, categoryId: catMkt.id, clientId: cl5.id, selectedFreelancerId: fr8.id, bidsCount: 8, createdAt: daysAgo(200), closedAt: daysAgo(140) }),
  ]);

  // Add skills to a few projects
  p_open1.skills = [byName('React.js'), byName('Node.js'), byName('TypeScript'), byName('SQL')];
  p_open2.skills = [byName('React Native'), byName('TypeScript'), byName('Swift / iOS')];
  p_open4.skills = [byName('Kubernetes'), byName('AWS'), byName('Terraform'), byName('CI/CD')];
  p_open5.skills = [byName('Solidity'), byName('Smart Contracts'), byName('DeFi')];
  p_done1.skills = [byName('Next.js'), byName('React.js'), byName('TypeScript')];
  await projRepo.save([p_open1, p_open2, p_open4, p_open5, p_done1]);

  console.log(`✓ ${await projRepo.count()} projects`);

  // ══════════════════════════════════════════════════════════════════════════
  // 9. BIDS  (all statuses, realistic distribution)
  // ══════════════════════════════════════════════════════════════════════════
  const saveBid = (data: Partial<Bid>) => bidRepo.save(bidRepo.create({
    bidType: BidType.FREELANCER, coverLetter: 'I have extensive experience in this area and would love to take on your project. My approach: understand requirements first, deliver iteratively, and communicate daily.', deliveryDays: 30, isActive: true, ...data,
  } as any));

  // Open project bids (mix of pending / shortlisted / rejected / withdrawn)
  const [bid_fr1_p1, bid_fr2_p1] = await Promise.all([
    saveBid({ projectId: p_open1.id, bidderId: fr1.id, amount: 8500, status: BidStatus.SHORTLISTED, deliveryDays: 45, coverLetter: 'React+Node is my daily stack. I have built 3 similar SaaS dashboards. Happy to share links.' }),
    saveBid({ projectId: p_open1.id, bidderId: fr7.id, amount: 7200, status: BidStatus.PENDING, deliveryDays: 50, coverLetter: 'I can deliver this on time. Here are my portfolio links.' }),
  ]);
  await Promise.all([
    saveBid({ projectId: p_open1.id, bidderId: ao1.id, agencyId: ag1.id, amount: 9800, status: BidStatus.SHORTLISTED, bidType: BidType.AGENCY, deliveryDays: 40, coverLetter: 'TechForge has built 20+ SaaS dashboards. We guarantee on-time delivery.' }),
    saveBid({ projectId: p_open1.id, bidderId: fr5.id, amount: 11000, status: BidStatus.REJECTED, deliveryDays: 35 }),
    saveBid({ projectId: p_open1.id, bidderId: fr8.id, amount: 6500, status: BidStatus.REJECTED, deliveryDays: 60 }),
  ]);

  const bid_fr3_p2 = await saveBid({ projectId: p_open2.id, bidderId: fr3.id, amount: 16000, status: BidStatus.SHORTLISTED, deliveryDays: 80, coverLetter: '10 shipped apps. React Native is my primary stack for 5 years.' });
  await Promise.all([
    saveBid({ projectId: p_open2.id, bidderId: fr1.id, amount: 14500, status: BidStatus.PENDING }),
    saveBid({ projectId: p_open2.id, bidderId: ao1.id, agencyId: ag1.id, amount: 19000, status: BidStatus.PENDING, bidType: BidType.AGENCY }),
    saveBid({ projectId: p_open2.id, bidderId: fr7.id, amount: 13000, status: BidStatus.REJECTED }),
    saveBid({ projectId: p_open2.id, bidderId: fr6.id, amount: 17500, status: BidStatus.WITHDRAWN }),
  ]);

  await Promise.all([
    saveBid({ projectId: p_open3.id, bidderId: fr8.id, amount: 2200, status: BidStatus.SHORTLISTED, deliveryDays: 25 }),
    saveBid({ projectId: p_open3.id, bidderId: fr4.id, amount: 2800, status: BidStatus.PENDING }),
    saveBid({ projectId: p_open3.id, bidderId: fr7.id, amount: 1900, status: BidStatus.REJECTED }),
  ]);

  const bid_fr6_p4 = await saveBid({ projectId: p_open4.id, bidderId: fr6.id, amount: 95, status: BidStatus.SHORTLISTED, deliveryDays: 60, coverLetter: 'AWS certified, Kubernetes expert. I have done exactly this setup 8 times.' });
  await Promise.all([
    saveBid({ projectId: p_open4.id, bidderId: ao1.id, agencyId: ag1.id, amount: 105, status: BidStatus.PENDING, bidType: BidType.AGENCY }),
    saveBid({ projectId: p_open4.id, bidderId: fr5.id, amount: 90, status: BidStatus.REJECTED }),
  ]);

  await Promise.all([
    saveBid({ projectId: p_open5.id, bidderId: fr7.id, amount: 11000, status: BidStatus.SHORTLISTED, deliveryDays: 45 }),
    saveBid({ projectId: p_open5.id, bidderId: ao1.id, agencyId: ag1.id, amount: 13500, status: BidStatus.PENDING, bidType: BidType.AGENCY }),
    saveBid({ projectId: p_open5.id, bidderId: fr1.id, amount: 10500, status: BidStatus.REJECTED }),
  ]);

  await Promise.all([
    saveBid({ projectId: p_open6.id, bidderId: fr4.id, amount: 2800, status: BidStatus.SHORTLISTED }),
    saveBid({ projectId: p_open6.id, bidderId: fr8.id, amount: 2200, status: BidStatus.PENDING }),
    saveBid({ projectId: p_open6.id, bidderId: ao2.id, agencyId: ag2.id, amount: 3400, status: BidStatus.PENDING, bidType: BidType.AGENCY }),
  ]);

  // Review project bids
  await Promise.all([
    saveBid({ projectId: p_rev1.id, bidderId: fr5.id, amount: 9500, status: BidStatus.SHORTLISTED }),
    saveBid({ projectId: p_rev1.id, bidderId: fr6.id, amount: 8800, status: BidStatus.SHORTLISTED }),
    saveBid({ projectId: p_rev1.id, bidderId: fr1.id, amount: 10500, status: BidStatus.REJECTED }),
    saveBid({ projectId: p_rev2.id, bidderId: fr2.id, amount: 3200, status: BidStatus.SHORTLISTED }),
    saveBid({ projectId: p_rev2.id, bidderId: ao2.id, agencyId: ag2.id, amount: 3800, status: BidStatus.SHORTLISTED, bidType: BidType.AGENCY }),
  ]);

  // In-progress project accepted bids
  const bid_fr1_prog1 = await saveBid({ projectId: p_prog1.id, bidderId: fr1.id, amount: 95, status: BidStatus.ACCEPTED });
  const bid_fr3_prog2 = await saveBid({ projectId: p_prog2.id, bidderId: fr3.id, amount: 28000, status: BidStatus.ACCEPTED });
  const bid_fr5_prog3 = await saveBid({ projectId: p_prog3.id, bidderId: fr5.id, amount: 17000, status: BidStatus.ACCEPTED });
  const bid_fr6_prog4 = await saveBid({ projectId: p_prog4.id, bidderId: fr6.id, amount: 21000, status: BidStatus.ACCEPTED });
  const bid_fr4_prog5 = await saveBid({ projectId: p_prog5.id, bidderId: fr4.id, amount: 3800, status: BidStatus.ACCEPTED });

  // Completed project bids
  const bid_fr1_done1 = await saveBid({ projectId: p_done1.id, bidderId: fr1.id, amount: 6200, status: BidStatus.ACCEPTED });
  const bid_fr2_done2 = await saveBid({ projectId: p_done2.id, bidderId: fr2.id, amount: 10500, status: BidStatus.ACCEPTED });
  const bid_fr3_done3 = await saveBid({ projectId: p_done3.id, bidderId: fr3.id, amount: 19000, status: BidStatus.ACCEPTED });
  const bid_fr5_done4 = await saveBid({ projectId: p_done4.id, bidderId: fr5.id, amount: 21000, status: BidStatus.ACCEPTED });
  const bid_fr8_done5 = await saveBid({ projectId: p_done5.id, bidderId: fr8.id, amount: 2500, status: BidStatus.ACCEPTED });

  // Expired bids on closed projects
  await Promise.all([
    saveBid({ projectId: p_closed1.id, bidderId: fr6.id, amount: 6500, status: BidStatus.ACCEPTED }),
    saveBid({ projectId: p_closed2.id, bidderId: fr8.id, amount: 2000, status: BidStatus.ACCEPTED }),
    saveBid({ projectId: p_open7.id, bidderId: fr2.id, amount: 4200, status: BidStatus.PENDING }),
    saveBid({ projectId: p_open7.id, bidderId: ao2.id, agencyId: ag2.id, amount: 4800, status: BidStatus.SHORTLISTED, bidType: BidType.AGENCY }),
    saveBid({ projectId: p_open7.id, bidderId: fr1.id, amount: 3900, status: BidStatus.EXPIRED }),
  ]);

  console.log(`✓ ${await bidRepo.count()} bids`);

  // ══════════════════════════════════════════════════════════════════════════
  // 10. CONTRACTS  (all statuses)
  // ══════════════════════════════════════════════════════════════════════════
  const saveContract = (data: Partial<Contract>) => contractRepo.save(contractRepo.create({
    currency: 'USD', platformFeePercent: 10, platformFeeAmount: 0,
    clientSigned: true, freelancerSigned: true,
    clientSignedAt: daysAgo(30), freelancerSignedAt: daysAgo(30),
    paidAmount: 0, escrowAmount: 0,
    ...data,
  } as any));

  // ACTIVE contracts
  const ctr1 = await saveContract({ contractNumber: ctrNo(), projectId: p_prog1.id, clientId: cl2.id, freelancerId: fr1.id, bidId: bid_fr1_prog1.id, status: ContractStatus.ACTIVE, type: ContractType.HOURLY, totalAmount: 9500, hourlyRate: 95, hoursPerWeek: 20, startDate: daysAgo(35), deadline: daysAhead(25), paidAmount: 3800, escrowAmount: 1900, platformFeeAmount: 380, terms: 'Weekly updates every Friday. IP transfers upon final payment.', clientSignedAt: daysAgo(36), freelancerSignedAt: daysAgo(35) });
  const ctr2 = await saveContract({ contractNumber: ctrNo(), projectId: p_prog2.id, clientId: cl2.id, freelancerId: fr3.id, bidId: bid_fr3_prog2.id, status: ContractStatus.ACTIVE, type: ContractType.FIXED, totalAmount: 28000, startDate: daysAgo(50), deadline: daysAhead(40), paidAmount: 14000, escrowAmount: 7000, platformFeeAmount: 2800, terms: '4 milestones. Funds released upon milestone approval.' });
  const ctr3 = await saveContract({ contractNumber: ctrNo(), projectId: p_prog3.id, clientId: cl5.id, freelancerId: fr5.id, bidId: bid_fr5_prog3.id, status: ContractStatus.ACTIVE, type: ContractType.FIXED, totalAmount: 17000, startDate: daysAgo(32), deadline: daysAhead(28), paidAmount: 5000, escrowAmount: 5000, platformFeeAmount: 1700 });
  const ctr4 = await saveContract({ contractNumber: ctrNo(), projectId: p_prog4.id, clientId: cl2.id, freelancerId: fr6.id, bidId: bid_fr6_prog4.id, status: ContractStatus.ACTIVE, type: ContractType.FIXED, totalAmount: 21000, startDate: daysAgo(45), deadline: daysAhead(15), paidAmount: 15750, escrowAmount: 5250, platformFeeAmount: 2100 });
  const ctr5 = await saveContract({ contractNumber: ctrNo(), projectId: p_prog5.id, clientId: cl5.id, freelancerId: fr4.id, bidId: bid_fr4_prog5.id, status: ContractStatus.ACTIVE, type: ContractType.FIXED, totalAmount: 3800, startDate: daysAgo(18), deadline: daysAhead(12), paidAmount: 0, escrowAmount: 3800, platformFeeAmount: 380 });

  // PENDING contract
  const ctr6 = await saveContract({ contractNumber: ctrNo(), projectId: p_rev1.id, clientId: cl2.id, freelancerId: fr5.id, status: ContractStatus.PENDING, type: ContractType.FIXED, totalAmount: 9500, startDate: daysAhead(3), deadline: daysAhead(60), clientSigned: true, freelancerSigned: false, platformFeeAmount: 950 });

  // PAUSED contract
  const ctr7 = await saveContract({ contractNumber: ctrNo(), projectId: p_paused.id, clientId: cl3.id, freelancerId: fr3.id, status: ContractStatus.PAUSED, type: ContractType.FIXED, totalAmount: 1600, startDate: daysAgo(40), deadline: daysAhead(20), paidAmount: 800, escrowAmount: 0, pauseReason: 'Client requested pause while reviewing App Store guidelines change.', platformFeeAmount: 160 });

  // COMPLETED contracts
  const ctr8 = await saveContract({ contractNumber: ctrNo(), projectId: p_done1.id, clientId: cl1.id, freelancerId: fr1.id, bidId: bid_fr1_done1.id, status: ContractStatus.COMPLETED, type: ContractType.FIXED, totalAmount: 6200, startDate: daysAgo(160), deadline: daysAgo(105), actualEndDate: daysAgo(100), paidAmount: 6200, escrowAmount: 0, platformFeeAmount: 620, completedAt: daysAgo(100) });
  const ctr9 = await saveContract({ contractNumber: ctrNo(), projectId: p_done2.id, clientId: cl2.id, freelancerId: fr2.id, bidId: bid_fr2_done2.id, status: ContractStatus.COMPLETED, type: ContractType.FIXED, totalAmount: 10500, startDate: daysAgo(180), actualEndDate: daysAgo(120), paidAmount: 10500, escrowAmount: 0, platformFeeAmount: 1050, completedAt: daysAgo(120) });
  const ctr10 = await saveContract({ contractNumber: ctrNo(), projectId: p_done3.id, clientId: cl1.id, freelancerId: fr3.id, bidId: bid_fr3_done3.id, status: ContractStatus.COMPLETED, type: ContractType.FIXED, totalAmount: 19000, startDate: daysAgo(200), actualEndDate: daysAgo(135), paidAmount: 19000, escrowAmount: 0, platformFeeAmount: 1900, completedAt: daysAgo(135) });
  const ctr11 = await saveContract({ contractNumber: ctrNo(), projectId: p_done4.id, clientId: cl2.id, freelancerId: fr5.id, bidId: bid_fr5_done4.id, status: ContractStatus.COMPLETED, type: ContractType.FIXED, totalAmount: 21000, startDate: daysAgo(275), actualEndDate: daysAgo(205), paidAmount: 21000, escrowAmount: 0, platformFeeAmount: 2100, completedAt: daysAgo(205) });
  const ctr12 = await saveContract({ contractNumber: ctrNo(), projectId: p_done5.id, clientId: cl5.id, freelancerId: fr8.id, bidId: bid_fr8_done5.id, status: ContractStatus.COMPLETED, type: ContractType.FIXED, totalAmount: 2500, startDate: daysAgo(140), actualEndDate: daysAgo(112), paidAmount: 2500, escrowAmount: 0, platformFeeAmount: 250, completedAt: daysAgo(112) });

  // DISPUTED contract
  const ctr13 = await saveContract({ contractNumber: ctrNo(), projectId: p_prog2.id, clientId: cl4.id, freelancerId: fr7.id, status: ContractStatus.DISPUTED, type: ContractType.FIXED, totalAmount: 9000, startDate: daysAgo(80), paidAmount: 4500, escrowAmount: 4500, platformFeeAmount: 900 });

  // CANCELLED contracts
  const ctr14 = await saveContract({ contractNumber: ctrNo(), projectId: p_canc1.id, clientId: cl4.id, freelancerId: fr2.id, status: ContractStatus.CANCELLED, type: ContractType.FIXED, totalAmount: 13000, startDate: daysAgo(80), paidAmount: 0, escrowAmount: 0, cancellationReason: 'Project cancelled due to funding issues.', cancelledAt: daysAgo(70), platformFeeAmount: 0 });

  // TERMINATED contract
  const ctr15 = await saveContract({ contractNumber: ctrNo(), projectId: p_closed1.id, clientId: cl4.id, freelancerId: fr6.id, status: ContractStatus.TERMINATED, type: ContractType.FIXED, totalAmount: 6500, startDate: daysAgo(240), paidAmount: 3250, escrowAmount: 0, cancellationReason: 'Freelancer went unresponsive for 14 days.', cancelledAt: daysAgo(200), platformFeeAmount: 325 });

  // Extra completed for agencies
  const ctr16 = await saveContract({ contractNumber: ctrNo(), projectId: p_closed2.id, clientId: cl5.id, freelancerId: fr8.id, status: ContractStatus.COMPLETED, type: ContractType.FIXED, totalAmount: 2000, startDate: daysAgo(195), actualEndDate: daysAgo(142), paidAmount: 2000, escrowAmount: 0, platformFeeAmount: 200, completedAt: daysAgo(142) });

  console.log(`✓ ${await contractRepo.count()} contracts`);

  // ══════════════════════════════════════════════════════════════════════════
  // 11. MILESTONES  (all statuses)
  // ══════════════════════════════════════════════════════════════════════════
  const ms = (data: Partial<Milestone>) => msRepo.create({ order: 1, ...data } as any);

  // ctr1 (hourly, active) — 2 milestones
  const [ms1a, ms1b] = await msRepo.save([
    ms({ contractId: ctr1.id, title: 'Phase 1 — API integration', description: 'Salesforce REST API bidirectional sync', amount: 4750, dueDate: daysAgo(5), status: MilestoneStatus.PAID, order: 1 }),
    ms({ contractId: ctr1.id, title: 'Phase 2 — Bulk API & scheduling', description: 'Batch sync + cron jobs', amount: 4750, dueDate: daysAhead(25), status: MilestoneStatus.IN_PROGRESS, order: 2 }),
  ]);

  // ctr2 (fixed, active) — 4 milestones, all states
  const [ms2a, ms2b, ms2c, ms2d] = await msRepo.save([
    ms({ contractId: ctr2.id, title: 'Architecture & Auth', amount: 7000, dueDate: daysAgo(30), status: MilestoneStatus.PAID, order: 1 }),
    ms({ contractId: ctr2.id, title: 'Core Banking Features', amount: 7000, dueDate: daysAgo(10), status: MilestoneStatus.APPROVED, order: 2 }),
    ms({ contractId: ctr2.id, title: 'Crypto Wallet Integration', amount: 7000, dueDate: daysAhead(20), status: MilestoneStatus.IN_PROGRESS, order: 3 }),
    ms({ contractId: ctr2.id, title: 'P2P Payments & QA', amount: 7000, dueDate: daysAhead(40), status: MilestoneStatus.PENDING, order: 4 }),
  ]);

  // ctr3 (active) — 3 milestones
  const [ms3a, ms3b, ms3c] = await msRepo.save([
    ms({ contractId: ctr3.id, title: 'Data Pipeline Setup', amount: 5667, dueDate: daysAgo(15), status: MilestoneStatus.PAID, order: 1 }),
    ms({ contractId: ctr3.id, title: 'Model Training & Evaluation', amount: 5667, dueDate: daysAhead(10), status: MilestoneStatus.SUBMITTED, order: 2 }),
    ms({ contractId: ctr3.id, title: 'API Deployment & Monitoring', amount: 5666, dueDate: daysAhead(28), status: MilestoneStatus.PENDING, order: 3 }),
  ]);

  // ctr4 (near completion) — 4 milestones
  await msRepo.save([
    ms({ contractId: ctr4.id, title: 'VPC & Networking', amount: 5250, dueDate: daysAgo(35), status: MilestoneStatus.PAID, order: 1 }),
    ms({ contractId: ctr4.id, title: 'EKS Cluster & Node Groups', amount: 5250, dueDate: daysAgo(20), status: MilestoneStatus.PAID, order: 2 }),
    ms({ contractId: ctr4.id, title: 'RDS Aurora Multi-Region', amount: 5250, dueDate: daysAgo(5), status: MilestoneStatus.UNDER_REVIEW, order: 3 }),
    ms({ contractId: ctr4.id, title: 'Monitoring & Failover Testing', amount: 5250, dueDate: daysAhead(15), status: MilestoneStatus.PENDING, order: 4 }),
  ]);

  // ctr5 (copywriting) — 2 milestones
  await msRepo.save([
    ms({ contractId: ctr5.id, title: 'Ad Copy (12 variants)', amount: 1900, dueDate: daysAgo(5), status: MilestoneStatus.REVISION_REQUESTED, order: 1 }),
    ms({ contractId: ctr5.id, title: 'Email sequences + homepage', amount: 1900, dueDate: daysAhead(12), status: MilestoneStatus.PENDING, order: 2 }),
  ]);

  // ctr8–12 (completed contracts) — 2 milestones each, all PAID
  for (const [ctr, amounts] of [
    [ctr8,  [3100, 3100]],
    [ctr9,  [5250, 5250]],
    [ctr10, [9500, 9500]],
    [ctr11, [10500, 10500]],
    [ctr12, [1250, 1250]],
  ] as [Contract, number[]][]) {
    await msRepo.save([
      ms({ contractId: ctr.id, title: 'Milestone 1', amount: amounts[0], status: MilestoneStatus.PAID, order: 1 }),
      ms({ contractId: ctr.id, title: 'Milestone 2', amount: amounts[1], status: MilestoneStatus.PAID, order: 2 }),
    ]);
  }

  // ctr13 (disputed) — 2 milestones, one REJECTED
  const [ms13a, ms13b] = await msRepo.save([
    ms({ contractId: ctr13.id, title: 'Smart contract core', amount: 4500, status: MilestoneStatus.PAID, order: 1 }),
    ms({ contractId: ctr13.id, title: 'Frontend & integration', amount: 4500, status: MilestoneStatus.REJECTED, order: 2 }),
  ]);

  // ctr7 (paused) — 2 milestones
  await msRepo.save([
    ms({ contractId: ctr7.id, title: 'ASO Audit & Keyword Research', amount: 800, status: MilestoneStatus.PAID, order: 1 }),
    ms({ contractId: ctr7.id, title: 'Screenshots & Preview Video', amount: 800, status: MilestoneStatus.CANCELLED, order: 2 }),
  ]);

  console.log(`✓ ${await msRepo.count()} milestones`);

  // ── Milestone submission (for ms3b which is SUBMITTED)
  await msSubRepo.save(msSubRepo.create({ milestoneId: ms3b.id, contractId: ctr3.id, freelancerId: fr5.id, description: 'Model trained with 97.4% AUC. Attached notebook and evaluation report.', attachments: ['report.pdf', 'notebook.ipynb'], submittedAt: daysAgo(1) } as any));

  // ══════════════════════════════════════════════════════════════════════════
  // 12. PAYMENTS  (all types & statuses)
  // ══════════════════════════════════════════════════════════════════════════
  const pay = (data: Partial<Payment>) => payRepo.save(payRepo.create({ transactionId: txId(), currency: 'USD', method: PaymentMethod.WALLET, description: 'Payment', ...data } as any));

  await Promise.all([
    // Escrow deposits
    pay({ payerId: cl2.id, payeeId: fr1.id, contractId: ctr1.id, type: PaymentType.ESCROW_DEPOSIT, amount: 4750, status: PaymentStatus.COMPLETED, processedAt: daysAgo(36) } as any),
    pay({ payerId: cl2.id, payeeId: fr3.id, contractId: ctr2.id, type: PaymentType.ESCROW_DEPOSIT, amount: 14000, status: PaymentStatus.COMPLETED, processedAt: daysAgo(51) } as any),
    pay({ payerId: cl5.id, payeeId: fr5.id, contractId: ctr3.id, type: PaymentType.ESCROW_DEPOSIT, amount: 5000, status: PaymentStatus.COMPLETED, processedAt: daysAgo(33) } as any),
    pay({ payerId: cl2.id, payeeId: fr6.id, contractId: ctr4.id, type: PaymentType.ESCROW_DEPOSIT, amount: 5250, status: PaymentStatus.COMPLETED, processedAt: daysAgo(46) } as any),
    pay({ payerId: cl5.id, payeeId: fr4.id, contractId: ctr5.id, type: PaymentType.ESCROW_DEPOSIT, amount: 3800, status: PaymentStatus.COMPLETED, processedAt: daysAgo(19) } as any),

    // Milestone payments (escrow releases)
    pay({ payerId: cl2.id, payeeId: fr1.id, contractId: ctr1.id, milestoneId: ms1a.id, type: PaymentType.ESCROW_RELEASE, amount: 4275, status: PaymentStatus.COMPLETED, processedAt: daysAgo(8) } as any),
    pay({ payerId: cl2.id, payeeId: fr3.id, contractId: ctr2.id, milestoneId: ms2a.id, type: PaymentType.MILESTONE_PAYMENT, amount: 6300, status: PaymentStatus.COMPLETED, processedAt: daysAgo(32) } as any),
    pay({ payerId: cl5.id, payeeId: fr5.id, contractId: ctr3.id, milestoneId: ms3a.id, type: PaymentType.MILESTONE_PAYMENT, amount: 5100, status: PaymentStatus.COMPLETED, processedAt: daysAgo(17) } as any),

    // Completed project payments
    pay({ payerId: cl1.id, payeeId: fr1.id, contractId: ctr8.id, type: PaymentType.MILESTONE_PAYMENT, amount: 5580, status: PaymentStatus.COMPLETED, processedAt: daysAgo(100) } as any),
    pay({ payerId: cl2.id, payeeId: fr2.id, contractId: ctr9.id, type: PaymentType.MILESTONE_PAYMENT, amount: 9450, status: PaymentStatus.COMPLETED, processedAt: daysAgo(120) } as any),
    pay({ payerId: cl1.id, payeeId: fr3.id, contractId: ctr10.id, type: PaymentType.MILESTONE_PAYMENT, amount: 17100, status: PaymentStatus.COMPLETED, processedAt: daysAgo(135) } as any),
    pay({ payerId: cl2.id, payeeId: fr5.id, contractId: ctr11.id, type: PaymentType.MILESTONE_PAYMENT, amount: 18900, status: PaymentStatus.COMPLETED, processedAt: daysAgo(205) } as any),
    pay({ payerId: cl5.id, payeeId: fr8.id, contractId: ctr12.id, type: PaymentType.MILESTONE_PAYMENT, amount: 2250, status: PaymentStatus.COMPLETED, processedAt: daysAgo(112) } as any),

    // Bonus payment
    pay({ payerId: cl1.id, payeeId: fr1.id, contractId: ctr8.id, type: PaymentType.BONUS, amount: 500, status: PaymentStatus.COMPLETED, description: 'Delivered 3 days early — bonus!', processedAt: daysAgo(99) } as any),

    // Platform fees
    pay({ payerId: fr1.id, payeeId: admin.id, contractId: ctr8.id, type: PaymentType.PLATFORM_FEE, amount: 620, status: PaymentStatus.COMPLETED, processedAt: daysAgo(100) } as any),

    // Pending payment
    pay({ payerId: cl5.id, payeeId: fr4.id, contractId: ctr5.id, type: PaymentType.ESCROW_DEPOSIT, amount: 1900, status: PaymentStatus.PENDING } as any),

    // Failed payment
    pay({ payerId: cl4.id, payeeId: fr7.id, contractId: ctr13.id, type: PaymentType.ESCROW_DEPOSIT, amount: 4500, status: PaymentStatus.FAILED, description: 'Payment failed: insufficient funds.' } as any),

    // Refund
    pay({ payerId: admin.id, payeeId: cl4.id, contractId: ctr14.id, type: PaymentType.REFUND, amount: 1000, status: PaymentStatus.COMPLETED, description: 'Partial refund for cancelled project.', processedAt: daysAgo(68) } as any),

    // Withdrawal
    pay({ payerId: fr1.id, payeeId: fr1.id, type: PaymentType.WITHDRAWAL, amount: 10000, status: PaymentStatus.COMPLETED, method: PaymentMethod.BANK_TRANSFER, description: 'Withdrawal to bank account.', processedAt: daysAgo(30) } as any),

    // On-hold payment
    pay({ payerId: cl2.id, payeeId: fr3.id, contractId: ctr2.id, milestoneId: ms2b.id, type: PaymentType.ESCROW_RELEASE, amount: 6300, status: PaymentStatus.ON_HOLD, description: 'On hold pending dispute resolution.' } as any),
  ]);

  console.log(`✓ ${await payRepo.count()} payments`);

  // ══════════════════════════════════════════════════════════════════════════
  // 13. REVIEWS
  // ══════════════════════════════════════════════════════════════════════════
  const rev = (data: Partial<Review>) => reviewRepo.save(reviewRepo.create(data as any));

  await Promise.all([
    // Completed project reviews (bidirectional)
    rev({ reviewerId: cl1.id, revieweeId: fr1.id, contractId: ctr8.id, projectId: p_done1.id, type: ReviewType.CLIENT_TO_FREELANCER, overallRating: 5, communicationRating: 5, qualityRating: 5, timelinessRating: 5, comment: 'Frank delivered exactly what we needed, 3 days early. Exceptional React/Node skills and superb communication. Will definitely hire again.' }),
    rev({ reviewerId: fr1.id, revieweeId: cl1.id, contractId: ctr8.id, projectId: p_done1.id, type: ReviewType.FREELANCER_TO_CLIENT, overallRating: 5, communicationRating: 5, qualityRating: 5, timelinessRating: 5, comment: 'Alice had clear requirements, gave fast feedback, and paid promptly. Dream client.' }),

    rev({ reviewerId: cl2.id, revieweeId: fr2.id, contractId: ctr9.id, projectId: p_done2.id, type: ReviewType.CLIENT_TO_FREELANCER, overallRating: 5, communicationRating: 4, qualityRating: 5, timelinessRating: 5, comment: "Grace's design system is a work of art. The team adopted it immediately. Highly recommended." }),
    rev({ reviewerId: fr2.id, revieweeId: cl2.id, contractId: ctr9.id, projectId: p_done2.id, type: ReviewType.FREELANCER_TO_CLIENT, overallRating: 4, communicationRating: 4, qualityRating: 5, timelinessRating: 4, comment: 'Bob had a big scope but gave me the space to do great work. Good client.' }),

    rev({ reviewerId: cl1.id, revieweeId: fr3.id, contractId: ctr10.id, projectId: p_done3.id, type: ReviewType.CLIENT_TO_FREELANCER, overallRating: 5, communicationRating: 5, qualityRating: 5, timelinessRating: 4, comment: "Henry's Flutter app exceeded all expectations. The offline-first architecture is rock solid." }),
    rev({ reviewerId: fr3.id, revieweeId: cl1.id, contractId: ctr10.id, projectId: p_done3.id, type: ReviewType.FREELANCER_TO_CLIENT, overallRating: 5, communicationRating: 5, qualityRating: 5, timelinessRating: 5, comment: 'Alice is the best client I have worked with. Clear briefs, fast approvals.' }),

    rev({ reviewerId: cl2.id, revieweeId: fr5.id, contractId: ctr11.id, projectId: p_done4.id, type: ReviewType.CLIENT_TO_FREELANCER, overallRating: 5, communicationRating: 5, qualityRating: 5, timelinessRating: 5, comment: "James' fraud model went live and immediately flagged $40k in fraudulent transactions in week 1. Outstanding ROI." }),
    rev({ reviewerId: fr5.id, revieweeId: cl2.id, contractId: ctr11.id, projectId: p_done4.id, type: ReviewType.FREELANCER_TO_CLIENT, overallRating: 4, communicationRating: 5, qualityRating: 5, timelinessRating: 4, comment: 'Bob provides excellent data and infrastructure access. Makes the ML work much easier.' }),

    rev({ reviewerId: cl5.id, revieweeId: fr8.id, contractId: ctr12.id, projectId: p_done5.id, type: ReviewType.CLIENT_TO_FREELANCER, overallRating: 4, communicationRating: 4, qualityRating: 4, timelinessRating: 4, comment: 'Mia delivered a solid Google Ads restructure. CPA dropped 34%. Would hire again for the next campaign.' }),
    rev({ reviewerId: fr8.id, revieweeId: cl5.id, contractId: ctr12.id, projectId: p_done5.id, type: ReviewType.FREELANCER_TO_CLIENT, overallRating: 5, communicationRating: 5, qualityRating: 5, timelinessRating: 5, comment: 'Eve is a marketing powerhouse. Clear KPIs, great data access, and she acts on suggestions fast.' }),

    rev({ reviewerId: cl5.id, revieweeId: fr8.id, contractId: ctr16.id, projectId: p_closed2.id, type: ReviewType.CLIENT_TO_FREELANCER, overallRating: 4, communicationRating: 4, qualityRating: 4, timelinessRating: 5, comment: 'Email automation is running smoothly. Open rates up 18%.' }),
    rev({ reviewerId: fr8.id, revieweeId: cl5.id, contractId: ctr16.id, projectId: p_closed2.id, type: ReviewType.FREELANCER_TO_CLIENT, overallRating: 4, communicationRating: 4, qualityRating: 4, timelinessRating: 4, comment: 'Smooth project with a professional client.' }),
  ]);

  console.log(`✓ ${await reviewRepo.count()} reviews`);

  // ══════════════════════════════════════════════════════════════════════════
  // 14. DISPUTES  (all statuses)
  // ══════════════════════════════════════════════════════════════════════════
  const disp = (data: Partial<Dispute>) => disputeRepo.save(disputeRepo.create(data as any));

  const dispute1 = await disp({ disputeNumber: dispNo(), contractId: ctr13.id, claimantId: cl4.id, respondentId: fr7.id, status: DisputeStatus.UNDER_REVIEW, reason: DisputeReason.POOR_QUALITY, title: 'Frontend deliverable does not match agreed requirements', description: 'The delivered frontend has critical bugs and is missing 3 agreed features. The responsive layout is broken on mobile. I have provided screenshots and the original spec.', claimAmount: 4500, attachments: ['screenshot1.png', 'original-spec.pdf'], responseDeadline: daysAhead(5) });

  const dispute2 = await disp({ disputeNumber: dispNo(), contractId: ctr15.id, claimantId: cl4.id, respondentId: fr6.id, mediatorId: admin.id, status: DisputeStatus.RESOLVED_SPLIT, reason: DisputeReason.DEADLINE_MISSED, title: 'Freelancer went silent for 14 days', description: 'No response to messages, milestones missed, and no delivery update for 2 weeks.', claimAmount: 3250, resolvedAmount: 1625, claimantSharePercent: 50, respondentSharePercent: 50, resolution: 'Admin reviewed communication logs. Both parties bear partial responsibility. 50/50 split of escrowed funds.', resolvedAt: daysAgo(195) });

  const dispute3 = await disp({ disputeNumber: dispNo(), contractId: ctr2.id, claimantId: fr3.id, respondentId: cl2.id, status: DisputeStatus.AWAITING_RESPONSE, reason: DisputeReason.PAYMENT_ISSUE, title: 'Escrow release refused after milestone approval', description: 'Milestone 2 was marked approved by client but funds were not released. Client is citing scope change that was not in the original contract.', claimAmount: 7000, responseDeadline: daysAhead(3) });

  const dispute4 = await disp({ disputeNumber: dispNo(), contractId: ctr11.id, claimantId: fr5.id, respondentId: cl2.id, mediatorId: admin.id, status: DisputeStatus.RESOLVED_CLAIMANT, reason: DisputeReason.SCOPE_CHANGE, title: 'Client added major out-of-scope feature requests', description: 'After contract signing, client requested integrations with 4 additional data sources not in scope. This added 3 weeks of work.', claimAmount: 5000, resolvedAmount: 4500, claimantSharePercent: 100, resolution: 'Admin confirmed scope creep via contract and Slack logs. Freelancer compensated.', resolvedAt: daysAgo(210) });

  const dispute5 = await disp({ disputeNumber: dispNo(), contractId: ctr9.id, claimantId: cl2.id, respondentId: fr2.id, status: DisputeStatus.CLOSED, reason: DisputeReason.COMMUNICATION, title: 'Designer went 5 days without responding', description: 'After milestone 1, designer went silent for 5 days during a critical revision window.', claimAmount: 1000, resolvedAmount: 0, resolution: 'Dispute closed after freelancer provided satisfactory explanation (family emergency) and delivered revision.', resolvedAt: daysAgo(125), closedAt: daysAgo(124) });

  const dispute6 = await disp({ disputeNumber: dispNo(), contractId: ctr7.id, claimantId: fr3.id, respondentId: cl3.id, status: DisputeStatus.OPEN, reason: DisputeReason.CONTRACT_VIOLATION, title: 'Client paused contract without notice or compensation', description: 'Contract was paused without the 7-day notice clause being honoured. Freelancer had already blocked out calendar time.', claimAmount: 800 });

  const dispute7 = await disp({ disputeNumber: dispNo(), contractId: ctr4.id, claimantId: fr6.id, respondentId: cl2.id, mediatorId: admin.id, status: DisputeStatus.MEDIATION, reason: DisputeReason.SCOPE_CHANGE, title: 'Additional regions added mid-contract', description: 'Client added 2 extra AWS regions to the IaC scope after contract started. Requesting additional compensation.', claimAmount: 3500, responseDeadline: daysAhead(10) });

  // Dispute messages
  await dispMsgRepo.save([
    dispMsgRepo.create({ disputeId: dispute1.id, senderId: cl4.id, message: 'I have attached the original spec and screenshots. The mobile layout is completely broken.', senderType: 'claimant' } as any),
    dispMsgRepo.create({ disputeId: dispute1.id, senderId: fr7.id, message: 'I acknowledge the mobile issue. It was caused by a CSS framework update. I can fix it within 48 hours at no extra cost.', senderType: 'respondent' } as any),
    dispMsgRepo.create({ disputeId: dispute1.id, senderId: admin.id, message: 'We have reviewed the attachments. Freelancer has 48 hours to submit a fix. If not resolved, escrow will be partially refunded.', senderType: 'mediator' } as any),
    dispMsgRepo.create({ disputeId: dispute3.id, senderId: fr3.id, message: 'Milestone 2 was explicitly approved via the platform on [date]. Release of funds should be automatic per ToS.', senderType: 'claimant' } as any),
    dispMsgRepo.create({ disputeId: dispute3.id, senderId: cl2.id, message: 'The milestone was approved conditionally. We later found the integration does not support our custom fields.', senderType: 'respondent' } as any),
  ]);

  console.log(`✓ ${await disputeRepo.count()} disputes`);

  // ══════════════════════════════════════════════════════════════════════════
  // 15. INVOICES  (all statuses)
  // ══════════════════════════════════════════════════════════════════════════
  const inv = async (data: Partial<Invoice>, items: { description: string; quantity: number; rate: number }[]) => {
    const subtotal = items.reduce((s, i) => s + i.quantity * i.rate, 0);
    const taxAmount = +(subtotal * (data.taxRate as number ?? 0) / 100).toFixed(2);
    const total = +(subtotal + taxAmount - (data.discountAmount as number ?? 0)).toFixed(2);
    const invoice = await invoiceRepo.save(invoiceRepo.create({ invoiceNumber: invNo(), subtotal, taxAmount, totalAmount: total, paidAmount: 0, currency: 'USD', taxRate: 0, discountAmount: 0, ...data } as any));
    await invItemRepo.save(items.map((i, idx) => invItemRepo.create({ invoiceId: invoice.id, description: i.description, quantity: i.quantity, unitPrice: i.rate, total: +(i.quantity * i.rate).toFixed(2), sortOrder: idx + 1 } as any)));
    return invoice;
  };

  await Promise.all([
    inv({ freelancerId: fr1.id, clientId: cl2.id, contractId: ctr1.id, status: InvoiceStatus.PAID, issuedAt: daysAgo(8), paidAt: daysAgo(6), dueDate: daysAgo(1), notes: 'Phase 1 delivery — Salesforce REST sync' }, [{ description: 'API integration (50 hours @ $95)', quantity: 50, rate: 95 }]),
    inv({ freelancerId: fr1.id, clientId: cl1.id, contractId: ctr8.id, status: InvoiceStatus.PAID, issuedAt: daysAgo(101), paidAt: daysAgo(99), dueDate: daysAgo(95), taxRate: 8, discountAmount: 0 }, [{ description: 'Next.js Blog Platform — final delivery', quantity: 1, rate: 5580 }, { description: 'Early delivery bonus', quantity: 1, rate: 500 }]),
    inv({ freelancerId: fr2.id, clientId: cl2.id, contractId: ctr9.id, status: InvoiceStatus.PAID, issuedAt: daysAgo(121), paidAt: daysAgo(118), dueDate: daysAgo(115) }, [{ description: 'Design System (Figma + Storybook)', quantity: 1, rate: 9450 }]),
    inv({ freelancerId: fr3.id, clientId: cl2.id, contractId: ctr2.id, status: InvoiceStatus.SENT, issuedAt: daysAgo(3), dueDate: daysAhead(12) }, [{ description: 'Milestone 2 — Core Banking Features', quantity: 1, rate: 6300 }]),
    inv({ freelancerId: fr5.id, clientId: cl5.id, contractId: ctr3.id, status: InvoiceStatus.VIEWED, issuedAt: daysAgo(1), dueDate: daysAhead(14), viewedAt: daysAgo(0) }, [{ description: 'Recommendation Engine — Milestone 2', quantity: 1, rate: 5100 }]),
    inv({ freelancerId: fr6.id, clientId: cl2.id, contractId: ctr4.id, status: InvoiceStatus.PARTIALLY_PAID, issuedAt: daysAgo(6), dueDate: daysAhead(9), paidAmount: 3000 }, [{ description: 'RDS Aurora Multi-Region Setup', quantity: 1, rate: 5250 }]),
    inv({ freelancerId: fr3.id, clientId: cl1.id, contractId: ctr10.id, status: InvoiceStatus.PAID, issuedAt: daysAgo(136), paidAt: daysAgo(133) }, [{ description: 'Flutter App — Final Delivery', quantity: 1, rate: 17100 }]),
    inv({ freelancerId: fr5.id, clientId: cl2.id, contractId: ctr11.id, status: InvoiceStatus.PAID, issuedAt: daysAgo(206), paidAt: daysAgo(203) }, [{ description: 'Fraud Detection ML Model', quantity: 1, rate: 18900 }]),
    inv({ freelancerId: fr4.id, clientId: cl5.id, contractId: ctr5.id, status: InvoiceStatus.DRAFT, dueDate: daysAhead(20) }, [{ description: 'Ad Copy — 12 variants', quantity: 1, rate: 1900 }, { description: 'Email sequences (4)', quantity: 1, rate: 1900 }]),
    inv({ freelancerId: fr8.id, clientId: cl5.id, contractId: ctr16.id, status: InvoiceStatus.PAID, issuedAt: daysAgo(143), paidAt: daysAgo(140) }, [{ description: 'Email Marketing Automation Setup', quantity: 1, rate: 2000 }]),
    inv({ freelancerId: fr7.id, clientId: cl4.id, contractId: ctr13.id, status: InvoiceStatus.DISPUTED, issuedAt: daysAgo(15), dueDate: daysAgo(5) }, [{ description: 'NFT Marketplace Frontend', quantity: 1, rate: 4500 }]),
    inv({ freelancerId: fr6.id, clientId: cl2.id, contractId: ctr1.id, status: InvoiceStatus.OVERDUE, issuedAt: daysAgo(30), dueDate: daysAgo(10) }, [{ description: 'DevOps consulting (additional hours)', quantity: 8, rate: 105 }]),
  ]);

  console.log(`✓ ${await invoiceRepo.count()} invoices`);

  // ══════════════════════════════════════════════════════════════════════════
  // 16. NOTIFICATIONS
  // ══════════════════════════════════════════════════════════════════════════
  const notif = (userId: string, type: NotificationType, title: string, message: string, link?: string, read = false) =>
    notifRepo.create({ userId, type, title, message, link, isRead: read } as any);

  await notifRepo.save([
    // Freelancers — bid / contract
    notif(fr1.id, NotificationType.BID_SHORTLISTED, 'Your bid was shortlisted!', 'Your bid on "Full-Stack SaaS Dashboard" has been shortlisted.', '/bids', false),
    notif(fr1.id, NotificationType.CONTRACT_CREATED, 'New contract ready to sign', 'Bob Smith has created a contract for "CRM Integration".', '/contracts', true),
    notif(fr1.id, NotificationType.PAYMENT_RECEIVED, 'Payment received: $4,275', 'Escrow released for Milestone 1 — Salesforce API integration.', '/payments', false),
    notif(fr1.id, NotificationType.REVIEW_RECEIVED, 'New 5-star review!', 'Alice Johnson left you a 5-star review.', '/reviews', false),
    notif(fr1.id, NotificationType.MILESTONE_REVISION, 'Revision requested', 'Client requested changes to Milestone 1 of "CRM Integration".', '/contracts', true),

    notif(fr2.id, NotificationType.BID_ACCEPTED, 'Your bid was accepted!', 'Your bid on "Design System" has been accepted. Contract incoming.', '/bids', true),
    notif(fr2.id, NotificationType.MILESTONE_APPROVED, 'Milestone approved ✓', 'Milestone 1 of "Design System" has been approved.', '/contracts', true),
    notif(fr2.id, NotificationType.PAYMENT_RECEIVED, 'Payment received: $9,450', 'Final payment released for "Design System".', '/payments', false),
    notif(fr2.id, NotificationType.DISPUTE_MESSAGE, 'New dispute message', 'Client added a message in dispute DSP-2024-0005.', '/disputes', false),

    notif(fr3.id, NotificationType.CONTRACT_SIGNED, 'Contract signed by both parties', 'Mobile Banking App Phase 2 contract is now active.', '/contracts', true),
    notif(fr3.id, NotificationType.DISPUTE_OPENED, 'Dispute opened on your contract', 'A dispute has been opened on contract CTR-2024-0003.', '/disputes', false),
    notif(fr3.id, NotificationType.MILESTONE_SUBMITTED, 'Milestone submitted', 'Your Milestone 2 submission is under client review.', '/contracts', false),

    notif(fr5.id, NotificationType.BID_REJECTED, 'Bid not selected', 'Your bid on "Data Pipeline for BI Tool" was not selected this time.', '/bids', true),
    notif(fr5.id, NotificationType.PAYMENT_RECEIVED, 'Payment: $5,100', 'Milestone 1 payment received for Recommendation Engine.', '/payments', false),
    notif(fr5.id, NotificationType.DISPUTE_RESOLVED, 'Dispute resolved in your favour', 'Admin resolved dispute DSP-2024-0004. Funds being released.', '/disputes', false),

    notif(fr6.id, NotificationType.CONTRACT_COMPLETED, 'Contract marked complete', 'Multi-Region AWS Infrastructure project is now complete.', '/contracts', false),
    notif(fr6.id, NotificationType.PROFILE_VERIFIED, 'Profile verified ✓', 'Your freelancer profile has been verified by the Nexus team.', '/profile', true),

    notif(fr7.id, NotificationType.DISPUTE_MESSAGE, 'Dispute response required', 'Client posted evidence in DSP-2024-0001. Please respond within 48h.', '/disputes', false),
    notif(fr8.id, NotificationType.BID_SHORTLISTED, 'Bid shortlisted', 'Your bid on "SEO Audit" was shortlisted.', '/bids', false),

    // Clients — project / contract
    notif(cl1.id, NotificationType.BID_RECEIVED, '8 new bids on your project', '"Full-Stack SaaS Dashboard" received 8 bids. Start reviewing!', '/projects', false),
    notif(cl1.id, NotificationType.CONTRACT_COMPLETED, 'Project completed! 🎉', '"Next.js Blog Platform" has been successfully completed.', '/contracts', true),
    notif(cl1.id, NotificationType.REVIEW_RECEIVED, 'Freelancer left you a review', 'Frank Miller left a review on your completed project.', '/reviews', true),

    notif(cl2.id, NotificationType.BID_RECEIVED, '12 bids on "React Native Fitness App"', 'Your project is getting strong interest. Review bids now.', '/projects', false),
    notif(cl2.id, NotificationType.ESCROW_FUNDED, 'Escrow funded', '$14,000 placed in escrow for Mobile Banking App Phase 2.', '/payments', true),
    notif(cl2.id, NotificationType.DISPUTE_OPENED, 'Dispute opened on your contract', 'Freelancer opened a dispute on CTR-2024-0003.', '/disputes', false),
    notif(cl2.id, NotificationType.MILESTONE_SUBMITTED, 'Milestone ready for review', 'Henry Moore submitted Milestone 2 for your review.', '/contracts', false),

    notif(cl3.id, NotificationType.CONTRACT_CANCELLED, 'Contract cancelled', 'Contract for "VR Product Showcase" has been cancelled.', '/contracts', true),
    notif(cl4.id, NotificationType.DISPUTE_RESOLVED, 'Dispute resolved', 'Dispute DSP-2024-0002 resolved. 50/50 split applied.', '/disputes', true),

    notif(cl5.id, NotificationType.BID_RECEIVED, '14 bids on your video project', '"E-commerce Product Video Ads" is very popular.', '/projects', false),
    notif(cl5.id, NotificationType.PROJECT_CLOSED, 'Project closed', '"Email Marketing Automation Setup" has been closed.', '/projects', true),

    // Agency owners
    notif(ao1.id, NotificationType.BID_RECEIVED, 'Agency bid shortlisted', 'TechForge bid on "Full-Stack SaaS Dashboard" is shortlisted.', '/bids', false),
    notif(ao1.id, NotificationType.AGENCY_INVITE_ACCEPTED, 'Team member accepted invite', 'Frank Miller accepted your TechForge agency invite.', '/agencies', true),
    notif(ao2.id, NotificationType.PROFILE_VERIFIED, 'Agency verified ✓', 'PixelCraft Studio has been verified on Nexus.', '/agencies', true),

    // System
    notif(admin.id, NotificationType.SYSTEM, 'New dispute requires review', 'Dispute DSP-2024-0001 has been escalated to admin.', '/admin/disputes', false),
    notif(admin.id, NotificationType.SYSTEM, 'Platform milestone', 'Nexus has processed $500,000 in payments this month!', '/admin/stats', true),

    // Demo users
    notif(demoClient.id, NotificationType.BID_RECEIVED, 'Demo: 5 bids on your project', 'This is a demo notification. Explore how clients receive bid alerts.', '/bids', false),
    notif(demoFreelancer.id, NotificationType.BID_SHORTLISTED, 'Demo: Bid shortlisted', 'This is a demo notification. Explore how freelancers get shortlist alerts.', '/bids', false),
  ]);

  console.log(`✓ ${await notifRepo.count()} notifications`);

  // ══════════════════════════════════════════════════════════════════════════
  // 17. CONVERSATIONS & MESSAGES
  // ══════════════════════════════════════════════════════════════════════════
  const convRepo = AppDataSource.getRepository(Conversation);
  const msgRepo  = AppDataSource.getRepository(Message);

  const makeConv = async (participants: User[], lastMsg: string, projectId?: string) => {
    const conv = await convRepo.save(convRepo.create({
      type: projectId ? ConversationType.PROJECT : ConversationType.DIRECT,
      participants,
      projectId: projectId ?? null,
      lastMessage: lastMsg,
      lastMessageAt: daysAgo(Math.floor(Math.random() * 5)),
    }));
    return conv;
  };

  const addMsg = (convId: string, senderId: string, content: string, daysBack: number) =>
    msgRepo.create({ conversationId: convId, senderId, content, status: MessageStatus.READ, type: MessageType.TEXT, createdAt: daysAgo(daysBack) } as any);

  // conv1: Alice (cl1) ↔ Frank (fr1) — Next.js blog project
  const conv1 = await makeConv([cl1, fr1], 'Delivered 3 days early — thanks for the bonus!', p_done1.id);
  await msgRepo.save([
    addMsg(conv1.id, cl1.id, "Hi Frank! I reviewed your portfolio and I'm impressed. Can we discuss the Next.js blog project?", 20),
    addMsg(conv1.id, fr1.id, "Thanks Alice! I'd love to work on it. I've built 3 similar platforms. Want to jump on a call?", 20),
    addMsg(conv1.id, cl1.id, "Sure! Let's do Friday 2pm. I'll send a contract through Nexus.", 19),
    addMsg(conv1.id, fr1.id, "Contract signed! I'll start with the architecture doc today.", 18),
    addMsg(conv1.id, cl1.id, "Great. Keep me posted with weekly updates.", 18),
    addMsg(conv1.id, fr1.id, "Week 1 done — Sanity CMS integrated, blog listing page ready. Sending milestone 1 soon.", 12),
    addMsg(conv1.id, cl1.id, "Looks fantastic! Approved. Please send milestone 2 when ready.", 11),
    addMsg(conv1.id, fr1.id, "All done and deployed! Check https://blog.alice-demo.com", 7),
    addMsg(conv1.id, cl1.id, "Absolutely love it! Sending the final payment + a little bonus 🎉", 6),
    addMsg(conv1.id, fr1.id, "Delivered 3 days early — thanks for the bonus!", 6),
  ]);

  // conv2: Bob (cl2) ↔ Henry (fr3) — Mobile banking
  const conv2 = await makeConv([cl2, fr3], 'Phase 2 milestone submitted. Please review when ready.', p_prog2.id);
  await msgRepo.save([
    addMsg(conv2.id, cl2.id, "Henry, can you take on Phase 2 of our mobile banking app? Investment portfolio + crypto wallet.", 52),
    addMsg(conv2.id, fr3.id, "Absolutely. I've built similar features for two fintech clients. Let me review the existing codebase.", 51),
    addMsg(conv2.id, cl2.id, "Access granted. What's your timeline estimate?", 50),
    addMsg(conv2.id, fr3.id, "Architecture & Auth: 2 weeks. Core features: 3 weeks. Crypto wallet: 3 weeks. P2P: 2 weeks. Total ~10 weeks.", 50),
    addMsg(conv2.id, cl2.id, "That works. Contract incoming.", 49),
    addMsg(conv2.id, fr3.id, "Contract signed! Starting with architecture review today.", 48),
    addMsg(conv2.id, fr3.id, "Milestone 1 complete — auth and architecture locked in. Submitting now.", 32),
    addMsg(conv2.id, cl2.id, "Approved! Great work on the JWT refresh flow.", 31),
    addMsg(conv2.id, fr3.id, "Core banking features done — transfers, history, statements. Submitting milestone 2.", 10),
    addMsg(conv2.id, cl2.id, "Reviewing now. One question: does the transaction history support CSV export?", 9),
    addMsg(conv2.id, fr3.id, "Yes, CSV and PDF export both included. I added it as a bonus.", 9),
    addMsg(conv2.id, cl2.id, "Excellent! Approved.", 8),
    addMsg(conv2.id, fr3.id, "Phase 2 milestone submitted. Please review when ready.", 1),
  ]);

  // conv3: Bob (cl2) ↔ Kate (fr6) — DevOps infra
  const conv3 = await makeConv([cl2, fr6], "Monitoring dashboard is live. Grafana + PagerDuty integrated.", p_prog4.id);
  await msgRepo.save([
    addMsg(conv3.id, cl2.id, "Kate, we need multi-region AWS setup with full IaC. Are you available?", 47),
    addMsg(conv3.id, fr6.id, "Yes! I've done exactly this 6 times. EKS, RDS Aurora, Route53 failover — I know it well.", 47),
    addMsg(conv3.id, cl2.id, "Perfect. I'm sending a contract for $21,000 total.", 46),
    addMsg(conv3.id, fr6.id, "Signed. Starting with VPC design and Terraform module structure.", 45),
    addMsg(conv3.id, fr6.id, "VPC + networking done. 3 AZs, private/public subnets, NAT gateways. Milestone 1 submitted.", 37),
    addMsg(conv3.id, cl2.id, "Approved! The Terraform plan looks clean.", 36),
    addMsg(conv3.id, fr6.id, "EKS cluster with managed node groups + cluster autoscaler ready. Milestone 2 submitted.", 22),
    addMsg(conv3.id, cl2.id, "Approved. Looking forward to the Aurora setup.", 21),
    addMsg(conv3.id, fr6.id, "Monitoring dashboard is live. Grafana + PagerDuty integrated.", 3),
  ]);

  // conv4: Eve (cl5) ↔ James (fr5) — ML recommendation engine
  const conv4 = await makeConv([cl5, fr5], "AUC is 0.974 on holdout set. Report attached to milestone submission.", p_prog3.id);
  await msgRepo.save([
    addMsg(conv4.id, cl5.id, "James, we need a recommendation engine for our e-commerce platform. 2M+ SKUs.", 34),
    addMsg(conv4.id, fr5.id, "Great project. I'll use a hybrid approach — collaborative filtering + content-based. Python FastAPI for the serving layer.", 33),
    addMsg(conv4.id, cl5.id, "Love the plan. What data do you need from us?", 33),
    addMsg(conv4.id, fr5.id, "Transaction history (last 3 years), product metadata, user profiles, and clickstream data.", 32),
    addMsg(conv4.id, cl5.id, "Data access granted. Contract signed!", 31),
    addMsg(conv4.id, fr5.id, "Data pipeline complete. ETL runs every 4 hours. Milestone 1 submitted.", 18),
    addMsg(conv4.id, cl5.id, "Approved! Faster than expected.", 17),
    addMsg(conv4.id, fr5.id, "AUC is 0.974 on holdout set. Report attached to milestone submission.", 1),
  ]);

  // conv5: Carol (cl3) ↔ Grace (fr2) — Design system dispute
  const conv5 = await makeConv([cl3, fr2], "I understand. Let me resend the revised mockups today.", p_rev2.id);
  await msgRepo.save([
    addMsg(conv5.id, cl3.id, "Grace, we need 5 A/B landing page variants. Figma + HTML/CSS handoff.", 20),
    addMsg(conv5.id, fr2.id, "Happy to take it on! I specialize in conversion-optimized landing pages.", 19),
    addMsg(conv5.id, cl3.id, "Your bid was shortlisted. Can you start next week?", 18),
    addMsg(conv5.id, fr2.id, "Yes, Monday works. I'll send the first wireframes by Wednesday.", 17),
    addMsg(conv5.id, fr2.id, "Wireframes ready for review. Focused on above-the-fold CTA and social proof placement.", 12),
    addMsg(conv5.id, cl3.id, "These look great! One change — can we make the CTA button more prominent on variant 3?", 11),
    addMsg(conv5.id, fr2.id, "I understand. Let me resend the revised mockups today.", 11),
  ]);

  // conv6: Demo client ↔ Frank (fr1) — general inquiry
  const conv6 = await makeConv([demoClient, fr1], "Feel free to explore the platform! I'm a demo user too.");
  await msgRepo.save([
    addMsg(conv6.id, demoClient.id, "Hi Frank! I'm exploring the platform. Your profile is impressive.", 3),
    addMsg(conv6.id, fr1.id, "Thanks! Happy to chat. What kind of project are you working on?", 3),
    addMsg(conv6.id, demoClient.id, "Looking for a full-stack developer for a SaaS dashboard. React + Node.js.", 2),
    addMsg(conv6.id, fr1.id, "That's exactly my specialty. Check out my portfolio — I've built several SaaS dashboards.", 2),
    addMsg(conv6.id, demoClient.id, "Impressive work! I'll post a project and invite you to bid.", 1),
    addMsg(conv6.id, fr1.id, "Feel free to explore the platform! I'm a demo user too.", 0),
  ]);

  // conv7: David (cl4) ↔ Liam (fr7) — disputed project
  const conv7 = await makeConv([cl4, fr7], "I've raised a dispute. Please check the disputes section.", p_prog2.id);
  await msgRepo.save([
    addMsg(conv7.id, cl4.id, "Liam, the frontend has critical bugs. The mobile layout is broken and 3 features are missing.", 15),
    addMsg(conv7.id, fr7.id, "I acknowledge the mobile layout issue — it was caused by a CSS framework update. I can fix it in 48 hours.", 14),
    addMsg(conv7.id, cl4.id, "What about the missing features? They were in the original spec.", 14),
    addMsg(conv7.id, fr7.id, "I'll need to review the spec again. Can you share the specific line items?", 13),
    addMsg(conv7.id, cl4.id, "I sent the spec 3 times already. I've raised a dispute. Please check the disputes section.", 12),
  ]);

  // conv8: Noah (ao1, TechForge) ↔ Alice (cl1)
  const conv8 = await makeConv([ao1, cl1], "TechForge can deliver this. We have 5 engineers ready.");
  await msgRepo.save([
    addMsg(conv8.id, cl1.id, "Hi Noah! I saw TechForge's bid on our SaaS dashboard project. Impressive agency!", 6),
    addMsg(conv8.id, ao1.id, "Thanks Alice! We've built 20+ SaaS dashboards. Our team includes senior React and DevOps engineers.", 6),
    addMsg(conv8.id, cl1.id, "What's your process for milestone delivery and communication?", 5),
    addMsg(conv8.id, ao1.id, "Weekly Loom video updates, daily Slack standups, and a shared project board. Full transparency.", 5),
    addMsg(conv8.id, cl1.id, "That sounds solid. What's your timeline for a 4-milestone project?", 4),
    addMsg(conv8.id, ao1.id, "TechForge can deliver this. We have 5 engineers ready.", 4),
  ]);

  // Update lastMessage on all conversations after saving messages
  for (const [conv, msgs] of [
    [conv1, "Delivered 3 days early — thanks for the bonus!"],
    [conv2, "Phase 2 milestone submitted. Please review when ready."],
    [conv3, "Monitoring dashboard is live. Grafana + PagerDuty integrated."],
    [conv4, "AUC is 0.974 on holdout set. Report attached to milestone submission."],
    [conv5, "I understand. Let me resend the revised mockups today."],
    [conv6, "Feel free to explore the platform! I'm a demo user too."],
    [conv7, "I've raised a dispute. Please check the disputes section."],
    [conv8, "TechForge can deliver this. We have 5 engineers ready."],
  ] as [Conversation, string][]) {
    await convRepo.update(conv.id, { lastMessage: msgs });
  }

  console.log(`✓ ${await convRepo.count()} conversations, ${await msgRepo.count()} messages`);

  // ══════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n🌱 Nexus database seeded successfully!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Demo accounts (read-only, password: Demo@1234)');
  console.log('  ┌──────────────────────────────────┬────────────────┐');
  console.log('  │ Email                            │ Role           │');
  console.log('  ├──────────────────────────────────┼────────────────┤');
  console.log('  │ demo.client@nexus.dev            │ Client         │');
  console.log('  │ demo.freelancer@nexus.dev        │ Freelancer     │');
  console.log('  │ demo.agency@nexus.dev            │ Agency Owner   │');
  console.log('  │ demo.admin@nexus.dev             │ Admin          │');
  console.log('  └──────────────────────────────────┴────────────────┘');
  console.log('\n  Regular accounts (password: Nexus@1234)');
  console.log('  admin@nexus.dev  |  alice.johnson@email.com  |  frank.miller@email.com');
  console.log('  noah.lee@email.com (agency)  |  ... and 14 more users');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await AppDataSource.destroy();
}

main().catch((err) => {
  console.error('❌ Seeding failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
