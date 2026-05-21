import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import Cookies from 'js-cookie';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const agenciesApi = createApi({
  reducerPath: 'agenciesApi',
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers) => {
      const token = Cookies.get('accessToken') || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Agency'],
  endpoints: (builder) => ({
    getAgencies: builder.query<any, any>({
      query: (params) => ({ url: '/agencies', params }),
      providesTags: ['Agency'],
    }),
    getAgency: builder.query<any, string>({
      query: (id) => `/agencies/${id}`,
      providesTags: ['Agency'],
    }),
    getMyAgency: builder.query<any, void>({
      query: () => '/agencies/my',
      providesTags: ['Agency'],
    }),
    createAgency: builder.mutation<any, any>({
      query: (body) => ({ url: '/agencies', method: 'POST', body }),
      invalidatesTags: ['Agency'],
    }),
    updateAgency: builder.mutation<any, { id: string; body: any }>({
      query: ({ id, body }) => ({ url: `/agencies/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Agency'],
    }),
    inviteMember: builder.mutation<any, { id: string; email: string; role?: string }>({
      query: ({ id, ...body }) => ({ url: `/agencies/${id}/invite`, method: 'POST', body }),
      invalidatesTags: ['Agency'],
    }),
    removeMember: builder.mutation<any, { agencyId: string; memberId: string }>({
      query: ({ agencyId, memberId }) => ({ url: `/agencies/${agencyId}/members/${memberId}`, method: 'DELETE' }),
      invalidatesTags: ['Agency'],
    }),
  }),
});

export const {
  useGetAgenciesQuery,
  useGetAgencyQuery,
  useGetMyAgencyQuery,
  useCreateAgencyMutation,
  useUpdateAgencyMutation,
  useInviteMemberMutation,
  useRemoveMemberMutation,
} = agenciesApi;
