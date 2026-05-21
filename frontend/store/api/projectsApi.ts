import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import Cookies from 'js-cookie';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const projectsApi = createApi({
  reducerPath: 'projectsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers) => {
      const token = Cookies.get('accessToken') || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Project'],
  endpoints: (builder) => ({
    getProjects: builder.query<any, any>({
      query: (params) => ({ url: '/projects', params }),
      providesTags: ['Project'],
    }),
    getProject: builder.query<any, string>({
      query: (id) => `/projects/${id}`,
      providesTags: ['Project'],
    }),
    getMyProjects: builder.query<any, any>({
      query: (params) => ({ url: '/projects/my', params }),
      providesTags: ['Project'],
    }),
    createProject: builder.mutation<any, any>({
      query: (body) => ({ url: '/projects', method: 'POST', body }),
      invalidatesTags: ['Project'],
    }),
    updateProject: builder.mutation<any, { id: string; body: any }>({
      query: ({ id, body }) => ({ url: `/projects/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Project'],
    }),
    deleteProject: builder.mutation<any, string>({
      query: (id) => ({ url: `/projects/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Project'],
    }),
    closeProject: builder.mutation<any, string>({
      query: (id) => ({ url: `/projects/${id}/close`, method: 'POST' }),
      invalidatesTags: ['Project'],
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useGetProjectQuery,
  useGetMyProjectsQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useCloseProjectMutation,
} = projectsApi;
