import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from './baseApi';
import { ApiResponse, PaginatedResponse, Project } from '@/types';

export const projectsApi = createApi({
  reducerPath: 'projectsApi',
  baseQuery,
  tagTypes: ['Project'],
  endpoints: (builder) => ({
    getProjects: builder.query<ApiResponse<PaginatedResponse<Project>>, Record<string, any>>({
      query: (params) => ({ url: '/projects', params }),
      providesTags: ['Project'],
    }),
    getProjectById: builder.query<ApiResponse<Project>, string>({
      query: (id) => `/projects/${id}`,
      providesTags: ['Project'],
    }),
    createProject: builder.mutation<ApiResponse<Project>, Record<string, any>>({
      query: (body) => ({ url: '/projects', method: 'POST', body }),
      invalidatesTags: ['Project'],
    }),
    updateProject: builder.mutation<ApiResponse<Project>, { id: string; data: Partial<Project> }>({
      query: ({ id, data }) => ({ url: `/projects/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: ['Project'],
    }),
    deleteProject: builder.mutation<ApiResponse<any>, string>({
      query: (id) => ({ url: `/projects/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Project'],
    }),
    updateProjectStatus: builder.mutation<ApiResponse<Project>, { id: string; status: string }>({
      query: ({ id, ...body }) => ({ url: `/projects/${id}/status`, method: 'PATCH', body }),
      invalidatesTags: ['Project'],
    }),
    getMyProjects: builder.query<ApiResponse<PaginatedResponse<Project>>, Record<string, any>>({
      query: (params) => ({ url: '/projects/my-projects', params }),
      providesTags: ['Project'],
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useGetProjectByIdQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useUpdateProjectStatusMutation,
  useGetMyProjectsQuery,
} = projectsApi;
