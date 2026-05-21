import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import Cookies from "js-cookie";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const baseQuery = fetchBaseQuery({
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
});

export const usersApi = createApi({
  reducerPath: "usersApi",
  baseQuery,
  tagTypes: ["User", "FreelancerProfile", "ClientProfile"],
  endpoints: (builder) => ({
    getFreelancers: builder.query<any, any>({
      query: (params) => ({ url: "/users/freelancers", params }),
      providesTags: ["User"],
    }),
    getUserProfile: builder.query<any, string>({
      query: (id) => `/users/${id}/profile`,
      providesTags: ["User"],
    }),
    updateProfile: builder.mutation<any, any>({
      query: (body) => ({ url: "/users/profile", method: "PATCH", body }),
      invalidatesTags: ["User"],
    }),
    updateFreelancerProfile: builder.mutation<any, any>({
      query: (body) => ({
        url: "/users/freelancer-profile",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["FreelancerProfile"],
    }),
    updateClientProfile: builder.mutation<any, any>({
      query: (body) => ({
        url: "/users/client-profile",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["ClientProfile"],
    }),
    getAllUsers: builder.query<any, any>({
      query: (params) => ({ url: "/users/admin/all", params }),
      providesTags: ["User"],
    }),
    updateUserStatus: builder.mutation<any, { userId: string; status: string }>(
      {
        query: ({ userId, ...body }) => ({
          url: `/users/admin/${userId}/status`,
          method: "PATCH",
          body,
        }),
        invalidatesTags: ["User"],
      },
    ),
    uploadAvatar: builder.mutation<any, FormData>({
      query: (body) => ({ url: "/users/avatar", method: "POST", body }),
      invalidatesTags: ["User"],
    }),
  }),
});

export const {
  useGetFreelancersQuery,
  useGetUserProfileQuery,
  useUpdateProfileMutation,
  useUpdateFreelancerProfileMutation,
  useUpdateClientProfileMutation,
  useGetAllUsersQuery,
  useUpdateUserStatusMutation,
  useUploadAvatarMutation,
} = usersApi;
