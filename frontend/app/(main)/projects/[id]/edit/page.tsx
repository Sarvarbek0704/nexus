'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useGetProjectQuery, useUpdateProjectMutation } from '@/store/api/projectsApi';
import { useGetCategoriesQuery, useGetSkillsQuery } from '@/store/api/skillsApi';
import { useAppSelector } from '@/store';
import { toast } from 'sonner';
import { ChevronLeft, Loader2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';

const editSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').max(150),
  description: z.string().min(50, 'Description must be at least 50 characters').max(5000),
  requirements: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  experienceRequired: z.enum(['entry', 'intermediate', 'expert']),
  budgetMin: z.coerce.number().positive('Budget is required'),
  budgetMax: z.coerce.number().optional(),
  deadline: z.string().optional(),
  visibility: z.enum(['public', 'private', 'invite_only']),
});

type EditForm = z.infer<typeof editSchema>;

export default function EditProjectPage() {
  const t = useT();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAppSelector((s) => s.auth);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillSearch, setSkillSearch] = useState('');

  const { data, isLoading } = useGetProjectQuery(id);
  const [updateProject, { isLoading: saving }] = useUpdateProjectMutation();
  const { data: categoriesData } = useGetCategoriesQuery();
  const { data: skillsData } = useGetSkillsQuery({ search: skillSearch });

  const project = data?.data;
  const categories = categoriesData?.data ?? [];
  const skills = skillsData?.data ?? [];

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
  });

  useEffect(() => {
    if (project) {
      reset({
        title: project.title,
        description: project.description,
        requirements: project.requirements ?? '',
        categoryId: project.category?.id ?? '',
        experienceRequired: project.experienceRequired,
        budgetMin: project.budgetMin,
        budgetMax: project.budgetMax ?? undefined,
        deadline: project.deadline ? project.deadline.split('T')[0] : '',
        visibility: project.visibility,
      });
      setSelectedSkills(project.skills?.map((s: any) => s.id) ?? []);
    }
  }, [project, reset]);

  const toggleSkill = (skillId: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skillId) ? prev.filter((s) => s !== skillId) : [...prev, skillId].slice(0, 15),
    );
  };

  const onSubmit = async (data: EditForm) => {
    try {
      await updateProject({ id, body: { ...data, skills: selectedSkills } }).unwrap();
      toast.success(t.common.saved);
      router.push(`/projects/${id}`);
    } catch (err: any) {
      toast.error(err?.data?.message ?? t.common.error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 animate-spin text-nexus-500" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">{t.editProject.notFound}</p>
        <Link href="/projects/my" className="text-nexus-600 hover:underline mt-2 block">{t.editProject.backToMyProjects}</Link>
      </div>
    );
  }

  if (project.client?.id !== user?.id) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">{t.editProject.noPermission}</p>
        <Link href="/projects/my" className="text-nexus-600 hover:underline mt-2 block">{t.editProject.backToMyProjects}</Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <Link href={`/projects/${id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white mb-5 transition-colors">
        <ChevronLeft className="w-4 h-4" /> {t.editProject.back}
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.editProject.title}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{t.editProject.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.editProject.sections.basics}</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.postProject?.titleLabel ?? 'Title'} *</label>
            <input
              {...register('title')}
              className={cn('w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800 dark:border-gray-700', errors.title && 'border-red-400')}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.postProject?.descriptionLabel ?? 'Description'} *</label>
            <textarea
              {...register('description')}
              rows={6}
              className={cn('w-full px-4 py-3 text-sm border rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800 dark:border-gray-700 resize-none', errors.description && 'border-red-400')}
            />
            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.postProject?.requirementsLabel ?? 'Requirements'} ({t.common.optional})</label>
            <textarea
              {...register('requirements')}
              rows={4}
              className="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800 resize-none"
            />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.editProject.sections.details}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.projectDetail.sidebar.category} *</label>
              <select
                {...register('categoryId')}
                className={cn('w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800 dark:border-gray-700', errors.categoryId && 'border-red-400')}
              >
                <option value="">{t.projects.allCategories}...</option>
                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.categoryId && <p className="text-xs text-red-500 mt-1">{errors.categoryId.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.profilePage.professional.experienceLevel}</label>
              <select
                {...register('experienceRequired')}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800"
              >
                <option value="entry">{t.projects.entry}</option>
                <option value="intermediate">{t.projects.intermediate}</option>
                <option value="expert">{t.projects.expert}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.postProject?.visibilityLabel ?? 'Visibility'}</label>
              <select
                {...register('visibility')}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800"
              >
                <option value="public">{t.postProject?.visibilityOptions?.public ?? 'Public'}</option>
                <option value="private">{t.postProject?.visibilityOptions?.private ?? 'Private'}</option>
                <option value="invite_only">{t.postProject?.visibilityOptions?.invite_only ?? 'Invite Only'}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.projectDetail.sidebar.deadline}</label>
              <input
                {...register('deadline')}
                type="date"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.postProject?.skillsLabel ?? 'Skills'} ({selectedSkills.length}/15)</label>
            <input
              value={skillSearch}
              onChange={(e) => setSkillSearch(e.target.value)}
              placeholder={t.editProject.searchSkills}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800 mb-3"
            />
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
              {skills.map((skill: any) => (
                <button
                  key={skill.id}
                  type="button"
                  onClick={() => toggleSkill(skill.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                    selectedSkills.includes(skill.id)
                      ? 'bg-nexus-600 text-white border-nexus-600'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-nexus-400',
                  )}
                >
                  {skill.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.editProject.sections.budget}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.postProject?.budgetMinLabel ?? 'Budget Min ($)'} *</label>
              <input
                {...register('budgetMin')}
                type="number"
                step="0.01"
                className={cn('w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800 dark:border-gray-700', errors.budgetMin && 'border-red-400')}
              />
              {errors.budgetMin && <p className="text-xs text-red-500 mt-1">{errors.budgetMin.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.postProject?.budgetMaxLabel ?? 'Budget Max ($)'}</label>
              <input
                {...register('budgetMax')}
                type="number"
                step="0.01"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Link
            href={`/projects/${id}`}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {t.editProject.cancel}
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-nexus-600 hover:bg-nexus-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {t.editProject.save}
          </button>
        </div>
      </form>
    </div>
  );
}
