import React, { useEffect, useState } from "react";
import "../../../Styles/StaffOnboarding.css";
import { FaRegEdit } from "react-icons/fa";
import { ReactSortable } from "react-sortablejs"; // ✅ new package
import { FaPencilAlt } from "react-icons/fa";
import { getAllModulesApi } from "./AdminCourseApis";
const StaffOnboarding = (props) => {
  console.log('StaffOnboarding props', props);
  const [expandedSections, setExpandedSections] = useState({});
  const [selectedLecture, setSelectedLecture] = useState("2");
  const [lectureCompletionStatus, setLectureCompletionStatus] = useState({});
  const [editingSection, setEditingSection] = useState(null);
  const [editingLecture, setEditingLecture] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [modules, setModules] = useState([]);
  const AdminEmail = props?.user?.email;
  console.log("AdminEmail:", AdminEmail);
  const getSectionProgress = (section) => {
    const total = section.items.length;
    const completed = section.items.filter((item) => lectureCompletionStatus[item.id]).length;

    if (total === 0) return "0% finish (0/0)";
    const percent = Math.round((completed / total) * 100);
    return `${percent}% finish (${completed}/${total})`;
  };
  const getVideoDuration = (url) => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";

      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        const duration = video.duration; // in seconds
        resolve(duration);
      };

      video.onerror = () => reject("Failed to load video metadata");
      video.src = url;
    });
  };

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const rawModules = await getAllModulesApi(AdminEmail);
        console.log("Fetched modules:", rawModules);

        // normalize: convert `lectures` → `lessons`
        const normalizedModules = rawModules.map(m => ({
          id: m.id,
          title: m.title,
          lessons: m.lectures || [],   // ✅ map lectures to lessons,
        }));
        console.log("Normalized modules:", normalizedModules);
        setModules(normalizedModules);
      } catch (err) {
        console.error("❌ Error fetching modules:", err);
        alert("Failed to load modules");
      }
    };

    fetchModules();
  }, []);
  console.log("Fetched Modules", modules);
  const [sections, setSections] = useState([]);
  useEffect(() => {
    const fetchDurations = async () => {
      const processedModules = await Promise.all(
        modules.map(async (mod) => {
          const lectures = await Promise.all(
            (mod.lectures || mod.lessons || []).map(async (lec) => {
              if (lec.type === "video" && lec.attachment?.sasUrl) {
                try {
                  const sec = await getVideoDuration(lec.attachment.sasUrl);
                  const min = Math.floor(sec / 60);
                  const s = Math.floor(sec % 60);
                  return {
                    ...lec,
                    durationSeconds: sec,
                    duration: `${min}:${s.toString().padStart(2, "0")}`,
                  };
                } catch {
                  return { ...lec, durationSeconds: 0, duration: "00:00" };
                }
              }
              return { ...lec, durationSeconds: 0, duration: "—" }; // for docs
            })
          );

          // sum total module duration
          const totalSec = lectures.reduce((sum, l) => sum + (l.durationSeconds || 0), 0);
          const hrs = Math.floor(totalSec / 3600);
          const mins = Math.floor((totalSec % 3600) / 60);
          const secs = Math.floor(totalSec % 60);
          const totalFormatted =
            hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m ${secs.toString().padStart(2, "0")}s`;

          return {
            id: mod.id,
            name: mod.title,
            lectures: lectures.length,
            duration: totalFormatted,
            progress: `0% finish (0/${lectures.length})`,
            items: lectures.map((l) => ({
              id: l.id,
              title: l.title,
              duration: l.duration,
              type: l.type,
              attachment: l.attachment,
            })),
          };
        })
      );

      setSections(processedModules);
    };

    if (modules.length) fetchDurations();
  }, [modules]);



  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const handleLectureClick = (lectureId) => setSelectedLecture(lectureId);

  const toggleLectureCompletion = (lectureId, e) => {
    e.stopPropagation();
    setLectureCompletionStatus((prev) => ({
      ...prev,
      [lectureId]: !prev[lectureId],
    }));
  };

  const isLectureCompleted = (lectureId) => lectureCompletionStatus[lectureId] || false;

  const getSelectedLectureTitle = () => {
    for (const section of sections) {
      const lecture = section.items.find((item) => item.id === selectedLecture);
      if (lecture) {
        return `${lecture.title}`;
      }
    }
    return "";
  };

  const handleSectionEdit = (index, newName) => {
    setSections((prev) => {
      const updated = [...prev];
      updated[index].name = newName;
      return updated;
    });
    setEditingSection(null);
  };

  const handleLectureEdit = (sectionIndex, itemIndex, newTitle) => {
    setSections((prev) => {
      const updated = [...prev];
      updated[sectionIndex].items[itemIndex].title = newTitle;
      return updated;
    });
    setEditingLecture(null);
  };

  return (
    <div className="staff-onboarding-page">
      <div className="staff-onboarding-container">
        {/* LEFT: Video Section */}
        <div className="video-section">
          <div className="video-player">
            {(() => {
              const selected = sections
                .flatMap((s) => s.items)
                .find((item) => item.id === selectedLecture);
              console.log("Selected lecture:", selected);
              if (!selected) {
                return <p>Select a lecture to start</p>;
              }

              if (selected.type === "video") {
                return (
                  <video className="video-thumbnail" controls width="100%" height="auto">
                    <source src={selected.attachment?.sasUrl || selected.attachment?.url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                );
              } else if (selected.type === "document") {
                return (
                  <iframe
                    src={`https://docs.google.com/gview?url=${encodeURIComponent(
                      selected.attachment?.sasUrl || selected.attachment?.url
                    )}&embedded=true`}
                    width="100%"
                    height="600"
                    title={selected.title}
                    style={{ border: "none" }}
                  />
                );
              }
            })()}
          </div>

          <p className="video-title">
            <strong>{getSelectedLectureTitle()}</strong>
          </p>
        </div>

        {/* RIGHT: Course Contents */}
        <div className="course-contents">
          <div className="course-header">
            <h3>Course Contents</h3>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="progress-text">15% Completed</span>
              <span
                className="edit-icon"
                style={{ cursor: "pointer" }}
                onClick={() => setIsEditMode(!isEditMode)}
              >
                {props.role === 'Admin' && <FaRegEdit size={18} />}
              </span>
            </div>
          </div>

          {/* ✅ Section Reordering */}
          <ReactSortable
            list={sections}
            setList={setSections}
            ghostClass="no-ghost"
            chosenClass="sortable-chosen"
            animation={200}
            disabled={!isEditMode}
            scroll={true}              // ✅ enable auto-scroll
            scrollSensitivity={80}     // ✅ how close to edge before scroll (px)
            scrollSpeed={15}
          >
            {sections.map((section, index) => {
              const isExpanded = expandedSections[section.id];
              return (
                <div key={section.id} className={`course-section ${isExpanded ? "expanded" : ""}`}>
                  {/* Section title */}
                  <div
                    className="section-title"
                    onClick={() => !isEditMode && toggleSection(section.id)}
                  >
                    <div className="section-name">
                      <span className={`expand-icon ${isExpanded ? "rotated" : ""}`}>
                        ▶
                      </span>
                      {editingSection === index ? (
                        <input
                          type="text"
                          defaultValue={section.name}
                          autoFocus
                          onBlur={(e) => handleSectionEdit(index, e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleSectionEdit(index, e.target.value)
                          }
                        />
                      ) : (
                        <>
                          <span>{section.name}</span>
                          <span
                            className="edit-icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingSection(index);
                            }}
                            style={{ marginLeft: "8px", cursor: "pointer" }}
                          >
                            {props.role === 'Admin' && <FaPencilAlt size={16} color="#6c4cdc" />}
                          </span>
                        </>
                      )}
                    </div>
                    <span className="section-progress">
                      {section.lectures} lectures · {section.duration} · {getSectionProgress(section)}
                    </span>
                  </div>

                  {/* ✅ Lecture Reordering */}
                  {isExpanded && (
                    <ReactSortable
                      list={section.items}
                      ghostClass="no-ghost"
                      chosenClass="sortable-chosen"
                      setList={(newList) =>
                        setSections((prev) =>
                          prev.map((s, i) =>
                            i === index ? { ...s, items: newList } : s
                          )
                        )
                      }
                      animation={200}
                      disabled={!isEditMode}
                      scroll={true}              // ✅ enable auto-scroll
                      scrollSensitivity={80}     // ✅ how close to edge before scroll (px)
                      scrollSpeed={15}
                    >
                      {section.items.map((item, itemIndex) => {
                        const isActive = selectedLecture === item.id;
                        const isCompleted = isLectureCompleted(item.id);
                        const isLastItem = itemIndex === section.items.length - 1;

                        return (
                          <div
                            key={item.id}
                            className={`lecture ${isActive ? "active" : ""} ${isLastItem ? "last-item" : ""
                              }`}
                            onClick={() => handleLectureClick(item.id)}
                          >
                            <div className="lecture-content">
                              <input
                                type="checkbox"
                                checked={isCompleted}
                                onChange={(e) => toggleLectureCompletion(item.id, e)}
                                className="lecture-checkbox"
                              />
                              {editingLecture?.id === item.id ? (
                                <input
                                  type="text"
                                  defaultValue={item.title}
                                  autoFocus
                                  onBlur={(e) =>
                                    handleLectureEdit(index, itemIndex, e.target.value)
                                  }
                                  onKeyDown={(e) =>
                                    e.key === "Enter" &&
                                    handleLectureEdit(index, itemIndex, e.target.value)
                                  }
                                />
                              ) : (
                                <span
                                  className={`lecture-title ${isCompleted ? "completed" : ""
                                    }`}
                                >
                                  {item.title}
                                </span>
                              )}
                            </div>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column-reverse",
                                alignItems: "flex-end",
                                gap: "4px",
                              }}
                            >
                              <span className="time">{item.duration}</span>
                              {editingLecture?.id !== item.id && (
                                <span
                                  className="edit-icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingLecture({ id: item.id });
                                  }}
                                  style={{ cursor: "pointer" }}
                                >
                                  {props.role === 'Admin' && <FaPencilAlt size={16} color="#6c4cdc" />}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </ReactSortable>
                  )}
                </div>
              );
            })}
          </ReactSortable>
        </div>
      </div>
    </div>
  );
};

export default StaffOnboarding;
