import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";

/* =========================================================
   🔧 FIX MALFORMED MARKDOWN TABLES
   ========================================================= */

function fixMarkdownTables(markdown) {
  if (!markdown) return markdown;

  const lines = markdown.split("\n");
  const output = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Detect table start (line with pipes)
    if (line.trim().startsWith("|") && line.includes("|")) {
      const tableLines = [];

      // Collect all consecutive table lines
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }

      // Process and fix the table
      if (tableLines.length >= 2) {
        const fixedTable = reconstructTable(tableLines);
        output.push(fixedTable);
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
  // Parse all rows by splitting on pipes
  const rows = tableLines.map(line => {
    return line
      .split("|")
      .map(cell => cell.trim())
      .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1); // Remove first/last empty
  });

  if (rows.length < 2) return tableLines.join("\n");

  const headers = rows[0];
  const alignmentRow = rows[1];
  const dataRows = rows.slice(2);

  // Detect column alignment from alignment row
  const alignments = alignmentRow.map(cell => {
    if (cell.startsWith(":") && cell.endsWith(":")) return "center";
    if (cell.endsWith(":")) return "right";
    return "left";
  });

  // Build clean markdown table
  let table = "";

  // Header row
  table += "| " + headers.join(" | ") + " |\n";

  // Alignment row
  const alignMarkers = alignments.map(align => {
    if (align === "center") return ":---:";
    if (align === "right") return "---:";
    return "---";
  });
  table += "| " + alignMarkers.join(" | ") + " |\n";

  // Data rows
  dataRows.forEach(row => {
    // Pad row if it has fewer columns than headers
    while (row.length < headers.length) {
      row.push("");
    }
    // Trim row if it has more columns
    row = row.slice(0, headers.length);

    table += "| " + row.join(" | ") + " |\n";
  });

  return table;
}

/* =========================================================
   ✅ COMPONENT WITH ENHANCED TABLE RENDERING
   ========================================================= */

export default function AIAnalysisReportViewer({
  reportText,
  loading,
  onDownload,
}) {
  console.log("reportText",reportText)
  if (loading) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "20px",
          color: "#6b7280",
          fontFamily: "Inter, sans-serif",
  }
}
      >
        ⏳ Generating AI insights...
      </div >
    );
  }

if (!reportText) return null;

// Clean and fix markdown
const cleanedMarkdown = reportText.replace(/```(?:markdown)?|```/g, "");
const fixedMarkdown = fixMarkdownTables(cleanedMarkdown);

return (
  <div
    className="ai-markdown-body"
    style={{
      background: "#ffffff",
      borderRadius: "12px",
      marginBottom: "30px",
      border: "1px solid #e5e7eb",
      fontFamily: "Inter, sans-serif",
      fontSize: "15px",
      lineHeight: "1.75",
      color: "#1f2937",
      textAlign: "left",
      padding: "16px",
    }}
  >
    <ReactMarkdown
      children={fixedMarkdown}
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw, rehypeHighlight]}
      components={{
        /* ---------- HEADINGS ---------- */
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

        /* ---------- TEXT ---------- */
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

        /* ---------- LISTS ---------- */
        ul: ({ ...props }) => (
          <ul
            style={{
              paddingLeft: "22px",
              marginBottom: "12px",
            }}
            {...props}
          />
        ),

        ol: ({ ...props }) => (
          <ol
            style={{
              paddingLeft: "22px",
              marginBottom: "12px",
            }}
            {...props}
          />
        ),

        li: ({ ...props }) => (
          <li
            style={{
              marginBottom: "6px",
            }}
            {...props}
          />
        ),

        /* ---------- ENHANCED TABLE STYLING ---------- */
        table: ({ ...props }) => (
          <div
            style={{
              overflowX: "auto",
              marginTop: "14px",
              marginBottom: "20px",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "13px",
              }}
              {...props}
            />
          </div>
        ),

        thead: ({ ...props }) => (
          <thead
            style={{
              position: "sticky",
              top: 0,
              background: "#f9fafb",
              zIndex: 1,
            }}
            {...props}
          />
        ),

        th: ({ style, children, ...props }) => {
          // Detect alignment from style or content
          const align = style?.textAlign || "left";

          return (
            <th
              style={{
                background: "#f9fafb",
                borderBottom: "2px solid #d1d5db",
                borderRight: "1px solid #e5e7eb",
                padding: "12px 10px",
                fontWeight: 600,
                textAlign: align,
                fontSize: "13px",
                color: "#374151",
                whiteSpace: "nowrap",
                ...style,
              }}
              {...props}
            >
              {children}
            </th>
          );
        },

        tbody: ({ ...props }) => (
          <tbody
            style={{
              background: "#ffffff",
            }}
            {...props}
          />
        ),

        tr: ({ ...props }) => (
          <tr
            style={{
              borderBottom: "1px solid #e5e7eb",
            }}
            {...props}
          />
        ),

        td: ({ style, children, ...props }) => {
          // Detect alignment
          const align = style?.textAlign || "left";

          return (
            <td
              style={{
                borderRight: "1px solid #f3f4f6",
                padding: "10px",
                textAlign: align,
                fontSize: "13px",
                color: "#1f2937",
                maxWidth: "300px",
                wordBreak: "break-word",
                whiteSpace: "normal",
                lineHeight: "1.5",
                ...style,
              }}
              {...props}
            >
              {children}
            </td>
          );
        },
      }}
    />
  </div>
);
}