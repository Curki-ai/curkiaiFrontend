import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import "../../Styles/general-styles/PulsatingLoader.css";
import AnaylsingWithAi from "../../Images/AnalysingWithAi.png";

export default function PulsatingLoader({ currentTask,progress }) {
  // const [progress, setProgress] = useState(0);
  const [tasks, setTasks] = useState([]);

  // Smooth progress
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setProgress((prev) => (prev >= 100 ? 100 : prev + 0.2));
  //   }, 30);
  //   return () => clearInterval(interval);
  // }, []);

  // When new task comes in → active at top, completed below
  useEffect(() => {
    if (!currentTask) return;
  
    setTasks((prev) => {
      if (prev.find((t) => t.text === currentTask)) return prev;
  
    
      const updated = [
        { id: Date.now(), text: currentTask, status: "ongoing" },
        ...prev.map((t) => ({ ...t, status: "completed" })),
      ];
      return updated.slice(0, 3);
    });
  }, [currentTask]);
  

  return (
    <div className="app-containerssss">
      <motion.div
        className="ai-icons"
        animate={{ rotate: [0, 3, -3, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <img
          src={AnaylsingWithAi}
          alt="Analysing With Ai"
          style={{ width: "100%", height: "100%" }}
        />
      </motion.div>

      <h1 className="titlesss">Analyzing with AI</h1>

      <div className="progress-barss">
        <motion.div
          className="progress-fillss"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.05, ease: "linear" }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div className="task-timeline">
          <AnimatePresence>
            {tasks.map((task, index) => (
              <motion.div
                key={task.id}
                className="timeline-row"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.4 }}
              >
                <div className="timeline-left">
                  {/* ✅ line above completed tasks only */}
                  {index !== 0 && <div className="timeline-line above-line" />}
                  <motion.div
                    className={`timeline-dot ${task.status === "ongoing" ? "active-dot" : "completed-dot"
                      }`}
                    animate={
                      task.status === "ongoing"
                        ? {
                          scale: [1, 1.3, 1],
                          opacity: [1, 0.7, 1],
                          boxShadow: [
                            "0 0 0 0 rgba(101,72,255,0.4)",
                            "0 0 0 8px rgba(101,72,255,0)",
                            "0 0 0 0 rgba(101,72,255,0)",
                          ],
                        }
                        : {}
                    }
                    transition={
                      task.status === "ongoing"
                        ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
                        : {}
                    }
                  />
                </div>

                <p
                  className={`timeline-text ${task.status === "ongoing" ? "active-text" : "completed-text"
                    }`}
                >
                  {task.text}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
