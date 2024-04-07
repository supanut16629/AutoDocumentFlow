import { createSlice } from "@reduxjs/toolkit";

const initialState = null;

const accountSlice = createSlice({
  name: "account",
  initialState,
  reducers: {
    logIn: (state, action) => {
      const user = action.payload;
      console.log("payload:", user);
      if (!state) {
        return user;
      }
    },
    logOut: (state, action) => {
        return null;
    },
  },
});

export const { logIn, logOut } = accountSlice.actions;
export default accountSlice.reducer;
