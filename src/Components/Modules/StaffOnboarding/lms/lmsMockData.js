// Mock data for the LMS redesign preview.
// This file is intentionally isolated — it does not touch any existing API.

export const initialCourses = [
  {
    id: "c1",
    title: "Staff Onboarding Program",
    category: "Compliance & HR",
    desc:
      "Complete orientation program for new staff members covering policies, procedures, and care standards.",
    status: "published",
    enrollments: 24,
    completions: 18,
    thumb: "📋",
    color: "#7c5cbf",
    duration: "4.5 hrs",
    level: "All Staff",
    objectives: [
      "Understand company values and culture",
      "Complete WHS compliance requirements",
      "Learn client care standards",
      "Pass mandatory orientation assessments",
    ],
    requirements: ["Basic computer literacy", "Signed employment contract"],
    tags: ["Mandatory", "Orientation", "Compliance"],
    sections: [
      {
        id: "s1",
        title: "Welcome & Orientation",
        open: true,
        lessons: [
          {
            id: "l1",
            title: "Welcome to the Team",
            type: "video",
            duration: "8 min",
            published: true,
            videoUrl: "",
            transcript: "",
          },
          {
            id: "l2",
            title: "Company Culture & Values",
            type: "text",
            duration: "12 min",
            published: true,
            content:
              "Welcome aboard! Our culture is built on three pillars: integrity, person-centred care, and continuous improvement.",
          },
          {
            id: "l3",
            title: "Orientation Quiz",
            type: "quiz",
            duration: "10 min",
            published: true,
            quiz: { passScore: 80, maxAttempts: 3, shuffle: true, showResults: true },
            questions: [
              {
                id: "q1",
                question: "What is our core mission?",
                options: [
                  "Person-centred care",
                  "Maximum efficiency",
                  "Cost reduction",
                  "Admin focus",
                ],
                correct: 0,
              },
              {
                id: "q2",
                question: "How often should incidents be reported?",
                options: ["Within 24 hours", "Weekly", "Monthly", "Immediately"],
                correct: 3,
              },
            ],
          },
        ],
      },
      {
        id: "s2",
        title: "Policies & Compliance",
        open: true,
        lessons: [
          {
            id: "l4",
            title: "Code of Conduct",
            type: "text",
            duration: "15 min",
            published: false,
            content: "",
          },
          {
            id: "l5",
            title: "WHS Procedures",
            type: "video",
            duration: "20 min",
            published: false,
            videoUrl: "",
            transcript: "",
          },
          {
            id: "l6",
            title: "Compliance Assessment",
            type: "quiz",
            duration: "15 min",
            published: false,
            quiz: { passScore: 80, maxAttempts: 3, shuffle: true, showResults: true },
            questions: [],
          },
        ],
      },
      {
        id: "s3",
        title: "Client Care Standards",
        open: true,
        lessons: [
          {
            id: "l7",
            title: "Person-Centred Care",
            type: "text",
            duration: "18 min",
            published: false,
            content: "",
          },
          {
            id: "l8",
            title: "Documentation Standards",
            type: "file",
            duration: "10 min",
            published: false,
            fileName: "",
          },
        ],
      },
    ],
  },
  {
    id: "c2",
    title: "WHS & Safety Training",
    category: "Health & Safety",
    desc:
      "Mandatory work health and safety training for all employees per Australian safety standards.",
    status: "published",
    enrollments: 31,
    completions: 28,
    thumb: "⛑️",
    color: "#e8734a",
    duration: "2.5 hrs",
    level: "All Staff",
    objectives: [
      "Identify workplace hazards",
      "Report incidents correctly",
      "Use PPE properly",
    ],
    requirements: ["Complete Staff Onboarding first"],
    tags: ["Mandatory", "Safety", "WHS"],
    sections: [
      {
        id: "s1",
        title: "Hazard Identification",
        open: true,
        lessons: [
          {
            id: "l1",
            title: "Recognising Hazards",
            type: "video",
            duration: "15 min",
            published: true,
            videoUrl: "",
            transcript: "",
          },
          {
            id: "l2",
            title: "Risk Assessment Quiz",
            type: "quiz",
            duration: "10 min",
            published: true,
            quiz: { passScore: 80, maxAttempts: 3, shuffle: true, showResults: true },
            questions: [],
          },
        ],
      },
    ],
  },
  {
    id: "c3",
    title: "Medication Management",
    category: "Clinical Care",
    desc:
      "Safe medication handling and administration procedures for clinical and care staff.",
    status: "draft",
    enrollments: 0,
    completions: 0,
    thumb: "💊",
    color: "#e84a6f",
    duration: "3 hrs",
    level: "Care Workers",
    objectives: [
      "Safe medication handling",
      "Understand dosage requirements",
      "Incident reporting for medication errors",
    ],
    requirements: ["Nursing or care qualification", "WHS Training completed"],
    tags: ["Clinical", "Medication", "Care Workers"],
    sections: [
      {
        id: "s1",
        title: "Medication Basics",
        open: true,
        lessons: [
          {
            id: "l1",
            title: "Types of Medications",
            type: "text",
            duration: "20 min",
            published: false,
            content: "",
          },
          {
            id: "l2",
            title: "Administration Procedures",
            type: "video",
            duration: "25 min",
            published: false,
            videoUrl: "",
            transcript: "",
          },
        ],
      },
    ],
  },
];

export const blankCourse = () => ({
  id: `c${Date.now()}`,
  title: "Untitled Course",
  category: "",
  desc: "",
  status: "draft",
  enrollments: 0,
  completions: 0,
  thumb: "📚",
  color: "#7c5cbf",
  duration: "",
  level: "All Staff",
  objectives: [""],
  requirements: [""],
  tags: [],
  sections: [
    {
      id: `s${Date.now()}`,
      title: "Section 1",
      open: true,
      lessons: [],
    },
  ],
});

export const blankLesson = (type = "video") => {
  const base = {
    id: `l${Date.now()}`,
    title: "New Lesson",
    type,
    duration: "5 min",
    published: false,
  };
  if (type === "video") return { ...base, videoUrl: "", transcript: "" };
  if (type === "text") return { ...base, content: "" };
  if (type === "quiz") {
    return {
      ...base,
      quiz: { passScore: 80, maxAttempts: 3, shuffle: true, showResults: true },
      questions: [],
    };
  }
  if (type === "file") return { ...base, fileName: "" };
  return base;
};

export const blankQuestion = () => ({
  id: `q${Date.now()}`,
  question: "New question",
  options: ["Option A", "Option B", "Option C", "Option D"],
  correct: 0,
});
