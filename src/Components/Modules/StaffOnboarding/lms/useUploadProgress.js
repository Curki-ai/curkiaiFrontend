import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { uploadLessonFileApi } from "./api";

// Shared upload state for lesson attachments. Lives at CourseEditor level
// so that switching the active lesson (which unmounts the LessonEditor via
// `key={lesson.id}`) doesn't wipe an in-flight upload's progress UI.

const UploadProgressContext = createContext(null);
const DEFAULT_STATE = { uploading: false, pct: 0, err: "" };

export const UploadProgressProvider = ({ children }) => {
  const [uploads, setUploads] = useState({}); // lessonId -> { uploading, pct, err }
  const inFlight = useRef({});

  const patch = useCallback((lessonId, partial) => {
    setUploads((prev) => ({
      ...prev,
      [lessonId]: { ...(prev[lessonId] || DEFAULT_STATE), ...partial },
    }));
  }, []);

  const startUpload = useCallback(
    async ({
      lessonId,
      file,
      organizationId,
      courseId,
      sectionId,
      onComplete,
    }) => {
      if (!lessonId || !file) return;
      if (inFlight.current[lessonId]) return;
      if (!organizationId || !courseId) {
        patch(lessonId, {
          uploading: false,
          pct: 0,
          err: "Course not saved yet — please wait a moment and try again.",
        });
        return;
      }
      inFlight.current[lessonId] = true;
      patch(lessonId, { uploading: true, pct: 0, err: "" });
      try {
        const attachment = await uploadLessonFileApi({
          organizationId,
          courseId,
          sectionId,
          lessonId,
          file,
          onProgress: (evt) => {
            if (evt.total) {
              patch(lessonId, {
                pct: Math.round((evt.loaded / evt.total) * 100),
              });
            }
          },
        });
        if (typeof onComplete === "function") onComplete(attachment);
        patch(lessonId, { uploading: false, pct: 100, err: "" });
      } catch (err) {
        console.error("[LMS v2] upload failed", err);
        patch(lessonId, {
          uploading: false,
          err: err.response?.data?.error || "Upload failed",
        });
      } finally {
        delete inFlight.current[lessonId];
      }
    },
    [patch]
  );

  return (
    <UploadProgressContext.Provider value={{ uploads, startUpload }}>
      {children}
    </UploadProgressContext.Provider>
  );
};

export const useUploadProgress = (lessonId) => {
  const ctx = useContext(UploadProgressContext);
  if (!ctx) {
    return { state: DEFAULT_STATE, startUpload: () => {} };
  }
  return {
    state: ctx.uploads[lessonId] || DEFAULT_STATE,
    startUpload: ctx.startUpload,
  };
};
