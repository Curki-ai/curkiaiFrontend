// LMS v2 — frontend API client.
// All calls hit the new /api/lms-v2 namespace on the middleware.
//
// Host resolution:
//  - When the page is served from localhost (i.e. `npm start`), we hit
//    http://localhost:5000 so you can iterate on the middleware locally
//    without deploying. You can override with REACT_APP_LMS_V2_BASE_URL.
//  - Otherwise we hit the deployed Azure backend.
import axios from "axios";
import { io } from "socket.io-client";

const PROD_HOST =
  "https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net";
const LOCAL_HOST = "http://localhost:5000";

const isLocalhost =
  typeof window !== "undefined" &&
  /^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/.test(window.location.hostname);

const SOCKET_HOST = isLocalhost ? LOCAL_HOST : PROD_HOST;

const BASE_URL =
  process.env.REACT_APP_LMS_V2_BASE_URL ||
  `${isLocalhost ? LOCAL_HOST : PROD_HOST}/api/lms-v2`;

console.log("[LMS v2] API base:", BASE_URL);

// ── Admin email injection ────────────────────────────────────────────────
// The LMS v2 admin endpoints are gated by requireOrgAccess on the backend,
// which needs the signed-in admin's email to verify membership in the org's
// admins[]. We attach it as the `x-user-email` header (which the middleware
// already accepts) so every call carries it without needing every API
// function to take an explicit param. LMSRedesign calls setAdminEmail(...)
// once when the user prop is known.
let _adminEmail = "";

export const setAdminEmail = (email) => {
  _adminEmail = (email || "").toString().trim();
};

axios.interceptors.request.use((config) => {
  if (
    _adminEmail &&
    typeof config.url === "string" &&
    config.url.startsWith(BASE_URL)
  ) {
    config.headers = config.headers || {};
    if (!config.headers["x-user-email"]) {
      config.headers["x-user-email"] = _adminEmail;
    }
  }
  return config;
});

const tag = (label) => `[LMS v2][${label}]`;

const logErr = (label, err) => {
  const status = err.response?.status;
  console.error(`${tag(label)} ✗`, {
    status: status || "NETWORK",
    url: err.config?.url,
    message: err.message,
    response: err.response?.data,
  });
};

// ── Admin ─────────────────────────────────────────────────────────────

export const listCoursesApi = async (organizationId) => {
  try {
    const res = await axios.get(`${BASE_URL}/courses`, { params: { organizationId } });
    console.log(`${tag("listCourses")} ✓ ${res.status}`, { count: (res.data?.courses || []).length });
    return res.data?.courses || [];
  } catch (err) {
    logErr("listCourses", err);
    throw err;
  }
};

export const createCourseApi = async ({ organizationId, adminEmail, course }) => {
  try {
    const res = await axios.post(`${BASE_URL}/courses`, {
      organizationId,
      adminEmail,
      course,
    });
    const created = res.data?.course;
    console.log(`${tag("createCourse")} ✓ ${res.status}`, {
      id: created?.id,
      etag: created?._etag,
    });
    return created;
  } catch (err) {
    logErr("createCourse", err);
    throw err;
  }
};

export const getCourseApi = async ({ organizationId, courseId }) => {
  try {
    const res = await axios.get(`${BASE_URL}/courses/${courseId}`, {
      params: { organizationId },
    });
    console.log(`${tag("getCourse")} ✓ ${res.status}`, { courseId });
    return res.data?.course;
  } catch (err) {
    logErr("getCourse", err);
    throw err;
  }
};

export const updateCourseApi = async ({ organizationId, courseId, course, etag }) => {
  try {
    // Send organizationId in both query and body so the backend can read
    // it from either — list/get/delete all use query, only PUT had it body-only.
    const res = await axios.put(
      `${BASE_URL}/courses/${courseId}`,
      { organizationId, course, etag },
      { params: { organizationId } }
    );
    console.log(`${tag("updateCourse")} ✓ ${res.status}`, {
      courseId,
      newEtag: res.data?.course?._etag,
    });
    return res.data?.course;
  } catch (err) {
    logErr("updateCourse", err);
    throw err;
  }
};

export const deleteCourseApi = async ({ organizationId, courseId }) => {
  try {
    const res = await axios.delete(`${BASE_URL}/courses/${courseId}`, {
      params: { organizationId },
    });
    console.log(`${tag("deleteCourse")} ✓ ${res.status}`, { courseId });
    return res.data;
  } catch (err) {
    logErr("deleteCourse", err);
    throw err;
  }
};

export const uploadLessonFileApi = async ({
  organizationId,
  courseId,
  sectionId,
  lessonId,
  file,
  onProgress,
}) => {
  const fd = new FormData();
  fd.append("organizationId", organizationId);
  fd.append("sectionId", sectionId);
  fd.append("lessonId", lessonId);
  fd.append("file", file);

  const res = await axios.post(`${BASE_URL}/courses/${courseId}/upload`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: onProgress,
  });
  return res.data?.attachment;
};

export const deleteAttachmentApi = async ({ organizationId, courseId, blobName }) => {
  const res = await axios.delete(`${BASE_URL}/courses/${courseId}/attachment`, {
    data: { organizationId, blobName },
  });
  return res.data;
};

// ── Learner ───────────────────────────────────────────────────────────

export const myCoursesApi = async (email) => {
  const res = await axios.get(`${BASE_URL}/learner/my-courses`, { params: { email } });
  return res.data;
};

export const getLearnerCourseApi = async ({ courseId, email }) => {
  const res = await axios.get(`${BASE_URL}/learner/courses/${courseId}`, {
    params: { email },
  });
  return res.data;
};

export const updateLearnerProgressApi = async ({
  email,
  courseId,
  lessonId,
  completed,
  viewed,
}) => {
  const res = await axios.put(`${BASE_URL}/learner/progress`, {
    email,
    courseId,
    lessonId,
    completed,
    viewed,
  });
  return res.data?.enrollment;
};

export const submitQuizAttemptApi = async ({ email, courseId, lessonId, answers }) => {
  const res = await axios.post(`${BASE_URL}/learner/quiz-attempt`, {
    email,
    courseId,
    lessonId,
    answers,
  });
  return res.data;
};

// ── Real-time sync ────────────────────────────────────────────────────
// Lazy-init shared socket. We re-use one connection per page load so
// remounting <LMSRedesign /> doesn't open a new socket each time.
let _lmsSocket = null;
const getLmsSocket = () => {
  if (_lmsSocket) return _lmsSocket;
  _lmsSocket = io(SOCKET_HOST, {
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });
  _lmsSocket.on("connect", () => {
    console.log(`${tag("socket")} ✓ connected`, _lmsSocket.id);
  });
  _lmsSocket.on("disconnect", (reason) => {
    console.log(`${tag("socket")} ✗ disconnected`, reason);
  });
  return _lmsSocket;
};

// Subscribe to course-change events for one org. Joins the org room and
// registers handlers; returns an unsubscribe function that removes the
// listeners and leaves the room. Re-joining on reconnect is automatic so
// transient disconnects don't drop the subscription.
export const subscribeToCourseChanges = (
  organizationId,
  { onUpserted, onDeleted } = {}
) => {
  if (!organizationId) return () => {};
  const socket = getLmsSocket();

  const join = () => socket.emit("join-org", { organizationId });
  if (socket.connected) join();
  socket.on("connect", join);

  const upsertHandler = (payload) => {
    if (typeof onUpserted === "function" && payload?.course) {
      onUpserted(payload.course);
    }
  };
  const deleteHandler = (payload) => {
    if (typeof onDeleted === "function" && payload?.courseId) {
      onDeleted(payload.courseId);
    }
  };
  socket.on("lms:course:upserted", upsertHandler);
  socket.on("lms:course:deleted", deleteHandler);

  return () => {
    socket.off("connect", join);
    socket.off("lms:course:upserted", upsertHandler);
    socket.off("lms:course:deleted", deleteHandler);
    socket.emit("leave-org", { organizationId });
  };
};
