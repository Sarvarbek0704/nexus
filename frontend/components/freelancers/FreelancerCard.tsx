import Link from 'next/link';
import { User } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Star, MapPin, Briefcase, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';

interface FreelancerCardProps {
  freelancer: User;
}

export function FreelancerCard({ freelancer }: FreelancerCardProps) {
  const profile = freelancer.freelancerProfile;
  const t = useT();

  return (
    <Link
      href={`/freelancers/${freelancer.id}`}
      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:shadow-card-hover hover:border-nexus-200 dark:hover:border-nexus-800 transition-all flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          <div className="w-14 h-14 rounded-full bg-nexus-100 dark:bg-nexus-900/50 flex items-center justify-center overflow-hidden">
            {freelancer.avatar ? (
              <img src={freelancer.avatar} alt="" className="w-14 h-14 object-cover" />
            ) : (
              <span className="text-nexus-600 dark:text-nexus-400 font-bold text-lg">
                {freelancer.firstName?.[0]}{freelancer.lastName?.[0]}
              </span>
            )}
          </div>
          {freelancer.isOnline && (
            <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-gray-900 rounded-full" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {freelancer.firstName} {freelancer.lastName}
            </h3>
            {freelancer.isVerified && (
              <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
            {profile?.title || 'Freelancer'}
          </p>
          <div className="flex items-center gap-1 mt-1">
            <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {Number(freelancer.averageRating || 0).toFixed(1)}
            </span>
            <span className="text-xs text-gray-400">({freelancer._count?.reviews ?? 0})</span>
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          {profile?.hourlyRate && (
            <>
              <p className="font-bold text-gray-900 dark:text-white">${profile.hourlyRate}</p>
              <p className="text-xs text-gray-400">{t.freelancers.perHour}</p>
            </>
          )}
        </div>
      </div>

      {/* Bio */}
      {profile?.bio && (
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
          {profile.bio}
        </p>
      )}

      {/* Skills */}
      {profile?.skills && profile.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {profile.skills.slice(0, 4).map((skill) => (
            <span key={skill.id} className="px-2 py-0.5 bg-nexus-50 dark:bg-nexus-950/50 text-nexus-700 dark:text-nexus-300 rounded-full text-xs font-medium">
              {skill.name}
            </span>
          ))}
          {profile.skills.length > 4 && (
            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-full text-xs">
              +{profile.skills.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400">
        <div className="flex items-center gap-3">
          {profile?.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {profile.location}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Briefcase className="w-3 h-3" /> {profile?.completedJobs ?? 0} {t.dashboard.completedJobs.toLowerCase()}
          </span>
        </div>
        <span className={cn(
          'flex items-center gap-1 font-medium capitalize',
          profile?.availability === 'full_time' ? 'text-emerald-500' :
          profile?.availability === 'part_time' ? 'text-yellow-500' :
          'text-gray-400'
        )}>
          <Clock className="w-3 h-3" />
          {(profile?.availability ?? 'contract').replace('_', ' ')}
        </span>
      </div>
    </Link>
  );
}
