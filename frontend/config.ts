// config.ts
const LOCAL_IP = 'http://192.168.71.51:5000'; // Lokal ağ için IP
const TUNNEL_URL = 'https://applicants-puzzles-milan-gorgeous.trycloudflare.com'; // Cloudflare dış bağlantı

// Eğer debug modda çalışıyorsa LOCAL_IP, değilse TUNNEL_URL kullan
export const BASE_URL = __DEV__ ? LOCAL_IP : TUNNEL_URL;
