'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGetProjectQuery } from '@/store/api/projectsApi';
import { useAppSelector } from '@/store';
import { BidSubmitModal } from '@/components/projects/BidSubmitModal';
import { BidCard } from '@/components/projects/BidCard';
import { formatCurrency, formatDate, formatRelativeTime, getStatusColor } from '@/lib/utils';
import {
  Briefcase, Clock, DollarSign, Users, Globe, MapPin,
  Calendar, Tag, ChevronLeft, Send, Star, Shield, Loader2,
  CheckCircle, AlertTriangle, Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';

export default function ProjectDetailPage() {
  const t = useT();
  const { id } = useParams<{ id: string }>();
  const { user } = useAppSelector((s) => s.auth);
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'bids' | 'attachments'>('overview');

  const { data, isLoading, error } = useGetProjectQuery(id);
  const project = data?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 animate-spin text-nexus-500" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-4">
        <AlertTriangle className="w-12 h-12 text-red-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t.projectDetail.notFound}</h3>
        <Link href="/projects" className="text-nexus-600 hover:underline">{t.projectDetail.browseProjects}</Link>
      </div>
    );
  }

  const isOwner = user?.id === project.client?.id;
  const canBid = user?.role === 'freelancer' || user?.role === 'agency_owner';
  const hasAlreadyBid = project.bids?.some((b) => b.freelancer?.id === user?.id || b.agency?.owner?.id === user?.id);
  const isOpen = project.status === 'open';

  const TABS = [
    { key: 'overview', label: t.projectDetail.tabs.overview },
    { key: 'bids', label: t.projectDetail.tabs.bids },
    { key: 'attachments', label: t.projectDetail.tabs.attachments },
  ];

  const DETAILS = [
    { label: t.projectDetail.sidebar.category, value: project.category?.name, icon: Tag },
    { label: t.projectDetail.sidebar.experience, value: project.experienceRequired, icon: Star, capitalize: true },
    { label: t.projectDetail.sidebar.deadline, value: project.deadline ? formatDate(project.deadline) : t.projectDetail.sidebar.flexible, icon: Calendar },
    { label: t.projectDetail.sidebar.posted, value: formatDate(project.createdAt), icon: Clock },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white mb-5 transition-colors">
        <ChevronLeft className="w-4 h-4" /> {t.projectDetail.back}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Header Card */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium capitalize', getStatusColor(project.status))}>
                    {project.status}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 capitalize">
                    {project.type}
                  </span>
                  {project.isFeatured && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                      ⭐ {t.projectDetail.featured}
                    </span>
                  )}
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{project.title}</h1>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {t.projects.posted} {formatRelativeTime(project.createdAt)}</span>
                  <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {project.viewCount ?? 0} {t.myProjects.views}</span>
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {project._count?.bids ?? 0} {t.projects.bids}</span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-0 border-b border-gray-100 dark:border-gray-800 -mb-5 sm:-mb-6 mt-4">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={cn(
                    'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
                    activeTab === tab.key
                      ? 'border-nexus-500 text-nexus-600 dark:text-nexus-400'
                      : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
                  )}
                >
                  {tab.label}
                  {tab.key === 'bids' && project._count?.bids ? (
                    <span className="ml-1.5 px-1.5 py-0.5 bg-nexus-100 dark:bg-nexus-900/50 text-nexus-700 dark:text-nexus-400 rounded-full text-xs">
                      {project._count.bids}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 sm:p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t.projectDetail.description}</h2>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">{project.description}</p>
                </div>
              </div>

              {project.requirements && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 sm:p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t.projectDetail.requirements}</h2>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">{project.requirements}</p>
                </div>
              )}

              {project.skills && project.skills.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 sm:p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t.projectDetail.requiredSkills}</h2>
                  <div className="flex flex-wrap gap-2">
                    {project.skills.map((skill) => (
                      <span key={skill.id} className="px-3 py-1.5 bg-nexus-50 dark:bg-nexus-950/50 text-nexus-700 dark:text-nexus-300 border border-nexus-100 dark:border-nexus-900 rounded-full text-sm font-medium">
                        {skill.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {project.milestones && project.milestones.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 sm:p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t.projectDetail.proposedMilestones}</h2>
                  <div className="space-y-3">
                    {project.milestones.map((milestone, idx) => (
                      <div key={milestone.id} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <span className="w-7 h-7 rounded-full bg-nexus-100 dark:bg-nexus-900/50 text-nexus-600 dark:text-nexus-400 font-semibold text-xs flex items-center justify-center flex-shrink-0">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white text-sm">{milestone.title}</p>
                          {milestone.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{milestone.description}</p>
                          )}
                        </div>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white flex-shrink-0">
                          {formatCurrency(milestone.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'bids' && (
            <div className="space-y-4">
              {!isOwner && (
                <div className="p-4 bg-nexus-50 dark:bg-nexus-950/30 rounded-xl border border-nexus-100 dark:border-nexus-900 text-sm text-nexus-700 dark:text-nexus-300">
                  {t.projectDetail.onlyOwnerSeeBids}
                </div>
              )}
              {isOwner && project.bids && project.bids.length > 0 ? (
                project.bids.map((bid) => (
                  <BidCard key={bid.id} bid={bid} projectId={project.id} isOwner={isOwner} />
                ))
              ) : (
                <div className="text-center py-12 text-gray-400">{t.projectDetail.noBids}</div>
              )}
            </div>
          )}

          {activeTab === 'attachments' && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <p className="text-gray-400 text-sm text-center py-8">{t.projectDetail.noAttachments}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Budget & Action */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="mb-5">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t.projectDetail.budget}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(project.budgetMin)}
                {project.budgetMax && project.budgetMax !== project.budgetMin && (
                  <span> – {formatCurrency(project.budgetMax)}</span>
                )}
              </p>
              <p className="text-sm text-gray-400 capitalize mt-1">{project.type} {t.projectDetail.price}</p>
            </div>

            {canBid && isOpen && !hasAlreadyBid && !isOwner && (
              <button
                onClick={() => setBidModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-nexus-600 hover:bg-nexus-700 text-white rounded-lg font-medium transition-colors"
              >
                <Send className="w-4 h-4" />
                {t.projectDetail.submitBid}
              </button>
            )}
            {hasAlreadyBid && (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg text-green-700 dark:text-green-400 text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                {t.projectDetail.alreadyBid}
              </div>
            )}
            {isOwner && (
              <Link
                href={`/projects/${project.id}/edit`}
                className="w-full flex items-center justify-center gap-2 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {t.projectDetail.editProject}
              </Link>
            )}
          </div>

          {/* Project Details */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t.projectDetail.sidebar.title}</h3>
            <div className="space-y-3">
              {DETAILS.map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-500 dark:text-gray-400 w-24 flex-shrink-0">{item.label}</span>
                  <span className={cn('text-sm font-medium text-gray-900 dark:text-white', item.capitalize && 'capitalize')}>
                    {item.value || '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Client Info */}
          {project.client && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t.projectDetail.client.title}</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-nexus-100 dark:bg-nexus-900/50 flex items-center justify-center">
                  {project.client.avatar ? (
                    <img src={project.client.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <span className="text-nexus-600 dark:text-nexus-400 font-bold">
                      {project.client.firstName?.[0]}{project.client.lastName?.[0]}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {project.client.firstName} {project.client.lastName}
                  </p>
                  {project.client.clientProfile?.company && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{project.client.clientProfile.company}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2 text-sm">
                {project.client.clientProfile?.location && (
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <MapPin className="w-3.5 h-3.5" />
                    {project.client.clientProfile.location}
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <Briefcase className="w-3.5 h-3.5" />
                  {project.client.clientProfile?._count?.projects ?? 0} {t.projectDetail.client.projectsPosted}
                </div>
                {project.client.isVerified && (
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                    <Shield className="w-3.5 h-3.5" />
                    {t.projectDetail.client.verified}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {bidModalOpen && (
        <BidSubmitModal
          project={project}
          onClose={() => setBidModalOpen(false)}
        />
      )}
    </div>
  );
}
