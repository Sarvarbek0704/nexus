import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import Cookies from 'js-cookie';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const messagesApi = createApi({
  reducerPath: 'messagesApi',
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers) => {
      const token = Cookies.get('accessToken') || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Message', 'Conversation'],
  endpoints: (builder) => ({
    getOrCreateConversation: builder.mutation<any, { userId: string; projectId?: string }>({
      query: (body) => ({ url: '/messages/conversations', method: 'POST', body }),
      invalidatesTags: ['Conversation'],
    }),
    getConversations: builder.query<any, any>({
      query: (params) => ({ url: '/messages/conversations', params }),
      providesTags: ['Conversation'],
    }),
    getMessages: builder.query<any, { conversationId: string; params?: any }>({
      query: ({ conversationId, params }) => ({
        url: `/messages/conversations/${conversationId}/messages`,
        params,
      }),
      providesTags: ['Message'],
    }),
    sendMessage: builder.mutation<any, { conversationId: string; content: string; attachments?: any[]; replyToId?: string }>({
      query: ({ conversationId, ...body }) => ({
        url: `/messages/conversations/${conversationId}/send`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Message', 'Conversation'],
    }),
    editMessage: builder.mutation<any, { messageId: string; content: string }>({
      query: ({ messageId, content }) => ({
        url: `/messages/${messageId}`,
        method: 'PATCH',
        body: { content },
      }),
      invalidatesTags: ['Message'],
    }),
    deleteMessage: builder.mutation<any, string>({
      query: (messageId) => ({ url: `/messages/${messageId}`, method: 'DELETE' }),
      invalidatesTags: ['Message'],
    }),
    markConversationRead: builder.mutation<any, string>({
      query: (conversationId) => ({
        url: `/messages/conversations/${conversationId}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Conversation'],
    }),
  }),
});

export const {
  useGetOrCreateConversationMutation,
  useGetConversationsQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
  useEditMessageMutation,
  useDeleteMessageMutation,
  useMarkConversationReadMutation,
} = messagesApi;
