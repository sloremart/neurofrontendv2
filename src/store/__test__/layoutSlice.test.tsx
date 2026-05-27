/* eslint-disable @typescript-eslint/naming-convention */

import { layout_slice, open_drawer_mobile } from "../layoutSlice";

    // Tests that mobile drawer is opened when open_drawer_mobile is called with true
    it("test_mobile_drawer_open", () => {
      const initialState = {
          mobile_open: false,
          desktop_open: true,
          mod_dark: false,
      };
      const action = { type: open_drawer_mobile.type, payload: true };
      const newState = layout_slice.reducer(initialState, action);
      expect(newState.mobile_open).toBe(true);
  });