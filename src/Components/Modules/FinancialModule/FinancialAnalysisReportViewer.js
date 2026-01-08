import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";

/**
 * Normalize financial response into markdown string
 */
const normalizeFinancialReport = (data) => {
  if (!data) return "";

  if (typeof data === "string") {
    return data
      // 🔧 Fix inline headings like: ### A ### B ### C
      .replace(/(###\s+Appendix[^#]+)(?=\s+###)/g, "$1\n\n")
      // 🔧 Ensure each appendix starts on new line
      .replace(/###\s+/g, "\n### ");
  }

  if (typeof data === "object") {
    let md = "";

    Object.entries(data).forEach(([key, value]) => {
      if (!value) return;

      const title = key
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

      md += `## ${title}\n\n`;

      if (typeof value === "string") {
        md += value
          .replace(/(###\s+Appendix[^#]+)(?=\s+###)/g, "$1\n\n")
          .replace(/###\s+/g, "\n### ");
        md += "\n\n";
      }
    });

    return md;
  }

  return "";
};


export default function FinancialAnalysisReportViewer({
  reportText,
  loading,
}) {
  if (loading) {
    return (
      <div
        style={{
          textAlign: "center",
          color: "#6b7280",
          fontFamily: "Inter, sans-serif",
          padding: "16px",
        }}
      >
        ⏳ Generating AI insights...
      </div>
    );
  }

  const markdown = normalizeFinancialReport(reportText);
  if (!markdown) return null;

  return (
    <div
      className="ai-markdown-body"
      style={{
        background: "#ffffff",
        borderRadius: "12px",
        marginBottom: "30px",
        // border: "1px solid #e5e7eb",
        fontFamily: "Inter, sans-serif",
        fontSize: "15px",
        lineHeight: "1.75",
        color: "#1f2937",
        // padding: "24px",
      }}
    >
      <ReactMarkdown
        children={markdown.replace(/```(?:markdown)?|```/g, "")}
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
        components={{
          h1: () => null,

          h2: ({ ...props }) => (
            <h2
              style={{
                fontSize: "20px",
                fontWeight: 700,
                marginTop: "28px",
                marginBottom: "12px",
                borderBottom: "1px solid #e5e7eb",
                paddingBottom: "6px",
                color: "#111827",
              }}
              {...props}
            />
          ),

          h3: ({ ...props }) => (
            <h3
              style={{
                fontSize: "16px",
                fontWeight: 600,
                marginTop: "18px",
                marginBottom: "8px",
                color: "#374151",
              }}
              {...props}
            />
          ),

          p: ({ ...props }) => (
            <p
              style={{
                marginBottom: "10px",
                color: "#2d2d2d",
              }}
              {...props}
            />
          ),

          strong: ({ ...props }) => (
            <strong
              style={{
                fontWeight: 600,
                color: "#111827",
              }}
              {...props}
            />
          ),

          ul: ({ ...props }) => (
            <ul
              style={{
                paddingLeft: "22px",
                marginBottom: "12px",
                listStyleType: "disc",
              }}
              {...props}
            />
          ),

          li: ({ ...props }) => (
            <li style={{ marginBottom: "6px" }} {...props} />
          ),

          table: ({ ...props }) => (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginTop: "14px",
                marginBottom: "20px",
                fontSize: "14px",
              }}
              {...props}
            />
          ),

          th: ({ ...props }) => (
            <th
              style={{
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                padding: "8px",
                fontWeight: 600,
                textAlign: "left",
              }}
              {...props}
            />
          ),

          td: ({ ...props }) => (
            <td
              style={{
                border: "1px solid #e5e7eb",
                padding: "8px",
              }}
              {...props}
            />
          ),
        }}
      />
    </div>
  );
}
