import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from './baseApi';
import { ApiResponse, PaginatedResponse, Agency } from '@/types';

export const agenciesApi = createApi({
  reducerPath: 'agenciesApi',
  baseQuery,
  tagTypes: ['Agency'],
  endpoints: (builder) => ({
    getAgencies: builder.query<ApiResponse<PaginatedResponse<Agency>>, Record<string, any>>({
      query: (params) => ({ url: '/agencies', params }),
      providesTags: ['Agency'],
    }),
    getAgencyById: builder.query<ApiResponse<Agency>, string>({
      query: (id) => `/agencies/${id}`,
      providesTags: ['Agency'],
    }),
    getMyAgency: builder.query<ApiResponse<Agency>, void>({
      query: () => '/agencies/my-agency',
      providesTags: ['Agency'],
    }),
    createAgency: builder.mutation<ApiResponse<Agency>, Record<string, any>>({
      query: (body) => ({ url: '/agencies', method: 'POST', body }),
      invalidatesTags: ['Agency'],
    }),
    updateAgency: builder.mutation<ApiResponse<Agency>, { id: string; data: Partial<Agency> }>({
      query: ({ id, data }) => ({ url: `/agencies/${id}`, method: 'PATCH', body: data }),
      invalidatesTags: ['Agency'],
    }),
    inviteMember: builder.mutation<ApiResponse<any>, { agencyId: string; email: string; role: string }>({
      query: ({ agencyId, ...body }) => ({ url: `/agencies/${agencyId}/invite`, method: 'POST', body }),
      invalidatesTags: ['Agency'],
    }),
    removeMember: builder.mutation<ApiResponse<any>, { agencyId: string; memberId: string }>({
      query: ({ agencyId, memberId }) => ({ url: `/agencies/${agencyId}/members/${memberId}`, method: 'DELETE' }),
      invalidatesTags: ['Agency'],
    }),
  }),
});

export const {
  useGetAgenciesQuery,
  useGetAgencyByIdQuery,
  useGetMyAgencyQuery,
  useCreateAgencyMutation,
  useUpdateAgencyMutation,
  useInviteMemberMutation,
  useRemoveMemberMutation,
} = agenciesApi;
