'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useGetMyAgencyQuery,
  useCreateAgencyMutation,
  useUpdateAgencyMutation,
  useInviteMemberMutation,
  useRemoveMemberMutation,
} from '@/store/api/agenciesApi';
import { useGetSkillsQuery } from '@/store/api/skillsApi';
import { toast } from 'sonner';
import {
  Building2, Users, Settings, Plus, Trash2, Mail, Save,
  Loader2, Shield, Star, Briefcase, UserPlus, X, Globe,
  MapPin, Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/utils';

const agencySchema = z.object({
  name: z.string().min(2, 'Agency name required'),
  tagline: z.string().optional(),
  description: z.string().min(20, 'Description must be at least 20 characters').optional().or(z.literal('')),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  location: z.string().optional(),
  size: z.string().optional(),
});

type AgencyForm = z.infer<typeof agencySchema>;

const SIZE_OPTIONS = ['1-5', '6-15', '16-50', '50+'];

export default function MyAgencyPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'team' | 'settings'>('overview');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteTitle, setInviteTitle] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillSearch, setSkillSearch] = useState('');

  const { data, isLoading, refetch } = useGetMyAgencyQuery();
  const agency = data?.data;

  const { data: skillsData } = useGetSkillsQuery({ search: skillSearch, limit: 20 });
  const allSkills = skillsData?.data?.items ?? [];

  const [createAgency, { isLoading: creating }] = useCreateAgencyMutation();
  const [updateAgency, { isLoading: updating }] = useUpdateAgencyMutation();
  const [inviteMember, { isLoading: inviting }] = useInviteMemberMutation();
  const [removeMember, { isLoading: removing }] = useRemoveMemberMutation();

  const { register, handleSubmit, formState: { errors } } = useForm<AgencyForm>({
    resolver: zodResolver(agencySchema),
    defaultValues: {
      name: agency?.name ?? '',
      tagline: agency?.tagline ?? '',
      description: agency?.description ?? '',
      website: agency?.website ?? '',
      email: agency?.email ?? '',
      location: agency?.location ?? '',
      size: agency?.size ?? '',
    },
  });

  const handleSave = async (data: AgencyForm) => {
    try {
      if (agency) {
        await updateAgency({ id: agency.id, data: { ...data, skillIds: selectedSkills } }).unwrap();
        toast.success('Agency updated!');
      } else {
        await createAgency({ ...data, skillIds: selectedSkills }).unwrap();
        toast.success('Agency created!');
        refetch();
      }
    } catch (err: any) {
      toast.error(err?.data?.message ?? 'Failed to save agency');
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail || !agency) return;
    try {
      await inviteMember({ agencyId: agency.id, userId: inviteEmail, title: inviteTitle }).unwrap();
      toast.success('Invitation sent!');
      setInviteEmail('');
      setInviteTitle('');
    } catch (err: any) {
      toast.error(err?.data?.message ?? 'Failed to send invite');
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!agency) return;
    if (!confirm('Remove this member from the agency?')) return;
    try {
      await removeMember({ agencyId: agency.id, memberId }).unwrap();
      toast.success('Member removed');
    } catch (err: any) {
      toast.error(err?.data?.message ?? 'Failed to remove member');
    }
  };

  const toggleSkill = (id: string) => {
    setSelectedSkills((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : prev.length < 20 ? [...prev, id] : prev
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 animate-spin text-nexus-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {agency ? agency.name : 'Create Your Agency'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {agency ? 'Manage your agency profile and team' : 'Set up your agency to bid on projects as a team'}
          </p>
        </div>
        {agency && (
          <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1"><Users className="w-4 h-4" />{agency._count?.members ?? 0} members</span>
            {agency.rating > 0 && (
              <span className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />{agency.rating?.toFixed(1)}</span>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      {agency && (
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
          {(['overview', 'team', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize',
                activeTab === tab
                  ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              {tab === 'overview' && <Building2 className="w-4 h-4" />}
              {tab === 'team' && <Users className="w-4 h-4" />}
              {tab === 'settings' && <Settings className="w-4 h-4" />}
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* Overview Tab */}
      {(!agency || activeTab === 'overview') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-5">
                {agency ? 'Agency Information' : 'Create Agency'}
              </h3>
              <form onSubmit={handleSubmit(handleSave)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Agency Name *</label>
                    <input
                      {...register('name')}
                      className={cn('w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800 dark:border-gray-700', errors.name && 'border-red-400')}
                      placeholder="Acme Studios"
                    />
                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tagline</label>
                    <input
                      {...register('tagline')}
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800"
                      placeholder="We build great products"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                  <textarea
                    {...register('description')}
                    rows={4}
                    className={cn('w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800 dark:border-gray-700 resize-none', errors.description && 'border-red-400')}
                    placeholder="Tell clients about your agency, expertise, and how you work..."
                  />
                  {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Website</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        {...register('website')}
                        className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800"
                        placeholder="https://yoursite.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        {...register('email')}
                        className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800"
                        placeholder="agency@email.com"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        {...register('location')}
                        className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800"
                        placeholder="New York, USA"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Team Size</label>
                    <select
                      {...register('size')}
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800 dark:text-gray-300"
                    >
                      <option value="">Select size</option>
                      {SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s} members</option>)}
                    </select>
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Skills & Expertise ({selectedSkills.length}/20)
                  </label>
                  <input
                    value={skillSearch}
                    onChange={(e) => setSkillSearch(e.target.value)}
                    placeholder="Search skills..."
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800 mb-3"
                  />
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                    {allSkills.map((skill: any) => (
                      <button
                        key={skill.id}
                        type="button"
                        onClick={() => toggleSkill(skill.id)}
                        className={cn(
                          'px-3 py-1 rounded-full text-sm border transition-colors',
                          selectedSkills.includes(skill.id)
                            ? 'bg-nexus-600 text-white border-nexus-600'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-nexus-400'
                        )}
                      >
                        {skill.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={creating || updating}
                    className="flex items-center gap-2 px-5 py-2.5 bg-nexus-600 hover:bg-nexus-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
                  >
                    {(creating || updating) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {agency ? 'Save Changes' : 'Create Agency'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar Stats */}
          {agency && (
            <div className="space-y-5">
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Performance</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Projects Completed', value: agency._count?.contracts ?? 0, icon: Briefcase, color: 'text-nexus-500' },
                    { label: 'Team Members', value: agency._count?.members ?? 0, icon: Users, color: 'text-blue-500' },
                    { label: 'Reviews', value: agency._count?.reviews ?? 0, icon: Star, color: 'text-yellow-500' },
                    { label: 'Rating', value: agency.rating > 0 ? `${agency.rating?.toFixed(1)}/5` : 'New', icon: Award, color: 'text-green-500' },
                  ].map((stat) => (
                    <div key={stat.label} className="flex items-center gap-3">
                      <stat.icon className={cn('w-5 h-5 flex-shrink-0', stat.color)} />
                      <div className="flex-1 flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{stat.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {agency.isVerified && (
                <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                  <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Verified Agency</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">Your agency is officially verified</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Team Tab */}
      {agency && activeTab === 'team' && (
        <div className="space-y-5">
          {/* Invite Member */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5" /> Invite Member
            </h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="User ID or email..."
                className="flex-1 px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800"
              />
              <input
                value={inviteTitle}
                onChange={(e) => setInviteTitle(e.target.value)}
                placeholder="Job title (optional)"
                className="flex-1 px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800"
              />
              <button
                onClick={handleInvite}
                disabled={!inviteEmail || inviting}
                className="flex items-center gap-2 px-5 py-2.5 bg-nexus-600 hover:bg-nexus-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Send Invite
              </button>
            </div>
          </div>

          {/* Members List */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-5">
              Team Members ({agency._count?.members ?? 0})
            </h3>
            {agency.members && agency.members.length > 0 ? (
              <div className="space-y-3">
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
                          <span className="px-2 py-0.5 bg-nexus-100 dark:bg-nexus-900/50 text-nexus-600 dark:text-nexus-400 rounded text-xs font-medium">Owner</span>
                        )}
                        <span className={cn(
                          'px-2 py-0.5 rounded text-xs font-medium',
                          member.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                        )}>
                          {member.status}
                        </span>
                      </div>
                      {member.title && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{member.title}</p>}
                      <p className="text-xs text-gray-400 mt-0.5">Joined {formatRelativeTime(member.joinedAt)}</p>
                    </div>
                    {!member.isOwner && (
                      <button
                        onClick={() => handleRemove(member.id)}
                        disabled={removing}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center py-8">No team members yet. Invite people to join your agency.</p>
            )}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {agency && activeTab === 'settings' && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Notification Settings</h3>
            <div className="space-y-4">
              {[
                { label: 'New project invitations', checked: true },
                { label: 'Bid updates', checked: true },
                { label: 'Contract milestones', checked: true },
                { label: 'Payment notifications', checked: true },
                { label: 'Member activity', checked: false },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <p className="text-sm text-gray-700 dark:text-gray-300">{item.label}</p>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={item.checked} className="sr-only peer" />
                    <div className="w-10 h-5 bg-gray-200 dark:bg-gray-700 peer-checked:bg-nexus-600 rounded-full peer-focus:outline-none transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-red-200 dark:border-red-800 p-6">
            <h3 className="font-semibold text-red-600 dark:text-red-400 mb-4">Danger Zone</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Disband Agency</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Permanently delete your agency and remove all members</p>
              </div>
              <button className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                Disband Agency
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
