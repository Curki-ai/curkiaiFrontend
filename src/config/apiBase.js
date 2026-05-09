const USE_LOCAL_API = process.env.REACT_APP_USE_LOCAL_API === "true";
console.log("Environment variables:", process.env);
console.log("USE_LOCAL_API:", USE_LOCAL_API);
console.log(`Using ${USE_LOCAL_API ? "local" : "production"} API endpoint`); 
export const API_BASE = USE_LOCAL_API
  ? "http://localhost:5000"
  : "https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net";
