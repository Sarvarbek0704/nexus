'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateProjectMutation } from '@/store/api/projectsApi';
import { useGetCategoriesQuery, useGetSkillsQuery } from '@/store/api/skillsApi';
import { toast } from 'sonner';
import { Plus, Trash2, ChevronLeft, Loader2, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';

const milestoneSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  amount: z.coerce.number().positive(),
  durationDays: z.coerce.number().int().positive(),
});

const projectSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').max(150),
  description: z.string().min(50, 'Description must be at least 50 characters').max(5000),
  requirements: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  type: z.enum(['fixed', 'hourly']),
  experienceRequired: z.enum(['entry', 'intermediate', 'expert']),
  budgetMin: z.coerce.number().positive('Budget is required'),
  budgetMax: z.coerce.number().optional(),
  deadline: z.string().optional(),
  visibility: z.enum(['public', 'private', 'invite_only']).default('public'),
  skills: z.array(z.string()).min(1, 'Add at least one skill').max(15),
  milestones: z.array(milestoneSchema).optional(),
});

type ProjectForm = z.infer<typeof projectSchema>;

// STEPS is now derived inside the component from t.projects.post.steps

export default function PostProjectPage() {
  const router = useRouter();
  const t = useT();
  const [step, setStep] = useState(0);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillSearch, setSkillSearch] = useState('');

  const [createProject, { isLoading }] = useCreateProjectMutation();
  const { data: categoriesData } = useGetCategoriesQuery();
  const { data: skillsData } = useGetSkillsQuery({ search: skillSearch });

  const categories = categoriesData?.data ?? [];
  const skills = skillsData?.data ?? [];

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<ProjectForm>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      type: 'fixed',
      experienceRequired: 'intermediate',
      visibility: 'public',
      skills: [],
      milestones: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'milestones' });
  const projectType = watch('type');
  const watchedValues = watch();
  const STEPS = t.projects.post.steps as unknown as string[];

  const toggleSkill = (skillId: string) => {
    const updated = selectedSkills.includes(skillId)
      ? selectedSkills.filter((s) => s !== skillId)
      : [...selectedSkills, skillId].slice(0, 15);
    setSelectedSkills(updated);
    setValue('skills', updated);
  };

  const onSubmit = async (data: ProjectForm) => {
    try {
      const { skills: _skills, ...rest } = data;
      const payload: any = {
        ...rest,
        skillIds: selectedSkills,
        deadline: data.deadline ? new Date(data.deadline).toISOString() : undefined,
        requirements: data.requirements
          ? data.requirements.split('\n').filter((l) => l.trim())
          : undefined,
      };
      const result = await createProject(payload).unwrap();
      toast.success('Project posted successfully!');
      router.push(`/projects/${result.data.id}`);
    } catch (err: any) {
      toast.error(err?.data?.message ?? 'Failed to post project');
    }
  };

  const onValidationError = (errors: any) => {
    // Navigate to the first step that has an error
    const step0Fields = ['title', 'description'];
    const step1Fields = ['categoryId', 'skills'];
    const step2Fields = ['budgetMin', 'budgetMax', 'deadline'];

    if (step0Fields.some((f) => errors[f])) {
      setStep(0);
      toast.error('Please fill in the project basics first.');
    } else if (step1Fields.some((f) => errors[f])) {
      setStep(1);
      toast.error('Please select a category and at least one skill.');
    } else if (step2Fields.some((f) => errors[f])) {
      setStep(2);
      toast.error('Please set the budget.');
    } else {
      toast.error('Please complete all required fields.');
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white mb-5 transition-colors">
        <ChevronLeft className="w-4 h-4" /> {t.projects.post.back}
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.projects.post.title}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{t.projects.post.subtitle}</p>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-0 mb-8">
        {STEPS.map((s, idx) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <button
              onClick={() => idx < step && setStep(idx)}
              className={cn(
                'flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors flex-shrink-0',
                idx < step ? 'bg-nexus-600 text-white cursor-pointer' : '',
                idx === step ? 'bg-nexus-600 text-white ring-4 ring-nexus-100 dark:ring-nexus-900' : '',
                idx > step ? 'bg-gray-100 dark:bg-gray-800 text-gray-400' : '',
              )}
            >
              {idx < step ? '✓' : idx + 1}
            </button>
            <span className={cn('text-xs ml-2 font-medium hidden sm:block', idx === step ? 'text-nexus-600' : 'text-gray-400')}>
              {s}
            </span>
            {idx < STEPS.length - 1 && (
              <div className={cn('flex-1 h-0.5 mx-3', idx < step ? 'bg-nexus-600' : 'bg-gray-200 dark:bg-gray-700')} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit, onValidationError)}>
        {/* Step 0: Basics */}
        {step === 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.projects.post.basics}</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.projects.post.titleLabel}</label>
              <input
                {...register('title')}
                placeholder="e.g. Build a full-stack e-commerce platform with React and Node.js"
                className={cn('w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:border-nexus-500 focus:ring-1 focus:ring-nexus-500 bg-white dark:bg-gray-800 dark:border-gray-700', errors.title && 'border-red-400')}
              />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.projects.post.descLabel}</label>
              <textarea
                {...register('description')}
                rows={6}
                placeholder="Describe your project in detail. Include the problem you're trying to solve, key features, and any technical specifications..."
                className={cn('w-full px-4 py-3 text-sm border rounded-lg focus:outline-none focus:border-nexus-500 focus:ring-1 focus:ring-nexus-500 bg-white dark:bg-gray-800 dark:border-gray-700 resize-none', errors.description && 'border-red-400')}
              />
              {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.projects.post.reqLabel}</label>
              <textarea
                {...register('requirements')}
                rows={4}
                placeholder="List any specific requirements, preferred technologies, or qualifications..."
                className="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 focus:ring-1 focus:ring-nexus-500 bg-white dark:bg-gray-800 resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 1: Details */}
        {step === 1 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.projects.post.details}</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.projects.post.category}</label>
                <select
                  {...register('categoryId')}
                  className={cn('w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800 dark:border-gray-700', errors.categoryId && 'border-red-400')}
                >
                  <option value="">{t.projects.post.selectCategory}</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {errors.categoryId && <p className="text-xs text-red-500 mt-1">{errors.categoryId.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.projects.post.experience}</label>
                <select
                  {...register('experienceRequired')}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800 capitalize"
                >
                  <option value="entry">Entry Level</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.projects.post.type}</label>
                <div className="flex gap-2">
                  {['fixed', 'hourly'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setValue('type', type as 'fixed' | 'hourly')}
                      className={cn(
                        'flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors capitalize',
                        watchedValues.type === type
                          ? 'bg-nexus-600 text-white border-nexus-600'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-nexus-400'
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.projects.post.visibility}</label>
                <select
                  {...register('visibility')}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800"
                >
                  <option value="public">{t.projects.post.public}</option>
                  <option value="private">{t.projects.post.private}</option>
                  <option value="invite_only">{t.projects.post.inviteOnly}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.projects.post.skills} ({selectedSkills.length}/15)</label>
              <input
                value={skillSearch}
                onChange={(e) => setSkillSearch(e.target.value)}
                placeholder={t.projects.post.searchSkills}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800 mb-3"
              />
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto scrollbar-thin">
                {skills.map((skill) => (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => toggleSkill(skill.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                      selectedSkills.includes(skill.id)
                        ? 'bg-nexus-600 text-white border-nexus-600'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-nexus-400'
                    )}
                  >
                    {skill.name}
                  </button>
                ))}
              </div>
              {errors.skills && <p className="text-xs text-red-500 mt-1">{errors.skills.message}</p>}
            </div>
          </div>
        )}

        {/* Step 2: Budget */}
        {step === 2 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.projects.post.budgetTitle}</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {projectType === 'fixed' ? t.projects.post.budgetMin : t.projects.post.hourlyMin}
                </label>
                <input
                  {...register('budgetMin')}
                  type="number"
                  step="0.01"
                  placeholder="500"
                  className={cn('w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800 dark:border-gray-700', errors.budgetMin && 'border-red-400')}
                />
                {errors.budgetMin && <p className="text-xs text-red-500 mt-1">{errors.budgetMin.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {projectType === 'fixed' ? t.projects.post.budgetMax : t.projects.post.hourlyMax}
                </label>
                <input
                  {...register('budgetMax')}
                  type="number"
                  step="0.01"
                  placeholder="2000"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.projects.post.deadlineLabel}</label>
              <input
                {...register('deadline')}
                type="date"
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800"
              />
            </div>
          </div>
        )}

        {/* Step 3: Milestones */}
        {step === 3 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.projects.post.milestonesTitle}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t.projects.post.milestonesSub}</p>
            </div>

            {fields.map((field, idx) => (
              <div key={field.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t.projects.post.milestoneN} {idx + 1}</span>
                  <button type="button" onClick={() => remove(idx)} className="text-red-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <input
                      {...register(`milestones.${idx}.title`)}
                      placeholder="Milestone title"
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      {...register(`milestones.${idx}.description`)}
                      placeholder="Description (optional)"
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800"
                    />
                  </div>
                  <input
                    {...register(`milestones.${idx}.amount`)}
                    type="number"
                    placeholder="Amount ($)"
                    className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800"
                  />
                  <input
                    {...register(`milestones.${idx}.durationDays`)}
                    type="number"
                    placeholder="Duration (days)"
                    className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800"
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => append({ title: '', amount: 0, durationDays: 7 })}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-500 hover:border-nexus-400 hover:text-nexus-600 transition-colors"
            >
              <Plus className="w-4 h-4" /> {t.projects.post.addMilestone}
            </button>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.projects.post.review}</h2>

            <div className="space-y-3 text-sm">
              <div className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <Briefcase className="w-5 h-5 text-nexus-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{watchedValues.title || '—'}</p>
                  <p className="text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{watchedValues.description || '—'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: t.projects.post.type2, value: watchedValues.type },
                  { label: t.projects.post.experienceLabel, value: watchedValues.experienceRequired },
                  { label: t.projects.post.budgetLabel, value: watchedValues.budgetMin ? `$${watchedValues.budgetMin}${watchedValues.budgetMax ? ` – $${watchedValues.budgetMax}` : ''}` : '—' },
                  { label: t.projects.post.skills.replace(' *', ''), value: `${selectedSkills.length} ${t.projects.post.skillsSelected}` },
                ].map((item) => (
                  <div key={item.label} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <p className="text-xs text-gray-400">{item.label}</p>
                    <p className="font-medium text-gray-900 dark:text-white capitalize mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-gray-400 text-center">
              {t.projects.post.termsNote}
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t.projects.post.prev}
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
              className="px-5 py-2.5 bg-nexus-600 hover:bg-nexus-700 text-white rounded-lg font-medium text-sm transition-colors"
            >
              {t.projects.post.next}
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-nexus-600 hover:bg-nexus-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Briefcase className="w-4 h-4" />}
              {t.projects.post.submit}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

