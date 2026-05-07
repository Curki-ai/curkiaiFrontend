import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

// Host resolution mirrors the LMS v2 api.js pattern so that local dev hits
// the local backend instead of production. WebSockets bypass the axios/fetch
// interceptor in src/index.js, so we have to do this explicitly here.
const PROD_HR_WS_HOST =
  "https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net";
const LOCAL_HR_WS_HOST = "http://localhost:5000";

const isLocalhost =
  typeof window !== "undefined" &&
  /^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/.test(window.location.hostname);

const HR_WS_HOST = isLocalhost ? LOCAL_HR_WS_HOST : PROD_HR_WS_HOST;

// Upstream backend events we never want to surface to the chat UI as visible
// activity — these are connection-lifecycle / idle chatter.
const IGNORED_UPSTREAM_EVENTS = new Set([
  "staff_onboarding.ws_connected",
  "staff_onboarding.ws_idle",
  "staff_onboarding.ws_welcome",
  "staff_onboarding.hr_ws_turn_done"
]);

const IGNORED_MESSAGE_PATTERNS = [
  /send a message or attach files to begin/i,
  /^connected\.?\s*$/i,
  /^connecting to hr server/i,
  /^connected to hr server/i
];

const isIgnorableEvent = (data) => {
  const upstreamEvent = data?.event || "";
  if (upstreamEvent && IGNORED_UPSTREAM_EVENTS.has(upstreamEvent)) {
    return true;
  }
  const candidates = [
    data?.message,
    data?.payload?.message,
    data?.payload?.status,
    data?.payload?.text
  ].filter(Boolean);
  return candidates.some((text) =>
    IGNORED_MESSAGE_PATTERNS.some((pattern) => pattern.test(text))
  );
};

export const useHRChat = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const callbacksRef = useRef({
    onEvent: null,
    onComplete: null,
    onError: null
  });

  // Paces incoming events so they don't flash by, and defers
  // hr_complete/hr_error until the activity queue has drained so the final
  // bot reply doesn't appear before its preceding status updates.
  const queueRef = useRef({
    items: [],
    processing: false,
    pendingComplete: null,
    pendingError: null,
    firstEventShown: false
  });

  const EVENT_DELAY_MS = 200;

  useEffect(() => {
    console.log(`[HR CHAT] Connecting to ${HR_WS_HOST}`);
    const newSocket = io(HR_WS_HOST, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    newSocket.on("connect", () => {
      console.log("[HR CHAT] Connected", newSocket.id);
      setIsConnected(true);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("[HR CHAT] Disconnected", reason);
      setIsConnected(false);
    });

    const processQueue = () => {
      const queue = queueRef.current;
      if (queue.processing) return;

      if (queue.items.length === 0) {
        if (queue.pendingError) {
          const errData = queue.pendingError;
          queue.pendingError = null;
          queue.pendingComplete = null;
          callbacksRef.current.onError?.(errData);
          return;
        }
        if (queue.pendingComplete) {
          const completeData = queue.pendingComplete;
          queue.pendingComplete = null;
          callbacksRef.current.onComplete?.(completeData);
        }
        return;
      }

      queue.processing = true;
      const next = queue.items.shift();
      callbacksRef.current.onEvent?.(next.eventName, next.data);

      const delay = queue.firstEventShown ? EVENT_DELAY_MS : 0;
      queue.firstEventShown = true;

      setTimeout(() => {
        queue.processing = false;
        processQueue();
      }, delay);
    };

    const handleEvent = (eventName, data) => {
      if (isIgnorableEvent(data)) return;
      queueRef.current.items.push({ eventName, data });
      processQueue();
    };

    newSocket.on("hr_status", (data) => handleEvent("status", data));
    newSocket.on("hr_event", (data) => handleEvent("event", data));
    newSocket.on("hr_email_prepared", (data) =>
      handleEvent("email_prepared", data)
    );
    newSocket.on("hr_email_sent", (data) =>
      handleEvent("email_sent", data)
    );

    newSocket.on("hr_complete", (data) => {
      queueRef.current.pendingComplete = data;
      processQueue();
    });

    newSocket.on("hr_error", (data) => {
      queueRef.current.pendingError = data;
      processQueue();
    });

    newSocket.on("hr_candidates_shortlisted", (data) => {
      console.log("[HR CHAT] hr_candidates_shortlisted", data);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("hr:candidates-shortlisted", { detail: data })
        );
      }
    });

    setSocket(newSocket);

    return () => {
      callbacksRef.current = {
        onEvent: null,
        onComplete: null,
        onError: null
      };

      queueRef.current = {
        items: [],
        processing: false,
        pendingComplete: null,
        pendingError: null,
        firstEventShown: false
      };

      newSocket.disconnect();
    };
  }, []);

  const sendHRChat = ({ payload, onEvent, onComplete, onError }) => {
    if (!socket?.connected) {
      console.log("[HR CHAT] Socket not connected");
      return false;
    }

    callbacksRef.current = { onEvent, onComplete, onError };
    queueRef.current = {
      items: [],
      processing: false,
      pendingComplete: null,
      pendingError: null,
      firstEventShown: false
    };

    console.log("[HR CHAT] Outgoing payload", {
      workflow_phase: payload?.workflow_phase,
      message_len: (payload?.message || "").length,
      attachments: (payload?.attachments || []).length,
      conv_history: (payload?.conversation_history || []).length,
      has_screened_candidates: payload?.screened_candidates != null
    });

    socket.emit("hr_chat", payload);
    return true;
  };

  return { isConnected, sendHRChat };
};
