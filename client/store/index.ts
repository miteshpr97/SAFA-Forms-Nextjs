// import { configureStore } from '@reduxjs/toolkit';
// // import projectReducer from '../features/projectSlice'; 
// // import formsReducer from '../features/formsSlice'; 
// // import fieldReducer from '../features/fieldSlice';
// import userReducer from '../features/userSlice'; 
// // import accessReducer from "../features/AccessSlice";
// import toastMiddleware from "../utils/toastMiddleware";

// export const store = configureStore({
//   reducer: {
//     // project: projectReducer,
//     // forms: formsReducer, 
//     // field: fieldReducer,
//     user: userReducer,
//     // access: accessReducer
//   },
//   middleware: (getDefaultMiddleware) =>
//     getDefaultMiddleware().concat(toastMiddleware),
// });

// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;




import { configureStore } from "@reduxjs/toolkit";
import busTypeReducer from "../features/busTypeSlice";
import userReducer from "../features/userSlice";
import projectReducer from "../features/projectSlice";

export const store = configureStore({
  reducer: {
    busType: busTypeReducer,
    user: userReducer,
    project: projectReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;