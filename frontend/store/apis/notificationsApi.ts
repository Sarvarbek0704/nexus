import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from './baseApi';
import { ApiResponse, PaginatedResponse, Notification } from '@/types';

export const notificationsApi = createApi({
  reducerPath: 'notificationsApi',
  baseQuery,
  tagTypes: ['Notification'],
  endpoints: (builder) => ({
    getNotifications: builder.query<ApiResponse<PaginatedResponse<Notification>>, { page?: number; limit?: number; unreadOnly?: boolean }>({
      query: (params) => ({ url: '/notifications', params }),
      providesTags: ['Notification'],
    }),
    markNotificationRead: builder.mutation<ApiResponse<any>, string>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: 'PATCH' }),
      invalidatesTags: ['Notification'],
    }),
    markAllNotificationsRead: builder.mutation<ApiResponse<any>, void>({
      query: () => ({ url: '/notifications/read-all', method: 'PATCH' }),
      invalidatesTags: ['Notification'],
    }),
    getUnreadCount: builder.query<ApiResponse<{ count: number }>, void>({
      query: () => '/notifications/unread-count',
      providesTags: ['Notification'],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useGetUnreadCountQuery,
} = notificationsApi;
