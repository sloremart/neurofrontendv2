import { createSlice } from '@reduxjs/toolkit';

export const layout_slice = createSlice({
  name: 'layout',
  initialState: {
    mobile_open: false,
    desktop_open: true,
    mod_dark: false,
  },
  reducers: {
    open_drawer_mobile: (state, { payload }) => {
      state.mobile_open = payload;
    },
    open_drawer_desktop: (state, { payload }) => {
      state.desktop_open = payload;
    },
    handle_mod_dark: (state, { payload }) => {
      state.mod_dark = payload;
    },
  },
});

export const { open_drawer_mobile, open_drawer_desktop, handle_mod_dark } =
  layout_slice.actions;
