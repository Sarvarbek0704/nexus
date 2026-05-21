import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from './baseApi';
import { ApiResponse, PaginatedResponse, User } from '@/types';

export const usersApi = createApi({
  reducerPath: 'usersApi',
  baseQuery,
  tagTypes: ['User', 'FreelancerProfile', 'ClientProfile'],
  endpoints: (builder) => ({
    getFreelancers: builder.query<ApiResponse<PaginatedResponse<User>>, Record<string, any>>({
      query: (params) => ({ url: '/users/freelancers', params }),
      providesTags: ['User'],
    }),
    getFreelancerById: builder.query<ApiResponse<User>, string>({
      query: (id) => `/users/freelancers/${id}`,
      providesTags: ['User'],
    }),
    getClients: builder.query<ApiResponse<PaginatedResponse<User>>, Record<string, any>>({
      query: (params) => ({ url: '/users/clients', params }),
    }),
    updateProfile: builder.mutation<ApiResponse<User>, Partial<User>>({
      query: (body) => ({ url: '/users/me', method: 'PATCH', body }),
      invalidatesTags: ['User'],
    }),
    updateFreelancerProfile: builder.mutation<ApiResponse<any>, Record<string, any>>({
      query: (body) => ({ url: '/users/me/freelancer-profile', method: 'PATCH', body }),
      invalidatesTags: ['FreelancerProfile'],
    }),
    updateClientProfile: builder.mutation<ApiResponse<any>, Record<string, any>>({
      query: (body) => ({ url: '/users/me/client-profile', method: 'PATCH', body }),
      invalidatesTags: ['ClientProfile'],
    }),
    getAllUsers: builder.query<ApiResponse<PaginatedResponse<User>>, Record<string, any>>({
      query: (params) => ({ url: '/admin/users', params }),
      providesTags: ['User'],
    }),
    updateUserStatus: builder.mutation<ApiResponse<any>, { userId: string; status: string }>({
      query: ({ userId, ...body }) => ({ url: `/admin/users/${userId}/status`, method: 'PATCH', body }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useGetFreelancersQuery,
  useGetFreelancerByIdQuery,
  useGetClientsQuery,
  useUpdateProfileMutation,
  useUpdateFreelancerProfileMutation,
  useUpdateClientProfileMutation,
  useGetAllUsersQuery,
  useUpdateUserStatusMutation,
} = usersApi;
