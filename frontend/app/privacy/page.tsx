import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { NexusMark } from '@/components/shared/AppLogo';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Nexus Privacy Policy — how we collect, use, and protect your personal information.',
};

const sections = [
  {
    title: '1. Information We Collect',
    content: `We collect information you provide directly, including: name, email address, password, country, profile photo, professional experience, portfolio items, payment information, and communications sent through the platform. We also automatically collect usage data such as IP addresses, browser type, pages visited, and device information.`,
  },
  {
    title: '2. How We Use Your Information',
    content: `We use your information to: create and manage your account, facilitate connections between clients and freelancers, process payments and manage escrow, send transactional emails (verification codes, contract updates, payment notifications), improve our platform and user experience, detect and prevent fraud or abuse, and comply with legal obligations.`,
  },
  {
    title: '3. Information Sharing',
    content: `We do not sell your personal information. We share information only: with the other party in a contract (client sees freelancer profile; freelancer sees client's project details), with payment processors to handle transactions, with service providers who help us operate the platform (email delivery, cloud hosting), or when required by law or to protect our rights and users' safety.`,
  },
  {
    title: '4. Profile Visibility',
    content: `Freelancer profiles, including name, skills, portfolio, and ratings, are publicly visible to help clients find the right talent. Clients' company names and project descriptions are visible to freelancers when browsing bids. Your email address, phone number, and payment details are never shown to other users.`,
  },
  {
    title: '5. Data Security',
    content: `We use industry-standard security measures including encrypted HTTPS connections, bcrypt password hashing, and secure token-based authentication. Sensitive fields (passwords, reset tokens, OTP codes) are never stored in plain text. However, no system is completely secure, and we cannot guarantee absolute security.`,
  },
  {
    title: '6. Cookies & Tracking',
    content: `We use cookies and local storage to maintain your login session (access tokens and refresh tokens). We may use analytics tools to understand usage patterns. You can control cookies through your browser settings, though disabling them may affect platform functionality.`,
  },
  {
    title: '7. Third-Party Services',
    content: `We integrate with third-party services including Google and GitHub for OAuth login. If you use these integrations, your use is also governed by their respective privacy policies. We only request the minimum information necessary (name, email, avatar) from these providers.`,
  },
  {
    title: '8. Data Retention',
    content: `We retain your account information for as long as your account is active or as needed to provide services. If you close your account, we will delete or anonymize your personal data within 90 days, except where retention is required by law or to resolve disputes.`,
  },
  {
    title: '9. Your Rights',
    content: `You have the right to: access the personal information we hold about you, correct inaccurate information, request deletion of your account and data, export your data, and opt out of non-essential communications. To exercise these rights, contact us at privacy@nexus.io.`,
  },
  {
    title: '10. Children\'s Privacy',
    content: `Nexus is not directed at children under the age of 18. We do not knowingly collect personal information from children. If we learn we have collected information from a child, we will promptly delete it.`,
  },
  {
    title: '11. International Transfers',
    content: `Your information may be processed and stored in countries other than your own. By using Nexus, you consent to the transfer of your information to countries that may have different data protection laws than your country of residence.`,
  },
  {
    title: '12. Changes to This Policy',
    content: `We may update this Privacy Policy from time to time. We will notify you of significant changes by email or through the platform at least 14 days before the changes take effect. Continued use of the platform after changes constitutes acceptance of the updated policy.`,
  },
  {
    title: '13. Contact Us',
    content: `If you have questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact our Privacy Team at privacy@nexus.io. We aim to respond to all privacy inquiries within 5 business days.`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 bg-nexus-600 rounded-lg flex items-center justify-center">
              <NexusMark className="w-5 h-5 text-white" />
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Privacy Policy</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Last updated: <span className="font-medium">January 1, 2025</span>
          </p>
          <p className="mt-4 text-gray-600 dark:text-gray-400 leading-relaxed">
            At Nexus, we are committed to protecting your personal information and your right to privacy. This policy explains what information we collect, how we use it, and what rights you have in relation to it.
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
            Questions about your privacy? Contact us at{' '}
            <a href="mailto:privacy@nexus.io" className="font-semibold underline">
              privacy@nexus.io
            </a>
          </p>
        </div>

        <div className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-400">
          <Link href="/terms" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            Terms of Service
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
