
export const useAuth = () => {
  const userData = localStorage.getItem("userData");
  if (!userData) return null;

  try {
    return JSON.parse(userData);
  } catch {
    return null;
  }
};
