import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from './baseApi';
import { ApiResponse, Skill, Category } from '@/types';

export const skillsApi = createApi({
  reducerPath: 'skillsApi',
  baseQuery,
  tagTypes: ['Skill', 'Category'],
  endpoints: (builder) => ({
    getSkills: builder.query<ApiResponse<Skill[]>, Record<string, any>>({
      query: (params) => ({ url: '/skills', params }),
      providesTags: ['Skill'],
    }),
    getCategories: builder.query<ApiResponse<Category[]>, void>({
      query: () => '/categories',
      providesTags: ['Category'],
    }),
    createSkill: builder.mutation<ApiResponse<Skill>, { name: string; categoryId: string }>({
      query: (body) => ({ url: '/skills', method: 'POST', body }),
      invalidatesTags: ['Skill'],
    }),
    createCategory: builder.mutation<ApiResponse<Category>, { name: string; description?: string }>({
      query: (body) => ({ url: '/categories', method: 'POST', body }),
      invalidatesTags: ['Category'],
    }),
  }),
});

export const {
  useGetSkillsQuery,
  useGetCategoriesQuery,
  useCreateSkillMutation,
  useCreateCategoryMutation,
} = skillsApi;
