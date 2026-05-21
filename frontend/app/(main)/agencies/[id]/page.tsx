'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useGetAgencyQuery } from '@/store/api/agenciesApi';
import { useGetFreelancerReviewsQuery } from '@/store/api/reviewsApi';
import { formatRelativeTime, formatDate } from '@/lib/utils';
import {
  Building2, ChevronLeft, Star, Users, MapPin, Globe, Briefcase,
  Shield, Loader2, AlertTriangle, CheckCircle, ExternalLink, Mail,
  Calendar, Award, Code,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AgencyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'overview' | 'team' | 'reviews'>('overview');

  const { data, isLoading, error } = useGetAgencyQuery(id);
  const agency = data?.data;

  const { data: reviewsData } = useGetFreelancerReviewsQuery(
    { userId: agency?.owner?.id ?? '', params: { limit: 10 } },
    { skip: !agency?.owner?.id || activeTab !== 'reviews' }
  );
  const reviews = reviewsData?.data?.items ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 animate-spin text-nexus-500" />
      </div>
    );
  }

  if (error || !agency) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-4">
        <AlertTriangle className="w-12 h-12 text-red-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Agency not found</h3>
        <Link href="/agencies" className="text-nexus-600 hover:underline">Browse agencies</Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Link href="/agencies" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white mb-5 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to Agencies
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-5">
          {/* Header */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-start gap-5 mb-6">
              <div className="w-20 h-20 rounded-2xl bg-nexus-100 dark:bg-nexus-900/50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {agency.logo ? (
                  <img src={agency.logo} alt={agency.name} className="w-20 h-20 object-cover rounded-2xl" />
                ) : (
                  <Building2 className="w-10 h-10 text-nexus-600 dark:text-nexus-400" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{agency.name}</h1>
                  {agency.isVerified && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-medium">
                      <Shield className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>
                {agency.tagline && (
                  <p className="text-gray-500 dark:text-gray-400 mb-3">{agency.tagline}</p>
                )}
                <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                  {agency.location && (
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{agency.location}</span>
                  )}
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{agency._count?.members ?? 0} members</span>
                  <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" />{agency._count?.contracts ?? 0} projects done</span>
                  {agency.rating > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                      {agency.rating?.toFixed(1)} ({agency._count?.reviews ?? 0} reviews)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Skills */}
            {agency.skills && agency.skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {agency.skills.map((skill: any) => (
                  <span key={skill.id} className="px-3 py-1 bg-nexus-50 dark:bg-nexus-950/50 text-nexus-700 dark:text-nexus-300 border border-nexus-100 dark:border-nexus-900 rounded-full text-sm">
                    {skill.name}
                  </span>
                ))}
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-0 border-b border-gray-100 dark:border-gray-800 -mb-6 mt-2">
              {(['overview', 'team', 'reviews'] as const).map((tab) => (
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
                  {tab === 'reviews' && agency._count?.reviews ? (
                    <span className="ml-1.5 px-1.5 py-0.5 bg-nexus-100 dark:bg-nexus-900/50 text-nexus-700 dark:text-nexus-400 rounded-full text-xs">
                      {agency._count.reviews}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">About</h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                  {agency.description || 'No description provided.'}
                </p>
              </div>

              {agency.portfolio && agency.portfolio.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Portfolio</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {agency.portfolio.map((item: any) => (
                      <div key={item.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">{item.title}</h4>
                        {item.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{item.description}</p>
                        )}
                        {item.url && (
                          <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-nexus-600 dark:text-nexus-400 mt-2 hover:underline">
                            <ExternalLink className="w-3 h-3" /> View project
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'team' && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">Team Members</h2>
              {agency.members && agency.members.length > 0 ? (
                <div className="space-y-4">
                  {agency.members.map((member: any) => (
                    <div key={member.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div className="w-12 h-12 rounded-full bg-nexus-100 dark:bg-nexus-900/50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {member.user?.avatar ? (
                          <img src={member.user.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <span className="text-nexus-600 dark:text-nexus-400 font-bold text-sm">
                            {member.user?.firstName?.[0]}{member.user?.lastName?.[0]}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 dark:text-white text-sm">
                            {member.user?.firstName} {member.user?.lastName}
                          </p>
                          {member.isOwner && (
                            <span className="px-2 py-0.5 bg-nexus-100 dark:bg-nexus-900/50 text-nexus-600 dark:text-nexus-400 rounded text-xs font-medium">
                              Owner
                            </span>
                          )}
                        </div>
                        {member.title && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{member.title}</p>
                        )}
                      </div>
                      <Link href={`/freelancers/${member.user?.id}`} className="text-xs text-nexus-600 dark:text-nexus-400 hover:underline">
                        View profile
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm text-center py-8">No team members listed.</p>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {reviews.length > 0 ? reviews.map((review: any) => (
                <div key={review.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <span className="text-sm font-bold text-gray-600 dark:text-gray-400">
                          {review.reviewer?.firstName?.[0]}
                        </span>
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
                </div>
              )) : (
                <div className="text-center py-12 text-gray-400">
                  <Star className="w-10 h-10 mx-auto mb-3 text-gray-200 dark:text-gray-700" />
                  <p>No reviews yet</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Agency Details</h3>
            <div className="space-y-3 text-sm">
              {agency.website && (
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <a href={agency.website} target="_blank" rel="noopener noreferrer" className="text-nexus-600 dark:text-nexus-400 hover:underline truncate">
                    {agency.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              {agency.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">{agency.email}</span>
                </div>
              )}
              {agency.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">{agency.location}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">Since {formatDate(agency.createdAt)}</span>
              </div>
              {agency.size && (
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">{agency.size} team size</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Projects', value: agency._count?.contracts ?? 0, icon: Briefcase },
                { label: 'Members', value: agency._count?.members ?? 0, icon: Users },
                { label: 'Rating', value: agency.rating > 0 ? agency.rating?.toFixed(1) : 'New', icon: Star },
                { label: 'Reviews', value: agency._count?.reviews ?? 0, icon: Award },
              ].map((stat) => (
                <div key={stat.label} className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <stat.icon className="w-5 h-5 text-nexus-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Owner */}
          {agency.owner && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Agency Owner</h3>
              <Link href={`/freelancers/${agency.owner.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="w-12 h-12 rounded-full bg-nexus-100 dark:bg-nexus-900/50 flex items-center justify-center overflow-hidden">
                  {agency.owner.avatar ? (
                    <img src={agency.owner.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <span className="text-nexus-600 dark:text-nexus-400 font-bold">
                      {agency.owner.firstName?.[0]}{agency.owner.lastName?.[0]}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    {agency.owner.firstName} {agency.owner.lastName}
                  </p>
                  <p className="text-xs text-nexus-600 dark:text-nexus-400">View profile →</p>
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
