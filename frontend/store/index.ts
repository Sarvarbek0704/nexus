import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import { authApi } from './api/authApi';
import { usersApi } from './api/usersApi';
import { projectsApi } from './api/projectsApi';
import { bidsApi } from './api/bidsApi';
import { contractsApi } from './api/contractsApi';
import { milestonesApi } from './api/milestonesApi';
import { paymentsApi } from './api/paymentsApi';
import { reviewsApi } from './api/reviewsApi';
import { agenciesApi } from './api/agenciesApi';
import { skillsApi } from './api/skillsApi';
import { disputesApi } from './api/disputesApi';
import { notificationsApi } from './api/notificationsApi';
import { messagesApi } from './api/messagesApi';
import { statsApi } from './api/statsApi';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    [authApi.reducerPath]: authApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [projectsApi.reducerPath]: projectsApi.reducer,
    [bidsApi.reducerPath]: bidsApi.reducer,
    [contractsApi.reducerPath]: contractsApi.reducer,
    [milestonesApi.reducerPath]: milestonesApi.reducer,
    [paymentsApi.reducerPath]: paymentsApi.reducer,
    [reviewsApi.reducerPath]: reviewsApi.reducer,
    [agenciesApi.reducerPath]: agenciesApi.reducer,
    [skillsApi.reducerPath]: skillsApi.reducer,
    [disputesApi.reducerPath]: disputesApi.reducer,
    [notificationsApi.reducerPath]: notificationsApi.reducer,
    [messagesApi.reducerPath]: messagesApi.reducer,
    [statsApi.reducerPath]: statsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }).concat(
      authApi.middleware,
      usersApi.middleware,
      projectsApi.middleware,
      bidsApi.middleware,
      contractsApi.middleware,
      milestonesApi.middleware,
      paymentsApi.middleware,
      reviewsApi.middleware,
      agenciesApi.middleware,
      skillsApi.middleware,
      disputesApi.middleware,
      notificationsApi.middleware,
      messagesApi.middleware,
      statsApi.middleware,
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
