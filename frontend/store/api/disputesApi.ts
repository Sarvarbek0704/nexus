import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import Cookies from "js-cookie";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const disputesApi = createApi({
  reducerPath: "disputesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers) => {
      const token =
        Cookies.get("accessToken") ||
        (typeof window !== "undefined"
          ? localStorage.getItem("accessToken")
          : null);
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Dispute"],
  endpoints: (builder) => ({
    getMyDisputes: builder.query<any, any>({
      query: (params) => ({ url: "/disputes/my", params }),
      providesTags: ["Dispute"],
    }),
    getDispute: builder.query<any, string>({
      query: (id) => `/disputes/${id}`,
      providesTags: ["Dispute"],
    }),
    getAllDisputes: builder.query<any, any>({
      query: (params) => ({ url: "/disputes/admin/all", params }),
      providesTags: ["Dispute"],
    }),
    createDispute: builder.mutation<any, any>({
      query: (body) => ({ url: "/disputes", method: "POST", body }),
      invalidatesTags: ["Dispute"],
    }),
    addDisputeMessage: builder.mutation<any, { id: string; message: string }>({
      query: ({ id, ...body }) => ({
        url: `/disputes/${id}/messages`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Dispute"],
    }),
    resolveDispute: builder.mutation<
      any,
      { id: string; resolution: string; outcome: string; notes?: string }
    >({
      query: ({ id, outcome, resolution, notes }) => ({
        url: `/disputes/${id}/resolve`,
        method: "PATCH",
        body: {
          resolution,
          notes,
          status: "resolved",
          outcome,
        },
      }),
      invalidatesTags: ["Dispute"],
    }),
  }),
});

export const {
  useGetMyDisputesQuery,
  useGetDisputeQuery,
  useGetAllDisputesQuery,
  useCreateDisputeMutation,
  useAddDisputeMessageMutation,
  useResolveDisputeMutation,
} = disputesApi;
