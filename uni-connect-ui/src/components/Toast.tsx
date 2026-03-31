import { ToastContainer, toast, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const toastConfig = {
  position: "top-right" as const,
  autoClose: 3000,
  hideProgressBar: false,
  newestOnTop: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: "colored" as const,
  transition: Slide,
};

const Toast = () => <ToastContainer {...toastConfig} />;

export const showSuccess = (message: string): void => {
  toast.success(message);
};

export const showError = (message: string): void => {
  toast.error(message);
};

export const showInfo = (message: string): void => {
  toast.info(message);
};

export default Toast;