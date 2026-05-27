    
import { ToastContent, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const control_error = (
    message: ToastContent = 'Algo pasó, intente de nuevo'
  ) =>
    toast.error(message, {
      position: 'bottom-right',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: 'light',
    });
  
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  export const control_success = (message: ToastContent) =>
    toast.success(message, {
      position: 'bottom-right',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: 'light',
    });