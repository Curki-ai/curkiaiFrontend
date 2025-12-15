import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";

export default function AIAnalysisReportViewer({ reportText, loading,onDownload }) {
  if (loading) {
    return (
      <div
        style={{
          textAlign: "center",
          // padding: "20px",
          color: "#6b7280",
          fontFamily: "Inter, sans-serif",
        }}
      >
        ⏳ Generating AI insights...
      </div>
    );
  }

  if (!reportText) return null;

  return (
    <div
      className="ai-markdown-body"
      style={{
        background: "#ffffff",
        borderRadius: "12px",
        // padding: "28px",
        marginBottom: "30px",
        border: "1px solid #e5e7eb",
        fontFamily: "Inter, sans-serif",
        fontSize: "15px",
        lineHeight: "1.75",
        color: "#1f2937",
        textAlign: "left", // ✅ FORCE LEFT ALIGN
        marginLeft:"10px"
      }}
    >
      <ReactMarkdown
        children={reportText.replace(/```(?:markdown)?|```/g, "")}
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
        components={{
          /* ---------- TITLES ---------- */
          h1: () => null,

          h2: ({ node, ...props }) => (
            <h2
              style={{
                fontSize: "20px",
                fontWeight: 700,
                marginTop: "28px",
                marginBottom: "12px",
                borderBottom: "1px solid #e5e7eb",
                paddingBottom: "6px",
                color: "#111827",
                textAlign: "left",
                marginLeft:"10px"
              }}
              {...props}
            />
          ),

          h3: ({ node, ...props }) => (
            <h3
              style={{
                fontSize: "16px",
                fontWeight: 600,
                marginTop: "18px",
                marginBottom: "8px",
                color: "#374151",
                textAlign: "left",
                marginLeft:"10px"
              }}
              {...props}
            />
          ),

          /* ---------- TEXT ---------- */
          p: ({ node, ...props }) => (
            <p
              style={{
                marginBottom: "10px",
                color: "#2d2d2d",
                textAlign: "left",
                marginLeft:"10px"
              }}
              {...props}
            />
          ),

          strong: ({ node, ...props }) => (
            <strong
              style={{
                fontWeight: 600,
                color: "#111827",
                marginLeft:"10px"
              }}
              {...props}
            />
          ),

          /* ---------- LISTS ---------- */
          ul: ({ node, ...props }) => (
            <ul
              style={{
                paddingLeft: "22px",
                marginBottom: "12px",
                listStyleType: "disc",
                textAlign: "left",
                marginLeft:"10px"
              }}
              {...props}
            />
          ),

          ol: ({ node, ...props }) => (
            <ol
              style={{
                paddingLeft: "22px",
                marginBottom: "12px",
                listStyleType: "decimal",
                textAlign: "left",
                marginLeft:"10px"
              }}
              {...props}
            />
          ),

          li: ({ node, ...props }) => (
            <li
              style={{
                marginBottom: "6px",
                marginLeft:"10px"
              }}
              {...props}
            />
          ),

          /* ---------- TABLE ---------- */
          table: ({ node, ...props }) => (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginTop: "14px",
                marginBottom: "20px",
                fontSize: "14px",
                textAlign: "left",
                marginLeft:"10px"
              }}
              {...props}
            />
          ),

          th: ({ node, ...props }) => (
            <th
              style={{
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                padding: "8px",
                fontWeight: 600,
                color: "#111827",
                marginLeft:"10px"
              }}
              {...props}
            />
          ),

          td: ({ node, ...props }) => (
            <td
              style={{
                border: "1px solid #e5e7eb",
                padding: "8px",
                color: "#374151",
                marginLeft:"10px"
              }}
              {...props}
            />
          ),
        }}
      />
    </div>
  );
}
