/**
 * EXPERIMENTATION FILE: Sidebar Scroll UI/UX Improvements
 *
 * This component demonstrates three different approaches to improve the scrollbar
 * overlapping issue in the sidebar. Toggle between approaches to compare visually.
 *
 * Approach 1: Bounded Container with Dedicated Scrollbar
 * Approach 2: Overlay Scrollbar (Modern)
 * Approach 3: Content Carousel with Pagination
 *
 * To use this file:
 * 1. Import this component in Sidebar.js
 * 2. Temporarily wrap the .sidebar-scroll-content div with this component
 * 3. Use the toggle button at the top to switch between approaches
 * 4. After deciding on the best approach, apply the CSS changes to Sidebar.css
 */

import React, { useState } from "react";
import "../../Styles/general-styles/SidebarScrollExperiments.css";

const SidebarScrollExperiments = ({ children }) => {
  const [experimentMode, setExperimentMode] = useState("approach-2"); // Default to overlay

  return (
    <div className="experiment-wrapper">
      {/* Dev-only toggle controls */}
      <div className="experiment-toggle-bar">
        <span className="experiment-label">Scroll UX Experiments:</span>
        <button
          className={`experiment-btn ${experimentMode === "approach-1" ? "active" : ""}`}
          onClick={() => setExperimentMode("approach-1")}
        >
          Bounded Container
        </button>
        <button
          className={`experiment-btn ${experimentMode === "approach-2" ? "active" : ""}`}
          onClick={() => setExperimentMode("approach-2")}
        >
          Overlay Scrollbar
        </button>
        <button
          className={`experiment-btn ${experimentMode === "approach-3" ? "active" : ""}`}
          onClick={() => setExperimentMode("approach-3")}
        >
          Carousel
        </button>
      </div>

      {/* Approach 1: Bounded Container with Dedicated Scrollbar */}
      {experimentMode === "approach-1" && (
        <div className="experiment-content approach-1">
          <div className="approach-1-info">
            <h4>Approach 1: Bounded Container</h4>
            <p>✓ Clear visual hierarchy</p>
            <p>✓ Scrollbar doesn't interfere</p>
            <p>✓ Easy to interact with</p>
          </div>
          <div className="sidebar-scroll-container-v1">{children}</div>
        </div>
      )}

      {/* Approach 2: Overlay Scrollbar */}
      {experimentMode === "approach-2" && (
        <div className="experiment-content approach-2">
          <div className="approach-2-info">
            <h4>Approach 2: Overlay Scrollbar (Recommended)</h4>
            <p>✓ Modern, minimalist aesthetic</p>
            <p>✓ No layout shift</p>
            <p>✓ Works great on touch devices</p>
          </div>
          <div className="sidebar-scroll-container-v2">{children}</div>
        </div>
      )}

      {/* Approach 3: Carousel with Pagination */}
      {experimentMode === "approach-3" && (
        <div className="experiment-content approach-3">
          <div className="approach-3-info">
            <h4>Approach 3: Carousel with Pagination</h4>
            <p>✓ Touch-friendly swipe</p>
            <p>✓ Cleaner mobile experience</p>
            <p>✓ Guided navigation with dots</p>
          </div>
          <div className="sidebar-scroll-container-v3">{children}</div>
          <div className="carousel-pagination">
            <span className="dot active"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SidebarScrollExperiments;
