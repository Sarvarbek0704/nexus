import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import Cookies from 'js-cookie';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const reviewsApi = createApi({
  reducerPath: 'reviewsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers) => {
      const token = Cookies.get('accessToken') || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Review'],
  endpoints: (builder) => ({
    getFreelancerReviews: builder.query<any, { id: string; params?: any }>({
      query: ({ id, params }) => ({ url: `/reviews/freelancer/${id}`, params }),
      providesTags: ['Review'],
    }),
    getRatingSummary: builder.query<any, string>({
      query: (id) => `/reviews/freelancer/${id}/summary`,
      providesTags: ['Review'],
    }),
    createReview: builder.mutation<any, any>({
      query: (body) => ({ url: '/reviews', method: 'POST', body }),
      invalidatesTags: ['Review'],
    }),
    getMyReviews: builder.query<any, any>({
      query: (params) => ({ url: '/reviews/my', params }),
      providesTags: ['Review'],
    }),
  }),
});

export const {
  useGetFreelancerReviewsQuery,
  useGetRatingSummaryQuery,
  useCreateReviewMutation,
  useGetMyReviewsQuery,
} = reviewsApi;
