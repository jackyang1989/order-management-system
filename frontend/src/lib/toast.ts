import { toast } from "sonner";

export function toastSuccess(message: string) {
  return toast.success(message);
}

export function toastError(message: string) {
  return toast.error(message);
}

export function toastInfo(message: string) {
  return toast(message);
}

export function toastLoading(message: string) {
  return toast.loading(message);
}

export function toastDismiss(id?: string | number) {
  toast.dismiss(id);
}
