import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from './baseApi';
import { ApiResponse, PaginatedResponse, Contract } from '@/types';

export const contractsApi = createApi({
  reducerPath: 'contractsApi',
  baseQuery,
  tagTypes: ['Contract'],
  endpoints: (builder) => ({
    getContracts: builder.query<ApiResponse<PaginatedResponse<Contract>>, Record<string, any>>({
      query: (params) => ({ url: '/contracts', params }),
      providesTags: ['Contract'],
    }),
    getContractById: builder.query<ApiResponse<Contract>, string>({
      query: (id) => `/contracts/${id}`,
      providesTags: ['Contract'],
    }),
    signContract: builder.mutation<ApiResponse<Contract>, string>({
      query: (id) => ({ url: `/contracts/${id}/sign`, method: 'POST' }),
      invalidatesTags: ['Contract'],
    }),
    fundEscrow: builder.mutation<ApiResponse<any>, { contractId: string; amount: number }>({
      query: ({ contractId, ...body }) => ({ url: `/contracts/${contractId}/fund-escrow`, method: 'POST', body }),
      invalidatesTags: ['Contract'],
    }),
    requestContractPause: builder.mutation<ApiResponse<any>, string>({
      query: (id) => ({ url: `/contracts/${id}/pause`, method: 'POST' }),
      invalidatesTags: ['Contract'],
    }),
    resumeContract: builder.mutation<ApiResponse<any>, string>({
      query: (id) => ({ url: `/contracts/${id}/resume`, method: 'POST' }),
      invalidatesTags: ['Contract'],
    }),
    terminateContract: builder.mutation<ApiResponse<any>, { id: string; reason: string }>({
      query: ({ id, ...body }) => ({ url: `/contracts/${id}/terminate`, method: 'POST', body }),
      invalidatesTags: ['Contract'],
    }),
  }),
});

export const {
  useGetContractsQuery,
  useGetContractByIdQuery,
  useSignContractMutation,
  useFundEscrowMutation,
  useRequestContractPauseMutation,
  useResumeContractMutation,
  useTerminateContractMutation,
} = contractsApi;
