const USE_LOCAL_API = process.env.REACT_APP_USE_LOCAL_API === "true";
console.log(`Using ${USE_LOCAL_API ? "local" : "production"} API endpoint`); 
export const API_BASE = USE_LOCAL_API
  ? "http://localhost:5000"
  : "https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net";
