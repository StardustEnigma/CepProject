// In production (Vercel), REACT_APP_API_URL points to the EC2 backend
// e.g. "http://51.20.108.79:5000"
// In local dev, it's empty and the proxy in package.json handles routing.
const API_BASE = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");

export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");
  const headers = {
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  // Bypass ngrok browser warning screen which blocks CORS requests
  headers["ngrok-skip-browser-warning"] = "true";

  const url = `${API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || "Request failed");
    error.status = response.status;
    throw error;
  }

  return data;
};
