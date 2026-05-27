import { PayloadAction, createSlice } from "@reduxjs/toolkit";

import { IObjUsuarios, IUsuarios } from "../../interface/InterfaceLogin.ts";

const initial_state: IUsuarios = {
    users:[],

};

export const users_slice = createSlice({
  name: 'users',
  initialState: initial_state,
  reducers: {
    reset_state: () => initial_state,
    set_users: (
      state: IUsuarios,
      action: PayloadAction<IObjUsuarios[]>
    ) => {
      state.users = action.payload;
    },
   
     
  },
});
export const {
    set_users, 
 
} = users_slice.actions;

export default users_slice.reducer;