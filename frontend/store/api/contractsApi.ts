import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import Cookies from 'js-cookie';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const contractsApi = createApi({
  reducerPath: 'contractsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers) => {
      const token = Cookies.get('accessToken') || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Contract'],
  endpoints: (builder) => ({
    getMyContracts: builder.query<any, any>({
      query: (params) => ({ url: '/contracts/my', params }),
      providesTags: ['Contract'],
    }),
    getContract: builder.query<any, string>({
      query: (id) => `/contracts/${id}`,
      providesTags: ['Contract'],
    }),
    signContract: builder.mutation<any, string>({
      query: (id) => ({ url: `/contracts/${id}/sign`, method: 'POST' }),
      invalidatesTags: ['Contract'],
    }),
    updateContractStatus: builder.mutation<any, { id: string; status: string; reason?: string }>({
      query: ({ id, ...body }) => ({ url: `/contracts/${id}/status`, method: 'PATCH', body }),
      invalidatesTags: ['Contract'],
    }),
    getAllContracts: builder.query<any, any>({
      query: (params) => ({ url: '/contracts', params }),
      providesTags: ['Contract'],
    }),
  }),
});

export const {
  useGetMyContractsQuery,
  useGetContractQuery,
  useSignContractMutation,
  useUpdateContractStatusMutation,
  useGetAllContractsQuery,
} = contractsApi;
