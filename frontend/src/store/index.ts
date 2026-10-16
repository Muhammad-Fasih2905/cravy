import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { api } from "./api";
import cart from "./cartSlice";

const rootReducer = combineReducers({ [api.reducerPath]: api.reducer, cart });

export const makeStore = (preloadedState?: Partial<ReturnType<typeof rootReducer>>) =>
  configureStore({
    reducer: rootReducer,
    preloadedState: preloadedState as ReturnType<typeof rootReducer> | undefined,
    middleware: (gdm) => gdm().concat(api.middleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
