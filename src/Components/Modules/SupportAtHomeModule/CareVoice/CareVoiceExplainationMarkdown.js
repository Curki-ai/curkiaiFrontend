import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";

const CareVoiceExplainationMarkdown = ({ content = "" }) => {
    if (!content) return null;

    return (
        <div className="sirs-markdown cv-markdown">
            <ReactMarkdown
                children={content}
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeHighlight]}
            />
        </div>
    );
};

export default CareVoiceExplainationMarkdown;
