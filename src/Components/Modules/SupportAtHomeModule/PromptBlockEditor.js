import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Pencil, CheckCircle2, XCircle } from "lucide-react";
import "../../../Styles/PromptBlockEditor.css";

const isTitleCaseHeading = (t) =>
    /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,6}$/.test(t) && t.length <= 60;

const isPipeFieldHeading = (t) =>
    /^[A-Z0-9_]+\s*\|\s*(text|date|phone|email|boolean|number)\s*\|\s*(required|optional)/i.test(t);
const shouldHideBlock = (block = "") => {
    const t = block.toLowerCase();

    if (
        t.includes("output format") ||
        t.includes("produce json") ||
        t.includes("return a single json") ||
        t.includes("example:") && t.includes("```")
    ) {
        return true;
    }

    if (t.includes("```json") || t.includes('"participant_name"') || t.includes("{\n")) {
        return true;
    }

    return false;
};

const splitPromptIntoBlocks = (text) => {
    if (!text?.trim()) return [];

    const lines = text.replace(/\r\n/g, "\n").split("\n");

    const isMarkdownHeading = (t) => /^#{1,6}\s+/.test(t);

    const isCapsHeading = (t) =>
        /^[A-Z][A-Z0-9\s\-–_()]{2,}$/.test(t) &&
        t.length <= 60 &&
        !t.includes(":"); // avoid lines like "Validation: ..."

    const isTitleLine = (t) =>
        t.length <= 90 &&
        /prompt|extraction|support plan|template/i.test(t) &&
        !t.endsWith(".") &&
        !t.includes(":");

    const isListItem = (t) =>
        /^(\d+\.)\s+/.test(t) || /^[-*•]\s+/.test(t);

    const isHeading = (line, index) => {
        const t = line.trim();
        if (!t) return false;

        if (isListItem(t)) return false;

        // 1st line could be title
        if (index === 0 && isTitleLine(t)) return true;

        if (isMarkdownHeading(t)) return true;
        if (isCapsHeading(t)) return true;
        if (isPipeFieldHeading(t)) return true;
        if (isTitleCaseHeading(t)) return true;

        return false;
    };

    const blocks = [];
    let buf = [];

    const pushBuf = () => {
        const chunk = buf.join("\n").trim();
        if (chunk) blocks.push(chunk);
        buf = [];
    };

    lines.forEach((line, i) => {
        if (isHeading(line, i) && buf.length > 0) {
            pushBuf();
        }
        buf.push(line);
    });

    pushBuf();

    // fallback: if still one huge block, split by double new line
    if (blocks.length <= 1) {
        return (text || "")
            .split(/\n{2,}/)
            .map((b) => b.trim())
            .filter(Boolean);
    }

    // remove ultra-small blocks (merge them with previous)
    const merged = [];
    for (const b of blocks) {
        if (b.length < 25 && merged.length > 0) {
            merged[merged.length - 1] = merged[merged.length - 1] + "\n" + b;
        } else {
            merged.push(b);
        }
    }

    return merged;
};

const Block = ({ block, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [buffer, setBuffer] = useState(block);
    const textareaRef = useRef(null);

    useEffect(() => setBuffer(block), [block]);

    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
        }
    }, [isEditing]);

    const handleSave = () => {
        const next = buffer?.trimEnd?.() ?? buffer;
        if (next !== block) onSave(next);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setBuffer(block);
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="pbe-block-edit">
                <textarea
                    ref={textareaRef}
                    value={buffer}
                    onChange={(e) => {
                        setBuffer(e.target.value);
                        e.target.style.height = "auto";
                        e.target.style.height = e.target.scrollHeight + "px";
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSave();
                        if (e.key === "Escape") handleCancel();
                    }}
                    className="pbe-textarea"
                    placeholder="Edit section..."
                />

                <div className="pbe-actions">
                    <button type="button" className="pbe-btn save" onClick={handleSave}>
                        <CheckCircle2 size={16} /> Update Section
                    </button>

                    <button type="button" className="pbe-btn cancel" onClick={handleCancel}>
                        <XCircle size={16} /> Discard
                    </button>

                    <div className="pbe-live">Live Syncing</div>
                </div>
            </div>
        );
    }

    return (
        <div className="pbe-block-view" onClick={() => setIsEditing(true)}>
            <div className="pbe-markdown">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        code({ inline, className, children, ...props }) {
                            // ✅ hide full code blocks (```json ... ```)
                            if (!inline) return null;

                            // ✅ keep inline code like `text`
                            return (
                                <code className={className} {...props}>
                                    {children}
                                </code>
                            );
                        },
                        pre() {
                            // ✅ hide <pre> wrapper too
                            return null;
                        },
                    }}
                >
                    {block}
                </ReactMarkdown>

            </div>

            <div className="pbe-hover">
                <Pencil size={14} /> Click to refine
            </div>
        </div>
    );
};

export default function PromptBlockEditor({
    value,
    onChange,
    onCommit,
    disabled = false,
    rightSlot,
}) {
    const [tab, setTab] = useState("visual");

    const blocks = useMemo(() => splitPromptIntoBlocks(value || ""), [value]);

    const handleSaveBlock = (index, newVal) => {
        if (disabled) return;

        const nextBlocks = [...blocks];
        nextBlocks[index] = newVal;

        // Keep spacing clean between sections
        const nextPrompt = nextBlocks.join("\n\n");
        onChange(nextPrompt);

        if (onCommit) onCommit(nextPrompt);
    };

    if (!value?.trim()) return <div className="pbe-empty">No prompt found.</div>;

    return (
        <div className="pbe-root">
            {/* TOP BAR */}
            <div className="pbe-topbar">
                <div className="pbe-tabs">
                    <button
                        type="button"
                        className={`pbe-tab ${tab === "visual" ? "active" : ""}`}
                        onClick={() => setTab("visual")}
                    >
                        Visual
                    </button>

                    <button
                        type="button"
                        className={`pbe-tab ${tab === "source" ? "active" : ""}`}
                        onClick={() => setTab("source")}
                    >
                        Source
                    </button>
                </div>

                <div className="pbe-right">{rightSlot}</div>
            </div>

            {/* VISUAL TAB */}
            {tab === "visual" && (
                <div className="pbe-visual">
                    {blocks
                        .filter((b) => !shouldHideBlock(b))
                        .map((b, idx) => (
                            <Block
                                key={idx}
                                block={b}
                                onSave={(val) => handleSaveBlock(idx, val)}
                            />
                        ))}

                </div>
            )}

            {/* SOURCE TAB */}
            {tab === "source" && (
                <div className="pbe-source">
                    <textarea
                        value={value}
                        onChange={(e) => {
                            if (disabled) return;
                            onChange(e.target.value);
                        }}
                        onBlur={() => onCommit?.(value)}
                        className="pbe-source-textarea"
                        spellCheck={false}
                        placeholder="Write markdown here..."
                    />
                </div>
            )}
        </div>
    );
}
