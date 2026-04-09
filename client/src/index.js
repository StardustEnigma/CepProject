import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles.css";

const originalFetch = window.fetch;
window.fetch = async (...args) => {
  let [resource, config] = args;
  
  if (typeof resource === 'string' && resource.startsWith('/') && !resource.startsWith('/login')) {
    const token = localStorage.getItem("token");
    if (token) {
      config = config || {};
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`
      };
      args = [resource, config];
    }
  }
  
  const response = await originalFetch(...args);
  
  if (response.status === 401 || response.status === 403) {
    if (window.location.pathname !== '/login') {
      localStorage.clear();
      window.location.href = '/login';
    }
  }
  
  return response;
};

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);