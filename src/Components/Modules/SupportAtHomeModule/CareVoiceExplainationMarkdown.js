import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";

const CareVoiceExplainationMarkdown = ({ content = "" }) => {
    if (!content) return null;

    const styles = {
        wrapper: {
            fontSize: "13px",
            lineHeight: "1.65",
            color: "#111827",
            fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
            wordBreak: "break-word",
        },

        // ✅ headings
        h1: { fontSize: "16px", fontWeight: 700, margin: "16px 0 10px" },
        h2: { fontSize: "15px", fontWeight: 700, margin: "14px 0 10px" },
        h3: { fontSize: "14px", fontWeight: 700, margin: "12px 0 8px" },
        h4: { fontSize: "14px", fontWeight: 700, margin: "10px 0 6px" },

        // ✅ paragraphs
        p: { margin: "0 0 10px 0" },

        // ✅ list styling (BEST FIX FOR BULLET ALIGNMENT)
        ul: {
            margin: "0 0 10px 0",
            paddingLeft: "18px",
            listStylePosition: "outside",
        },
        ol: {
            margin: "0 0 10px 0",
            paddingLeft: "18px",
            listStylePosition: "outside",
        },
        li: {
            marginBottom: "6px",
            paddingLeft: "2px", // tiny spacing between bullet and text
        },

        // ✅ nested lists
        ulNested: {
            marginTop: "6px",
            marginBottom: "6px",
            paddingLeft: "18px",
            listStyleType: "circle",
        },
        olNested: {
            marginTop: "6px",
            marginBottom: "6px",
            paddingLeft: "18px",
        },

        // ✅ horizontal rule
        hr: {
            border: "none",
            borderTop: "1px solid #e5e7eb",
            margin: "16px 0",
        },

        // ✅ links
        a: {
            color: "#2563eb",
            textDecoration: "underline",
            fontWeight: 500,
        },

        // ✅ blockquote
        blockquote: {
            margin: "12px 0",
            padding: "10px 12px",
            borderLeft: "4px solid #6C4CDC",
            background: "#f8f7ff",
            borderRadius: "8px",
            color: "#111827",
        },

        // ✅ table
        tableWrap: {
            width: "100%",
            overflowX: "auto",
            marginTop: "10px",
            borderRadius: "10px",
            border: "1px solid #e5e7eb",
            background: "#fff",
            marginBottom: "10px"
        },

        table: {
            width: "100%",
            borderCollapse: "collapse",
            minWidth: "700px",
        },

        th: {
            padding: "10px 12px",
            border: "1px solid #e5e7eb",
            textAlign: "left",
            fontSize: "13px",
            fontWeight: 700,
            background: "#f9fafb",
            verticalAlign: "top",
            whiteSpace: "nowrap",
        },

        td: {
            padding: "10px 12px",
            border: "1px solid #e5e7eb",
            textAlign: "left",
            fontSize: "13px",
            verticalAlign: "top",
            background: "#fff",
        },

        // ✅ code blocks
        pre: {
            background: "#0b1020",
            padding: "12px",
            borderRadius: "10px",
            overflowX: "auto",
            marginTop: "10px",
            marginBottom: "10px",
        },

        codeInline: {
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            fontSize: "12px",
            background: "#f3f4f6",
            padding: "2px 6px",
            borderRadius: "6px",
            border: "1px solid #e5e7eb",
        },

        codeBlock: {
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            fontSize: "12px",
            color: "#fff",
            whiteSpace: "pre",
        },
    };

    return (
        <div className="sirs-markdown" style={{background:"white"}}>
            <ReactMarkdown
                children={content}
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeHighlight]}
            />
        </div>
    );
};

export default CareVoiceExplainationMarkdown;
