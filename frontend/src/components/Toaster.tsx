"use client";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/** The one place toasts are drawn. It sits in the root layout, so it also covers the admin panel. */
export function Toaster() {
  return <ToastContainer position="top-right" autoClose={4000} limit={3} newestOnTop closeOnClick pauseOnFocusLoss={false} theme="light" />;
}