import toast, { Toaster } from 'react-hot-toast';

export const notify = {
  success: (message: string) =>
    toast.success(message, { style: { background: '#16a34a', color: '#fff' } }),
  error: (message: string) =>
    toast.error(message, { style: { background: '#dc2626', color: '#fff' } }),
  info: (message: string) => toast(message, { style: { background: '#1e293b', color: '#fff' } }),
};

export function AppToaster() {
  return <Toaster position="top-center" toastOptions={{ duration: 3200 }} />;
}
