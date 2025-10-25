// client/src/config.js
export const API_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export const API_HOST = API_URL.replace(/\/api\/?$/, '');