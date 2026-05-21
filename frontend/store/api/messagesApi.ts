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
    getConversations: builder.query<any, any>({
      query: (params) => ({ url: '/messages/conversations', params }),
      providesTags: ['Conversation'],
    }),
    getMessages: builder.query<any, { conversationId: string; params?: any }>({
      query: ({ conversationId, params }) => ({ url: `/messages/conversations/${conversationId}`, params }),
      providesTags: ['Message'],
    }),
    sendMessage: builder.mutation<any, { recipientId: string; content: string; conversationId?: string }>({
      query: (body) => ({ url: '/messages', method: 'POST', body }),
      invalidatesTags: ['Message', 'Conversation'],
    }),
    markConversationRead: builder.mutation<any, string>({
      query: (conversationId) => ({ url: `/messages/conversations/${conversationId}/read`, method: 'PATCH' }),
      invalidatesTags: ['Conversation'],
    }),
  }),
});

export const {
  useGetConversationsQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
  useMarkConversationReadMutation,
} = messagesApi;
