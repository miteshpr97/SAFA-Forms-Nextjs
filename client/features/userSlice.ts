// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
// import axios from "axios";

// interface User {
//   user_id: string;
//   full_name: string;
//   email: string;
//   role: string;
//   token: string;
//   companyId: string;
//   company_name: string;
// }

// interface UserState {
//   user: User | null;
//   userData: User[]; // Changed from `User | []` to `User[]`
//   status: "idle" | "loading" | "succeeded" | "failed";
//   error: string | null;
// }

// const initialState: UserState = {
//   user: null,
//   userData: [],
//   status: "idle",
//   error: null,
// };

// // ✅ Fetch currently logged-in user
// export const fetchUser = createAsyncThunk<User>(
//   "user/fetchUser",
//   async (_, { rejectWithValue }) => {
//     try {
//       const response = await axios.get("/api/v1/user/getMe", {
//         withCredentials: true,
//       });
//       console.log(response.data, "the arta");
      
//       return response.data.data;
//     } catch (error: any) {
//       return rejectWithValue(error.response?.data?.message || "Failed to fetch user");
//     }
//   }
// );

// // ✅ Fetch all users for a company
// export const fetchAllUser = createAsyncThunk<User[]>(
//   "user/fetchAllUser",
//   async (_, { rejectWithValue }) => {
//     try {
//       const response = await axios.get("/api/v1/user/getUsers", {
//         withCredentials: true,
//       });
//       return response.data.data;
//     } catch (error: any) {
//       return rejectWithValue(error.response?.data?.message || "Failed to fetch all users");
//     }
//   }
// );

// const userSlice = createSlice({
//   name: "user",
//   initialState,
//   reducers: {
//     logoutUser(state) {
//       state.user = null;
//       state.status = "idle";
//       state.error = null;
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       // fetchUser
//       .addCase(fetchUser.pending, (state) => {
//         state.status = "loading";
//       })
//       .addCase(fetchUser.fulfilled, (state, action: PayloadAction<User>) => {
//         state.status = "succeeded";
//         state.user = action.payload;
//       })
//       .addCase(fetchUser.rejected, (state, action) => {
//         state.status = "failed";
//         state.error = action.payload as string;
//       })

//       // fetchAllUser
//       .addCase(fetchAllUser.pending, (state) => {
//         state.status = "loading";
//       })
//       .addCase(fetchAllUser.fulfilled, (state, action: PayloadAction<User[]>) => {
//         state.status = "succeeded";
//         state.userData = action.payload;
//       })
//       .addCase(fetchAllUser.rejected, (state, action) => {
//         state.status = "failed";
//         state.error = action.payload as string;
//       });
//   },
// });

// export const { logoutUser } = userSlice.actions;

// export default userSlice.reducer;




// client/features/userSlice.ts
/* eslint-disable @typescript-eslint/no-explicit-any */


//features/userSlice.ts



// features/userSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

interface User {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  token: string;
  companyId: string;
  company_name: string;
}

interface UserState {
  user: User | null;
  userData: User[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: UserState = {
  user: null,
  userData: [],
  status: "idle",
  error: null,
};

// ✅ Thunk to fetch logged-in user
export const fetchUser = createAsyncThunk<User>(
  "user/fetchUser",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get("/api/v1/user/getMe", {
        withCredentials: true,
      });

      console.log(response.data.data.User, "FETCHED USER");

      return response.data.data.User;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch user");
    }
  }
);

// ✅ Thunk to fetch all users
export const fetchAllUser = createAsyncThunk<User[]>(
  "user/fetchAllUser",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get("/api/v1/user/getUsers", {
        withCredentials: true,
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch all users");
    }
  }
);

// ✅ Create user slice
const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    logoutUser(state) {
      state.user = null;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.status = "succeeded";
        state.user = action.payload;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(fetchAllUser.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAllUser.fulfilled, (state, action: PayloadAction<User[]>) => {
        state.status = "succeeded";
        state.userData = action.payload;
      })
      .addCase(fetchAllUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

export const { logoutUser } = userSlice.actions;
export default userSlice.reducer;
