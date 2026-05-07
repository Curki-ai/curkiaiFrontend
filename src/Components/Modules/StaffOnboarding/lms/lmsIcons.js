import React from "react";
import {
  FiVideo,
  FiFileText,
  FiHelpCircle,
  FiPaperclip,
  FiFile,
} from "react-icons/fi";

// Single source of truth for lesson-type icons. Used across the editor
// (curriculum tree, lesson type tabs, type picker) and learner views
// (course detail, player sidebar) so a future icon change is one edit.
const LESSON_TYPE_ICONS = {
  video: FiVideo,
  text: FiFileText,
  quiz: FiHelpCircle,
  file: FiPaperclip,
};

export const LessonTypeIcon = ({ type, ...rest }) => {
  const Icon = LESSON_TYPE_ICONS[type] || FiFile;
  return <Icon {...rest} />;
};

export const LESSON_TYPE_KEYS = Object.keys(LESSON_TYPE_ICONS);
