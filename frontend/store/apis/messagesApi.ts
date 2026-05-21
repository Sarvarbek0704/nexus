import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from './baseApi';
import { ApiResponse, PaginatedResponse } from '@/types';

export const messagesApi = createApi({
  reducerPath: 'messagesApi',
  baseQuery,
  tagTypes: ['Message', 'Conversation'],
  endpoints: (builder) => ({
    getConversations: builder.query<ApiResponse<any[]>, void>({
      query: () => '/messages/conversations',
      providesTags: ['Conversation'],
    }),
    getMessages: builder.query<ApiResponse<PaginatedResponse<any>>, { conversationId: string; page?: number; limit?: number }>({
      query: ({ conversationId, ...params }) => ({
        url: `/messages/conversations/${conversationId}`,
        params,
      }),
      providesTags: ['Message'],
    }),
    sendMessage: builder.mutation<ApiResponse<any>, { conversationId: string; content: string }>({
      query: ({ conversationId, ...body }) => ({
        url: `/messages/conversations/${conversationId}`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Message', 'Conversation'],
    }),
    createConversation: builder.mutation<ApiResponse<any>, { userId: string; message: string }>({
      query: (body) => ({
        url: '/messages/conversations',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Conversation'],
    }),
  }),
});

export const {
  useGetConversationsQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
  useCreateConversationMutation,
} = messagesApi;
