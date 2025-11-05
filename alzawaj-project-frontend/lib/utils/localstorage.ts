import { STORAGE_KEYS } from "@/lib/constants";

export const getUserFromLocalStorage = () => {
  if (typeof window !== "undefined") {
    const userStr = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
  }
  return null;
};
