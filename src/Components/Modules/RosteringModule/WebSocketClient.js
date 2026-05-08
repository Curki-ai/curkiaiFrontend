import { io } from "socket.io-client";
import { API_BASE } from "../../../config/apiBase";

const socket = io(API_BASE, {
  transports: ["websocket"],
  reconnection: true,
});

export default socket;
