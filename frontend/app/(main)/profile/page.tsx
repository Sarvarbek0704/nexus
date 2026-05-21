"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAppSelector, useAppDispatch } from "@/store";
import { updateUser } from "@/store/slices/authSlice";
import {
  useUpdateProfileMutation,
  useUpdateFreelancerProfileMutation,
  useUpdateClientProfileMutation,
} from "@/store/api/usersApi";
import { useGetSkillsQuery } from "@/store/api/skillsApi";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  User,
  Briefcase,
  Star,
  CheckCircle,
  MapPin,
  Globe,
  Github,
  Linkedin,
  Camera,
  Loader2,
  Save,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

const profileSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  bio: z.string().max(500).optional(),
});

const freelancerSchema = z.object({
  title: z.string().min(1, "Title required").max(100),
  bio: z.string().min(50, "Bio must be at least 50 characters").max(2000),
  hourlyRate: z.coerce.number().positive().optional(),
  experienceLevel: z.enum(["entry", "intermediate", "expert"]),
  availability: z.enum(["full_time", "part_time", "contract", "not_available"]),
  location: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  githubUrl: z.string().url().optional().or(z.literal("")),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
});

type FreelancerForm = z.infer<typeof freelancerSchema>;

const TABS = ["Profile", "Professional", "Portfolio", "Reviews"];

export default function ProfilePage() {
  const { user } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState("Profile");
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    user?.freelancerProfile?.skills?.map((s) => s.id) ?? [],
  );

  const averageRating = (() => {
    const value = user?.averageRating;
    const parsed = typeof value === "number" ? value : Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
  })();

  const [updateProfile, { isLoading: savingProfile }] =
    useUpdateProfileMutation();
  const [updateFreelancer, { isLoading: savingFreelancer }] =
    useUpdateFreelancerProfileMutation();
  const { data: skillsData } = useGetSkillsQuery({});

  const skills = skillsData?.data ?? [];

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      bio: user?.bio ?? "",
    },
  });

  const freelancerForm = useForm<FreelancerForm>({
    resolver: zodResolver(freelancerSchema),
    defaultValues: {
      title: user?.freelancerProfile?.title ?? "",
      bio: user?.freelancerProfile?.bio ?? "",
      hourlyRate: user?.freelancerProfile?.hourlyRate ?? undefined,
      experienceLevel:
        user?.freelancerProfile?.experienceLevel ?? "intermediate",
      availability: user?.freelancerProfile?.availability ?? "full_time",
      location: user?.freelancerProfile?.location ?? "",
      website: user?.freelancerProfile?.website ?? "",
      githubUrl: user?.freelancerProfile?.githubUrl ?? "",
      linkedinUrl: user?.freelancerProfile?.linkedinUrl ?? "",
    },
  });

  const handleProfileSave = async (data: any) => {
    try {
      const result = await updateProfile(data).unwrap();
      dispatch(updateUser(result.data));
      toast.success("Profile updated!");
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Update failed");
    }
  };

  const handleFreelancerSave = async (data: FreelancerForm) => {
    try {
      await updateFreelancer({ ...data, skills: selectedSkills }).unwrap();
      toast.success("Professional profile updated!");
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Update failed");
    }
  };

  const toggleSkill = (skillId: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skillId)
        ? prev.filter((s) => s !== skillId)
        : [...prev, skillId].slice(0, 20),
    );
  };

  if (!user) return null;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-start gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-nexus-100 dark:bg-nexus-900/50 flex items-center justify-center overflow-hidden">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt=""
                  className="w-24 h-24 object-cover"
                />
              ) : (
                <span className="text-nexus-600 dark:text-nexus-400 font-bold text-3xl">
                  {user.firstName?.[0]}
                  {user.lastName?.[0]}
                </span>
              )}
            </div>
            <button className="absolute bottom-0 right-0 p-1.5 bg-nexus-600 text-white rounded-full hover:bg-nexus-700 transition-colors">
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {user.firstName} {user.lastName}
              </h1>
              {user.isVerified && (
                <CheckCircle className="w-5 h-5 text-blue-500" />
              )}
            </div>
            <p className="text-gray-500 dark:text-gray-400 mt-0.5 capitalize">
              {user.role.replace("_", " ")}
            </p>
            {user.freelancerProfile?.title && (
              <p className="text-gray-700 dark:text-gray-300 mt-1">
                {user.freelancerProfile.title}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                {averageRating.toFixed(1)} rating
              </span>
              <span className="flex items-center gap-1">
                <Briefcase className="w-4 h-4" />
                {user.freelancerProfile?.completedJobs ?? 0} jobs completed
              </span>
              {user.freelancerProfile?.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {user.freelancerProfile.location}
                </span>
              )}
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold text-nexus-600 dark:text-nexus-400">
              {formatCurrency(Number(user.walletBalance))}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">Wallet Balance</p>
            <Link
              href="/settings"
              className="mt-3 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <Settings className="w-4 h-4" /> Settings
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-5 py-2 rounded-lg text-sm font-medium transition-colors",
              activeTab === tab
                ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300",
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === "Profile" && (
        <form
          onSubmit={profileForm.handleSubmit(handleProfileSave)}
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-5"
        >
          <h2 className="font-semibold text-gray-900 dark:text-white">
            Basic Information
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                First Name
              </label>
              <input
                {...profileForm.register("firstName")}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Last Name
              </label>
              <input
                {...profileForm.register("lastName")}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Email
            </label>
            <input
              value={user.email}
              disabled
              className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 cursor-not-allowed"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingProfile}
              className="flex items-center gap-2 px-5 py-2.5 bg-nexus-600 hover:bg-nexus-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
            >
              {savingProfile ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Changes
            </button>
          </div>
        </form>
      )}

      {/* Professional Tab (Freelancer) */}
      {activeTab === "Professional" && user.role === "freelancer" && (
        <form
          onSubmit={freelancerForm.handleSubmit(handleFreelancerSave)}
          className="space-y-5"
        >
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-5">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Professional Details
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Professional Title
              </label>
              <input
                {...freelancerForm.register("title")}
                placeholder="e.g. Full-Stack Developer | React & Node.js Expert"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Professional Bio
              </label>
              <textarea
                {...freelancerForm.register("bio")}
                rows={5}
                placeholder="Describe your expertise, experience, and what makes you unique..."
                className="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800 resize-none"
              />
              {freelancerForm.formState.errors.bio && (
                <p className="text-xs text-red-500 mt-1">
                  {freelancerForm.formState.errors.bio.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Hourly Rate ($)
                </label>
                <input
                  {...freelancerForm.register("hourlyRate")}
                  type="number"
                  placeholder="50"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Experience Level
                </label>
                <select
                  {...freelancerForm.register("experienceLevel")}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800"
                >
                  <option value="entry">Entry</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Availability
                </label>
                <select
                  {...freelancerForm.register("availability")}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800"
                >
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="not_available">Not Available</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Location
                </label>
                <input
                  {...freelancerForm.register("location")}
                  placeholder="New York, USA"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Website
                </label>
                <input
                  {...freelancerForm.register("website")}
                  type="url"
                  placeholder="https://yoursite.com"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  GitHub URL
                </label>
                <input
                  {...freelancerForm.register("githubUrl")}
                  type="url"
                  placeholder="https://github.com/username"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  LinkedIn URL
                </label>
                <input
                  {...freelancerForm.register("linkedinUrl")}
                  type="url"
                  placeholder="https://linkedin.com/in/username"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-nexus-500 bg-white dark:bg-gray-800"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
              Skills ({selectedSkills.length}/20)
            </h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <button
                  key={skill.id}
                  type="button"
                  onClick={() => toggleSkill(skill.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                    selectedSkills.includes(skill.id)
                      ? "bg-nexus-600 text-white border-nexus-600"
                      : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-nexus-400",
                  )}
                >
                  {skill.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingFreelancer}
              className="flex items-center gap-2 px-5 py-2.5 bg-nexus-600 hover:bg-nexus-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
            >
              {savingFreelancer ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Professional Profile
            </button>
          </div>
        </form>
      )}

      {activeTab === "Portfolio" && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8 text-center">
          <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Portfolio Coming Soon
          </h3>
          <p className="text-gray-400 text-sm">Showcase your best work here.</p>
        </div>
      )}

      {activeTab === "Reviews" && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8 text-center">
          <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Your Reviews
          </h3>
          <p className="text-gray-400 text-sm">
            Client reviews will appear here after completing projects.
          </p>
        </div>
      )}
    </div>
  );
}
