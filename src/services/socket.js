import io from "socket.io-client";
import { SUPER_BASE_URL } from "../config/Constants";

let socket = null;
let currentUserId = null;
let currentUserType = null;

export const initSocket = ({ userId, user_type }) => {
  // 🔁 If same user, reuse socket
  if (
    socket &&
    socket.connected &&
    currentUserId === userId &&
    currentUserType === user_type
  ) {
    return socket;
  }

  // 🔥 If user changed → destroy old socket
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  currentUserId = userId;
  currentUserType = user_type;

  socket = io(SUPER_BASE_URL, {
    transports: ["websocket"],
    autoConnect: true,
    query: {
      userId,
      user_type,
    },
  });

  socket.on("connect", () => {
    console.log("✅ Socket connected:", socket.id, user_type, userId);
  });

  socket.on("disconnect", (reason) => {
    console.log("❌ Socket disconnected:", reason);
  });

  return socket;
};

export const getSocket = () => socket;
