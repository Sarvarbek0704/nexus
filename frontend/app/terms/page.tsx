import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Nexus Terms of Service — please read these terms carefully before using our platform.',
};

const sections = [
  {
    title: '1. Acceptance of Terms',
    content: `By accessing or using Nexus ("the Platform"), you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using the Platform.`,
  },
  {
    title: '2. Description of Service',
    content: `Nexus is a freelance marketplace that connects clients with freelancers and agencies. We provide tools for project posting, bidding, contract management, and secure escrow-based payments. Nexus acts solely as an intermediary and is not a party to any agreement between clients and freelancers.`,
  },
  {
    title: '3. User Accounts',
    content: `You must be at least 18 years old to use Nexus. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate, current, and complete information during registration and to keep your profile information up to date.`,
  },
  {
    title: '4. Freelancer Obligations',
    content: `Freelancers agree to deliver work that meets the agreed-upon specifications, communicate professionally with clients, submit milestone deliverables on time, and accurately represent their skills and experience. Freelancers must not share confidential client information with third parties.`,
  },
  {
    title: '5. Client Obligations',
    content: `Clients agree to provide clear project requirements, fund milestone escrow before work begins, review submitted work within the agreed timeframe, and provide constructive feedback. Clients must not attempt to circumvent the Platform to hire freelancers directly.`,
  },
  {
    title: '6. Escrow & Payments',
    content: `All payments for fixed-price projects are processed through our escrow system. Clients fund each milestone before work begins. Funds are released to the freelancer upon client approval of the milestone submission. Nexus charges a platform fee on each completed transaction. Disputed payments are handled through our dispute resolution process.`,
  },
  {
    title: '7. Platform Fee',
    content: `Nexus charges a platform fee (default: 10%) on each approved milestone payment. This fee is deducted from the amount released to the freelancer. The exact fee percentage is displayed at contract creation and may be updated with notice.`,
  },
  {
    title: '8. Dispute Resolution',
    content: `In the event of a dispute between a client and freelancer, either party may open a dispute through the Platform. Nexus will review the submitted evidence and make a binding decision within 7 business days. Nexus's decision on disputes is final for amounts processed through the escrow system.`,
  },
  {
    title: '9. Prohibited Activities',
    content: `You agree not to: post false or misleading information, spam or harass other users, attempt to circumvent the Platform's payment system, upload malicious code or content, impersonate other users or Nexus staff, or use the Platform for illegal activities.`,
  },
  {
    title: '10. Intellectual Property',
    content: `Upon full payment and release of escrow funds, the client receives full ownership of the delivered work product, unless otherwise agreed in the contract. Freelancers retain the right to display completed work in their portfolio unless the client requests confidentiality.`,
  },
  {
    title: '11. Limitation of Liability',
    content: `Nexus is not liable for the quality, safety, or legality of services offered by freelancers; the accuracy of listings; the ability of clients to pay; or the ability of freelancers to complete projects. In no event shall Nexus's total liability exceed the fees paid by you in the 12 months preceding the claim.`,
  },
  {
    title: '12. Termination',
    content: `Nexus reserves the right to suspend or terminate accounts that violate these Terms of Service, engage in fraudulent activity, or harm other users. You may close your account at any time, subject to any outstanding obligations.`,
  },
  {
    title: '13. Changes to Terms',
    content: `We may update these Terms of Service from time to time. We will notify you of significant changes by email or through the Platform. Continued use of the Platform after changes constitutes acceptance of the new terms.`,
  },
  {
    title: '14. Governing Law',
    content: `These Terms shall be governed by and construed in accordance with applicable law. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the competent courts.`,
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 bg-nexus-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="font-bold text-lg text-gray-900 dark:text-white">Nexus</span>
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Terms of Service</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Last updated: <span className="font-medium">January 1, 2025</span>
          </p>
          <p className="mt-4 text-gray-600 dark:text-gray-400 leading-relaxed">
            Please read these Terms of Service carefully before using the Nexus platform. These terms govern your use of our services and form a legally binding agreement between you and Nexus.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
          {sections.map((section) => (
            <div key={section.title} className="p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                {section.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
                {section.content}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 p-6 bg-nexus-50 dark:bg-nexus-950/30 rounded-2xl border border-nexus-100 dark:border-nexus-900/50">
          <p className="text-sm text-nexus-700 dark:text-nexus-300">
            If you have any questions about these Terms of Service, please contact us at{' '}
            <a href="mailto:legal@nexus.io" className="font-semibold underline">
              legal@nexus.io
            </a>
          </p>
        </div>

        <div className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-400">
          <Link href="/privacy" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            Privacy Policy
          </Link>
          <span>·</span>
          <Link href="/login" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            Login
          </Link>
          <span>·</span>
          <Link href="/register" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            Sign Up
          </Link>
        </div>
      </main>
    </div>
  );
}
