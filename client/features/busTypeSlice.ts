/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

export interface BusType {
  _id: string;
  busType: string;
  [key: string]: any;
}

interface BusTypeState {
  data: BusType[];
  loading: boolean;
  error: string | null;
}

const initialState: BusTypeState = {
  data: [],
  loading: false,
  error: null,
};

export const fetchBusTypes = createAsyncThunk(
  "busType/fetchBusTypes",
  async () => {
    const response = await axios.get(
      "https://rta-backend-1.onrender.com/api/busType/get"
    );

    console.log(response.data);
     return response.data;
  }
);

const busTypeSlice = createSlice({
  name: "busType",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBusTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBusTypes.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchBusTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Something went wrong";
      });
  },
});

export default busTypeSlice.reducer;
