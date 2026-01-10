import React, { useEffect, useState } from "react";
import "../../../Styles/AdminCourseCreation.css";
import { createLectureApi, createModuleApi, deleteModuleApi, editModuleApi, getAllModulesApi, updateLectureApi } from "./AdminCourseApis";
import lms_file_icon from "../../../Images/lms_file_icon.png"
import lms_play_icon1 from "../../../Images/lms_play_icon1.png"
import lms_play_icon2 from "../../../Images/lms_play_icon2.png";
import lms_tab_icon1 from "../../../Images/lms_tab_icon1.png"
import lms_tab_icon2 from "../../../Images/lms_tab_icon2.png"
import lms_tab_icon3 from "../../../Images/lms_tab_icon3.png"
import lms_tab_icon4 from "../../../Images/lms_tab_icon4.png"
import lms_plus_icon from "../../../Images/lms_plus_icon.png"
const AdminCourseCreation = (props) => {
  // console.log('AdminCourseCreation props', props);
  const [modules, setModules] = useState([]);
  const [activeModuleId, setActiveModuleId] = useState(null);
  const [activeLessonId, setActiveLessonId] = useState(null);
  const [newModuleName, setNewModuleName] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const AdminEmail = props?.user?.email || "";
  // console.log('AdminUserEmail', AdminEmail);
  useEffect(() => {
    const fetchModules = async () => {
      try {
        const rawModules = await getAllModulesApi(AdminEmail);
        // console.log("Fetched modules:", rawModules);

        // normalize: convert `lectures` → `lessons`
        const normalizedModules = rawModules.map(m => ({
          id: m.id,
          title: m.title,
          lessons: m.lectures || [],   // ✅ map lectures to lessons,
        }));

        setModules(normalizedModules);
      } catch (err) {
        console.error("❌ Error fetching modules:", err);
        alert("Failed to load modules");
      }
    };

    fetchModules();
  }, []);


  // derive activeModule & activeLesson from IDs
  const activeModule = modules.find((m) => m.id === activeModuleId) || null;
  // console.log('activeModule', activeModule);
  const activeLesson =
    activeModule?.lessons.find((l) => l.id === activeLessonId) || null;
  // console.log('activeLesson', activeLesson);
  // const addModule = () => {
  //   if (!newModuleName.trim()) return;
  //   const newModule = {
  //     id: Date.now(),
  //     title: newModuleName,
  //     lessons: [],
  //   };
  //   setModules([...modules, newModule]);
  //   setNewModuleName("");
  // };
  const addModule = async () => {
    if (!newModuleName.trim()) return;

    try {
      const createdModule = await createModuleApi(newModuleName, AdminEmail);

      const newModule = {
        id: createdModule.id,
        title: createdModule.title,
        lessons: createdModule.lectures || [], // normalize here too
      };

      setModules([...modules, newModule]);
      setNewModuleName("");
    } catch (err) {
      console.error("❌ Error creating module:", err);
      alert("Failed to create module");
    }
  };


  // const addLesson = (moduleId) => {
  //   const updatedModules = modules.map((m) => {
  //     if (m.id === moduleId) {
  //       const newLesson = {
  //         id: Date.now(),
  //         title: "",
  //         type: "video",
  //         file: null,
  //       };
  //       return { ...m, lessons: [...m.lessons, newLesson] };
  //     }
  //     return m;
  //   });
  //   setModules(updatedModules);
  // };
  const addLesson = async (moduleId) => {
    try {
      const updatedModule = await createLectureApi(
        moduleId,
        "Untitled Lesson",
        "video"
      );

      // normalize here too
      const normalizedModule = {
        id: updatedModule.id,
        title: updatedModule.title,
        lessons: updatedModule.lectures || [],
      };

      const updatedModules = modules.map((m) =>
        m.id === moduleId ? normalizedModule : m
      );
      setModules(updatedModules);
    } catch (err) {
      console.error("❌ Error adding lesson:", err);
      alert("Failed to add lesson");
    }
  };


  // const updateLesson = (moduleId, lessonId, updatedLesson) => {
  //   const updatedModules = modules.map((m) => {
  //     if (m.id === moduleId) {
  //       const lessons = m.lessons.map((l) =>
  //         l.id === lessonId ? { ...l, ...updatedLesson } : l
  //       );
  //       return { ...m, lessons };
  //     }
  //     return m;
  //   });
  //   setModules(updatedModules);
  // };
  const updateLesson = async (moduleId, lessonId, updatedLesson) => {
    // console.log('updateLesson', moduleId, lessonId, updatedLesson, activeLesson);
    try {
      const updatedModule = await updateLectureApi(
        moduleId,
        lessonId,
        updatedLesson.title || activeLesson.title,
        updatedLesson.type || activeLesson.type,
        updatedLesson.file
      );

      const normalizedModule = {
        id: updatedModule.id,
        title: updatedModule.title,
        lessons: updatedModule.lectures || [],
      };

      setModules((prev) =>
        prev.map((m) => (m.id === moduleId ? normalizedModule : m))
      );
    } catch (err) {
      console.error("❌ Error updating lesson:", err);
      alert("Failed to update lesson");
    }
  };
  // Rename just replaces the title directly
  // Rename (pass id, newTitle, and module)
  const handleRenameModule = async (id, newTitle, module) => {
    // console.log('handleRenameModule', id, newTitle, module);
    if (!newTitle.trim()) {
      alert("Module title cannot be empty");
      return;
    }
    try {
      const updatedModule = await editModuleApi(id, newTitle);
      setModules((prev) =>
        prev.map((m) =>
          m.id === id ? { ...m, title: updatedModule.title } : m
        )
      );
    } catch (err) {
      console.error("❌ Error renaming module:", err);
      alert("Failed to rename module");
    }
  };

  // Delete with confirmation
  const handleDeleteModule = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this module?");
    if (!confirmDelete) return;

    try {
      await deleteModuleApi(id);
      setModules((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error("❌ Error deleting module:", err);
      alert("Failed to delete module");
    }
  };





  return (
    <div className="course-builder">
      {/* Sidebar */}
      <div className="course-sidebar">
        <div className="courses-title">Course Builder</div>
        <div className="module-input">
          <div className="module-list">
            {modules.map((m) => (
              <div
                key={m.id}
                className={`module-item ${activeModuleId === m.id ? "active" : ""}`}
                onClick={() => {
                  setActiveModuleId(m.id);
                  setActiveLessonId(null);
                }}
              >
                <span
                  className="editable-title"
                  contentEditable={m.isEditing ? "true" : "false"}
                  suppressContentEditableWarning={true}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const newTitle = e.currentTarget.textContent.trim();
                      if (newTitle && newTitle !== m.title) {
                        handleRenameModule(m.id, newTitle, m); // pass module also
                      }
                      setModules((prev) =>
                        prev.map((mod) =>
                          mod.id === m.id ? { ...mod, isEditing: false } : mod
                        )
                      );
                    }
                  }}
                >
                  {m.title}
                </span>

                {/* 3-dot menu */}
                <div className="module-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="three-dots"
                    onClick={() => setOpenMenuId(openMenuId === m.id ? null : m.id)}
                  >
                    ⋮
                  </button>

                  {openMenuId === m.id && (
                    <div className="actions-dropdown">
                      <p
                        onClick={() =>
                          setModules((prev) =>
                            prev.map((mod) =>
                              mod.id === m.id ? { ...mod, isEditing: true } : mod
                            )
                          )
                        }
                      >
                        Rename
                      </p>
                      <p onClick={() => handleDeleteModule(m.id)}>Delete</p>
                    </div>
                  )}
                </div>
              </div>
            ))}



          </div>
          <input
            type="text"
            placeholder="Enter module name..."
            value={newModuleName}
            onChange={(e) => setNewModuleName(e.target.value)}
          />
          <button onClick={addModule} className="add-module-btn">
            + Add Module
          </button>
        </div>
      </div>

      {/* Middle Panel */}
      <div className="course-lessons">
        {activeModule ? (
          <>
            <div className="courses-title">{activeModule.title}</div>
            <div className="lesson-list">
              {activeModule.lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className={`lesson-item ${activeLessonId === lesson.id ? "active" : ""
                    }`}
                  onClick={() => setActiveLessonId(lesson.id)}
                >
                  <span className="lesson-icon">
                    {lesson.type === "video" ? (
                      <img src={lms_play_icon1} alt="Video Icon" className="lesson-icon-img" />
                    ) : (
                      <img src={lms_file_icon} alt="Document Icon" className="lesson-icon-img" />
                    )}
                  </span>
                  {lesson.title || "Untitled Lesson"}
                </div>
              ))}

              <div>
                <div
                  className="add-lesson-card"
                  onClick={() => addLesson(activeModule.id)}
                >
                  <img
                    src={lms_plus_icon}
                    alt="Add Lesson"
                    className="add-lesson-icon"
                  />
                  <div className="add-lesson-text">
                    <p>Add Lesson</p>
                    <p>Upload a video, document.</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <p className="empty-message">Module Title</p>
        )}
      </div>

      {/* Right Panel */}
      <div className="course-edit-panel">
        {activeLesson ? (
          <>
            <div className="courses-title">Edit Lesson</div>
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={activeLesson.title}
                onChange={(e) => {
                  setModules((prev) =>
                    prev.map((m) =>
                      m.id === activeModule.id
                        ? {
                          ...m,
                          lessons: m.lessons.map((l) =>
                            l.id === activeLesson.id ? { ...l, title: e.target.value } : l
                          ),
                        }
                        : m
                    )
                  );
                }}
              />

            </div>

            <div className="form-group">
              <label>Type</label>
              <div className="type-toggle">
                {/* Video Button */}
                <button
                  className={activeLesson.type === "video" ? "active" : ""}
                  onClick={() =>
                    setModules((prev) =>
                      prev.map((m) =>
                        m.id === activeModule.id
                          ? {
                            ...m,
                            lessons: m.lessons.map((l) =>
                              l.id === activeLesson.id ? { ...l, type: "video" } : l
                            ),
                          }
                          : m
                      )
                    )
                  }
                >
                  <img
                    src={activeLesson.type === "video" ? lms_tab_icon1 : lms_tab_icon2}
                    alt="Video Icon"
                    className="type-icon"
                  />
                  Video
                </button>

                {/* Document Button */}
                <button
                  className={activeLesson.type === "document" ? "active" : ""}
                  onClick={() =>
                    setModules((prev) =>
                      prev.map((m) =>
                        m.id === activeModule.id
                          ? {
                            ...m,
                            lessons: m.lessons.map((l) =>
                              l.id === activeLesson.id ? { ...l, type: "document" } : l
                            ),
                          }
                          : m
                      )
                    )
                  }
                >
                  <img
                    src={activeLesson.type === "document" ? lms_tab_icon4 : lms_tab_icon3}
                    alt="Document Icon"
                    className="type-icon"
                  />
                  Document
                </button>
              </div>
            </div>


            <div className="form-group">
              {activeLesson.type === "video" ? (
                <div className="upload-box">
                  {!activeLesson.file && !activeLesson.attachment ? (
                    <div className="upload-placeholder">
                      <img src={lms_play_icon1} alt="Video Icon" className="upload-icon" />
                      <p style={{ fontWeight: "400", fontSize: "12px" }}>Drag your video to start uploading</p>
                      <div className="video-dash-line-section">
                        <div className="video-or-line">
                        </div>
                        <p>OR</p>
                        <div className="video-or-line"></div>
                      </div>
                      {/* Hidden native input */}
                      <input
                        type="file"
                        id="videoUpload"
                        className="hidden-file-input"
                        accept="video/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setModules((prev) =>
                              prev.map((m) =>
                                m.id === activeModule.id
                                  ? {
                                    ...m,
                                    lessons: m.lessons.map((l) =>
                                      l.id === activeLesson.id ? { ...l, tempFile: file } : l
                                    ),
                                  }
                                  : m
                              )
                            );
                          }
                        }}
                      />

                      {/* Styled trigger */}
                      <label htmlFor="videoUpload" className="custom-upload-video-btn">
                        Select Video
                      </label>

                      {activeLesson.tempFile && (
                        <div className="file-name">{activeLesson.tempFile.name}</div>
                      )}
                    </div>
                  ) : (
                    <div className="video-preview">
                      <video
                        controls
                        src={
                          activeLesson.tempFile
                            ? URL.createObjectURL(activeLesson.tempFile) // 🔑 show local preview immediately
                            : activeLesson.file
                              ? URL.createObjectURL(activeLesson.file)
                              : activeLesson.attachment?.sasUrl
                        }
                        style={{ width: "100%", borderRadius: "8px" }}
                      />
                      <div className="file-name">
                        {activeLesson.file?.name || activeLesson.attachment?.name}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="upload-box">
                  {!activeLesson.file && !activeLesson.attachment ? (
                    <div className="upload-placeholder">
                      <img src={lms_file_icon} alt="Document Icon" className="upload-icon" />
                      <p style={{ fontWeight: "400", fontSize: "12px" }}>Drag your document to start uploading</p>
                      <p style={{ fontWeight: "400", fontSize: "small" }}>.pdf</p>
                      <div className="doc-dash-line-section">
                        <div className="doc-or-line">
                        </div>
                        <p>OR</p>
                        <div className="doc-or-line"></div>
                      </div>
                      {/* Hidden native input */}
                      <input
                        type="file"
                        id="docUpload"
                        className="hidden-file-input"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setModules((prev) =>
                              prev.map((m) =>
                                m.id === activeModule.id
                                  ? {
                                    ...m,
                                    lessons: m.lessons.map((l) =>
                                      l.id === activeLesson.id ? { ...l, tempFile: file } : l
                                    ),
                                  }
                                  : m
                              )
                            );
                          }
                        }}
                      />

                      {/* Styled trigger */}
                      <label htmlFor="docUpload" className="custom-upload-doc-btn">
                        Select Document
                      </label>

                      {activeLesson.tempFile && (
                        <div className="file-name">{activeLesson.tempFile.name}</div>
                      )}
                    </div>
                  ) : (
                    <div className="doc-preview" style={{ flex: "auto" }}>
                      <p>{activeLesson.file?.name || activeLesson.attachment?.name}</p>
                    </div>
                  )}
                </div>
              )}


              {/* ✅ Upload button placed outside */}
              <button
                className="upload-btn"
                disabled={uploading}
                onClick={() => {
                  const fileToUpload = activeLesson.tempFile || activeLesson.file;
                  if (fileToUpload) {
                    setUploading(true);
                    updateLesson(activeModule.id, activeLesson.id, {
                      title: activeLesson.title,
                      type: activeLesson.type,
                      file: fileToUpload,
                    })
                      .catch((err) => {
                        console.error("❌ Upload failed", err);
                      })
                      .finally(() => {
                        setUploading(false);
                      });
                  }
                }}
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>

            </div>
            <button
              className="save-btn"
              disabled={saving}
              onClick={() => {
                setSaving(true);
                updateLesson(activeModule.id, activeLesson.id, {
                  title: activeLesson.title,
                  type: activeLesson.type,
                  file: activeLesson.file,
                })
                  .catch((err) => {
                    console.error("❌ Save failed", err);
                  })
                  .finally(() => {
                    setSaving(false);
                  });
              }}
            >
              {saving ? "Saving..." : "Save and Preview"}
            </button>

          </>
        ) : (
          <p className="empty-message">Edit Lesson</p>
        )}
      </div>
    </div>
  );
};

export default AdminCourseCreation;
