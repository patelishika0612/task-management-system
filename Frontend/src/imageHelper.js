export const getImageUrl = (filename) => {
  if (!filename) return "";
  return `${import.meta.env.VITE_API_URL.replace("/api", "")}/uploads/${filename}`;
};
