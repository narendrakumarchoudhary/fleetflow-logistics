import axios from 'axios';
export const api=axios.create({baseURL:import.meta.env.VITE_API_URL||(import.meta.env.PROD?'/api':'http://localhost:4000/api'),timeout:12000});
api.interceptors.request.use(c=>{const t=localStorage.getItem('fleetflow_token');if(t)c.headers.Authorization=`Bearer ${t}`;return c;});
api.interceptors.response.use(r=>r,e=>{if(e.response?.status===401){localStorage.removeItem('fleetflow_token');localStorage.removeItem('fleetflow_user');localStorage.removeItem('fleetflow_mode');if(typeof window!=='undefined')window.dispatchEvent(new Event('fleetflow:unauthorized'));}return Promise.reject(e);});
export const getError=e=>e?.response?.data?.message||e?.message||'Something went wrong';