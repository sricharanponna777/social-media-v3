// store.ts
import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './reducers'; // combineReducers(...) result

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: true,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
