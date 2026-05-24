import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import Cookies from 'js-cookie';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const skillsApi = createApi({
  reducerPath: 'skillsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers) => {
      const token = Cookies.get('accessToken') || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Skill', 'Category'],
  endpoints: (builder) => ({
    getSkills: builder.query<any, any>({
      query: (params) => ({ url: '/skills', params }),
      providesTags: ['Skill'],
    }),
    getCategories: builder.query<any, void>({
      query: () => '/categories',
      providesTags: ['Category'],
    }),
    createSkill: builder.mutation<any, any>({
      query: (body) => ({ url: '/skills', method: 'POST', body }),
      invalidatesTags: ['Skill'],
    }),
    createCategory: builder.mutation<any, any>({
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
