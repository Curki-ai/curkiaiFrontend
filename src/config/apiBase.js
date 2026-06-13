const USE_LOCAL_API = process.env.REACT_APP_USE_LOCAL_API === "true";
export const API_BASE = USE_LOCAL_API
  ? "http://localhost:5000"
  : "https://app-curki-middleware-prod-aue-001.azurewebsites.net";
