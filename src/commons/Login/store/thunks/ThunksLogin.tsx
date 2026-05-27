
import { toast } from "react-toastify";
import { Dispatch } from "react";
import { ToastContent } from "react-toastify";
import CONFIG from "../../../../config/api";
import { set_users } from "../slice/SliceLogin.tsx";


export const control_error = (
  message: ToastContent = "Algo pasó, intente de nuevo"
) =>
  toast.error(message, {
    position: "bottom-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "light",
  });

export const control_success = (message: ToastContent) =>
  toast.success(message, {
    position: "bottom-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "light",
  });
const API_ENDPOINT = CONFIG.API_ENDPOINT;

export const get_users= (): any => {
  return async (dispatch: Dispatch<any>) => {
    try {
      const url = `${API_ENDPOINT}/auth/usuarios/`;
      const response = await fetch(url);
      const data = await response.json();
      dispatch(set_users(data));
      return data;
    } catch (error: any) {
      return error;
    }
  };
};

