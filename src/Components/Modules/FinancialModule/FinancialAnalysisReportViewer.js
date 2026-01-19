import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";

/**
 * Normalize financial response into markdown string
 */
function fixMarkdownTables(markdown) {
  if (!markdown) return markdown;

  const lines = markdown.split("\n");
  const output = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim().startsWith("|") && line.includes("|")) {
      const tableLines = [];

      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }

      if (tableLines.length >= 2) {
        output.push(reconstructTable(tableLines));
      } else {
        output.push(...tableLines);
      }
    } else {
      output.push(line);
      i++;
    }
  }

  return output.join("\n");
}

function reconstructTable(tableLines) {
  const rows = tableLines
    .map(line =>
      line
        .split("|")
        .map(cell => cell.trim())
        .filter((_, i, arr) => i > 0 && i < arr.length - 1)
    )
    // ❌ remove separator rows like ----, :----:, ---:
    .filter(row =>
      !row.every(cell => /^:?-+:?$/.test(cell))
    )
    // ❌ remove ellipsis placeholder rows like ... | ... | ...
    .filter(row =>
      !row.every(cell => cell === "...")
    )
    // ❌ remove fully empty rows
    .filter(row =>
      row.some(cell => cell !== "")
    );

  if (rows.length < 2) return tableLines.join("\n");

  const headers = rows[0];
  const dataRows = rows.slice(1);

  let table = "";

  // Header row
  table += "| " + headers.join(" | ") + " |\n";

  // Alignment row (always valid markdown)
  table += "| " + headers.map(() => "---").join(" | ") + " |\n";

  // Data rows
  dataRows.forEach(row => {
    while (row.length < headers.length) row.push("");
    table += "| " + row.slice(0, headers.length).join(" | ") + " |\n";
  });

  return table;
}


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

  const cleaned = normalizeFinancialReport(reportText)
    .replace(/```(?:markdown)?|```/g, "");

  const markdown = fixMarkdownTables(cleaned);
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

          td: ({ style, children, ...props }) => (
            <td
              style={{
                border: "1px solid #e5e7eb",
                padding: "8px",

                // ✅ FIX FOR BROKEN CELLS
                whiteSpace: "nowrap",
                wordBreak: "keep-all",

                ...style,
              }}
              {...props}
            >
              {children}
            </td>
          ),

        }}
      />
    </div>
  );
}
