'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useGetUserProfileQuery } from '@/store/api/usersApi';
import { useGetFreelancerReviewsQuery, useGetRatingSummaryQuery } from '@/store/api/reviewsApi';
import { formatRelativeTime, formatDate } from '@/lib/utils';
import { Pagination } from '@/components/ui/Pagination';
import {
  ChevronLeft, Star, MapPin, Globe, Github, Linkedin, Briefcase,
  Clock, CheckCircle, Loader2, AlertTriangle, ExternalLink, Shield,
  DollarSign, Award, MessageSquare, Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const EXPERIENCE_COLORS: Record<string, string> = {
  entry: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  intermediate: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  expert: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
};

export default function FreelancerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'overview' | 'portfolio' | 'reviews'>('overview');
  const [reviewPage, setReviewPage] = useState(1);

  const { data, isLoading, error } = useGetUserProfileQuery(id);
  const user = data?.data;

  const { data: reviewsData } = useGetFreelancerReviewsQuery(
    { id, params: { page: reviewPage, limit: 5 } },
    { skip: activeTab !== 'reviews' }
  );
  const { data: summaryData } = useGetRatingSummaryQuery(id);

  const reviews = reviewsData?.data ?? [];
  const reviewMeta = reviewsData?.meta;
  // Use summary from API if it has data, otherwise fall back to denormalized user fields
  const rawSummary = summaryData?.data;
  const summary = {
    averageRating: rawSummary?.totalReviews > 0 ? Number(rawSummary.averageRating) : Number(user?.averageRating ?? 0),
    totalReviews: rawSummary?.totalReviews > 0 ? rawSummary.totalReviews : (user?.totalReviews ?? 0),
    breakdown: rawSummary?.breakdown,
    distribution: rawSummary?.distribution,
  };
  const profile = user?.freelancerProfile;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 animate-spin text-nexus-500" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-4">
        <AlertTriangle className="w-12 h-12 text-red-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Profile not found</h3>
        <Link href="/freelancers" className="text-nexus-600 hover:underline">Browse freelancers</Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Link href="/freelancers" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white mb-5 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to Freelancers
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-5">
          {/* Header Card */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-start gap-5 mb-5">
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 rounded-full bg-nexus-100 dark:bg-nexus-900/50 flex items-center justify-center overflow-hidden">
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="w-20 h-20 rounded-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-nexus-600 dark:text-nexus-400">
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </span>
                  )}
                </div>
                {profile?.availability === 'available' && (
                  <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {user.firstName} {user.lastName}
                  </h1>
                  {user.isVerified && (
                    <Shield className="w-5 h-5 text-emerald-500" />
                  )}
                </div>
                {profile?.title && (
                  <p className="text-gray-600 dark:text-gray-400 font-medium mb-2">{profile.title}</p>
                )}
                <div className="flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400">
                  {profile?.location && (
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{profile.location}</span>
                  )}
                  {summary?.averageRating > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                      <span className="font-medium text-gray-700 dark:text-gray-300">{Number(summary.averageRating || 0).toFixed(1)}</span>
                      <span>({summary.totalReviews} reviews)</span>
                    </span>
                  )}
                  {profile?.availability && (
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', profile.availability === 'available' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400')}>
                      {profile.availability === 'available' ? 'Available' : 'Not available'}
                    </span>
                  )}
                  {profile?.experienceLevel && (
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', EXPERIENCE_COLORS[profile.experienceLevel] ?? 'bg-gray-100 text-gray-600')}>
                      {profile.experienceLevel}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-0 border-b border-gray-100 dark:border-gray-800 -mb-6 mt-2">
              {(['overview', 'portfolio', 'reviews'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize -mb-px',
                    activeTab === tab
                      ? 'border-nexus-500 text-nexus-600 dark:text-nexus-400'
                      : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
                  )}
                >
                  {tab}
                  {tab === 'reviews' && summary?.totalReviews ? (
                    <span className="ml-1.5 px-1.5 py-0.5 bg-nexus-100 dark:bg-nexus-900/50 text-nexus-700 dark:text-nexus-400 rounded-full text-xs">
                      {summary.totalReviews}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>

          {/* Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {profile?.bio && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">About</h2>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
                </div>
              )}

              {profile?.skills && profile.skills.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill: any) => (
                      <span key={skill.id} className="px-3 py-1.5 bg-nexus-50 dark:bg-nexus-950/50 text-nexus-700 dark:text-nexus-300 border border-nexus-100 dark:border-nexus-900 rounded-full text-sm font-medium">
                        {skill.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Rating Breakdown */}
              {summary && summary.totalReviews > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Rating Breakdown</h2>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-5xl font-bold text-gray-900 dark:text-white">{Number(summary.averageRating || 0).toFixed(1)}</p>
                      <div className="flex items-center justify-center gap-0.5 mt-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={cn('w-4 h-4', s <= Math.round(summary.averageRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 dark:text-gray-700')} />
                        ))}
                      </div>
                      <p className="text-sm text-gray-400 mt-1">{summary.totalReviews} reviews</p>
                    </div>
                    <div className="flex-1 space-y-2">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = summary.breakdown?.[star] ?? 0;
                        const pct = summary.totalReviews > 0 ? (count / summary.totalReviews) * 100 : 0;
                        return (
                          <div key={star} className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 w-4">{star}</span>
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                              <div className="h-2 bg-yellow-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-gray-400 w-6">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Portfolio */}
          {activeTab === 'portfolio' && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">Portfolio</h2>
              {user.portfolio && user.portfolio.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {user.portfolio.map((item: any) => (
                    <div key={item.id} className="p-5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                      {item.imageUrl && (
                        <img src={item.imageUrl} alt={item.title} className="w-full h-40 object-cover rounded-lg mb-3" />
                      )}
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{item.title}</h4>
                      {item.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-3 leading-relaxed">{item.description}</p>
                      )}
                      {item.technologies && item.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {item.technologies.map((tech: string) => (
                            <span key={tech} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs">{tech}</span>
                          ))}
                        </div>
                      )}
                      {item.projectUrl && (
                        <a href={item.projectUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-nexus-600 dark:text-nexus-400 mt-3 hover:underline">
                          <ExternalLink className="w-3 h-3" /> View project
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm text-center py-10">No portfolio items yet.</p>
              )}
            </div>
          )}

          {/* Reviews */}
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {reviews.length > 0 ? reviews.map((review: any) => (
                <div key={review.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                        {review.reviewer?.avatar ? (
                          <img src={review.reviewer.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <span className="text-sm font-bold text-gray-600 dark:text-gray-400">{review.reviewer?.firstName?.[0]}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {review.reviewer?.firstName} {review.reviewer?.lastName}
                        </p>
                        <p className="text-xs text-gray-400">{formatRelativeTime(review.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={cn('w-4 h-4', s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 dark:text-gray-700')} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{review.comment}</p>
                  {review.response && (
                    <div className="mt-4 pl-4 border-l-2 border-nexus-200 dark:border-nexus-800">
                      <p className="text-xs font-medium text-nexus-600 dark:text-nexus-400 mb-1">Response from {user.firstName}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{review.response}</p>
                    </div>
                  )}
                </div>
              )) : (
                <div className="text-center py-12 text-gray-400">
                  <Star className="w-10 h-10 mx-auto mb-3 text-gray-200 dark:text-gray-700" />
                  <p>No reviews yet</p>
                </div>
              )}
              {reviewMeta && reviewMeta.totalPages > 1 && (
                <Pagination currentPage={reviewPage} totalPages={reviewMeta.totalPages} onPageChange={setReviewPage} />
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Quick Stats */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            {profile?.hourlyRate && (
              <div className="mb-5">
                <p className="text-sm text-gray-500 dark:text-gray-400">Hourly Rate</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  ${profile.hourlyRate}<span className="text-base font-normal text-gray-400">/hr</span>
                </p>
              </div>
            )}
            <div className="space-y-3">
              {[
                { label: 'Jobs Completed', value: user?.completedJobs ?? profile?._count?.contracts ?? 0, icon: CheckCircle, color: 'text-green-500' },
                { label: 'Total Reviews', value: summary?.totalReviews ?? 0, icon: Star, color: 'text-yellow-500' },
                { label: 'Member Since', value: formatDate(user.createdAt), icon: Calendar, color: 'text-blue-500' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <item.icon className={cn('w-4 h-4 flex-shrink-0', item.color)} />
                  <span className="text-sm text-gray-500 dark:text-gray-400 flex-1">{item.label}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{item.value}</span>
                </div>
              ))}
            </div>

            <button className="w-full mt-5 flex items-center justify-center gap-2 py-2.5 bg-nexus-600 hover:bg-nexus-700 text-white rounded-lg font-medium text-sm transition-colors">
              <MessageSquare className="w-4 h-4" /> Message
            </button>
          </div>

          {/* Social Links */}
          {(profile?.website || profile?.githubUrl || profile?.linkedinUrl) && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Links</h3>
              <div className="space-y-2">
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-nexus-600 dark:text-nexus-400 hover:underline">
                    <Globe className="w-4 h-4" /> {profile.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
                {profile.githubUrl && (
                  <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-nexus-600 dark:text-nexus-400 hover:underline">
                    <Github className="w-4 h-4" /> GitHub
                  </a>
                )}
                {profile.linkedinUrl && (
                  <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-nexus-600 dark:text-nexus-400 hover:underline">
                    <Linkedin className="w-4 h-4" /> LinkedIn
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
