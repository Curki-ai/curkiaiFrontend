import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import normalizeMarkdownTables from "../../../general-components/normalizeMarkdownTables";

const CareVoiceExplainationMarkdown = ({ content = "" }) => {
    const normalized = useMemo(() => normalizeMarkdownTables(content), [content]);

    if (!content) return null;

    return (
        <div className="sirs-markdown cv-markdown">
            <ReactMarkdown
                children={normalized}
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeHighlight]}
            />
        </div>
    );
};

export default CareVoiceExplainationMarkdown;
