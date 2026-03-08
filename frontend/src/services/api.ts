import axios from "axios";
 
const api = axios.create({
// Vite wymaga prefixu import.meta.env dla zmiennych z .env
  baseURL: import.meta.env.VITE_API_URL,
});
 
export default api;