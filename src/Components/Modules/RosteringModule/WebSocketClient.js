import { io } from "socket.io-client";

const API_BASE =
  "https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net";

const socket = io(API_BASE, {
  transports: ["websocket"],
  reconnection: true,
});

export default socket;
