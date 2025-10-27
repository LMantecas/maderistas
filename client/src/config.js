// client/src/config.js
const isProduction = import.meta.env.PROD;

export const API_URL = isProduction 
  ? 'https://maderistas.com/api'
  : 'http://localhost:3000/api';

export const API_HOST = isProduction
  ? 'https://maderistas.com'
  : 'http://localhost:3000';