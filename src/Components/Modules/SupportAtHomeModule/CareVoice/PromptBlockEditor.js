import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Pencil, CheckCircle2, XCircle } from "lucide-react";
import normalizeMarkdownTables from "../../../general-components/normalizeMarkdownTables";
import "../../../../Styles/SupportAtHomeModule/CareVoice/PromptBlockEditor.css";

const isTitleCaseHeading = (t) =>
    /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,6}$/.test(t) && t.length <= 60;

const isPipeFieldHeading = (t) =>
    /^[A-Z0-9_]+\s*\|\s*(text|date|phone|email|boolean|number)\s*\|\s*(required|optional)/i.test(t);

// A single markdown table row: trimmed line that starts with a pipe.
const isTableRow = (line = "") => /^\s*\|/.test(line) && line.includes("|");

// A block that is (at least partly) a markdown table: 2+ pipe rows.
const blockIsTable = (block = "") =>
    block.split("\n").filter((l) => isTableRow(l)).length >= 2;

const shouldHideBlock = (block = "") => {
    // Never hide a block that contains a markdown table — tables the user
    // inserts must always survive and stay visible.
    if (blockIsTable(block)) return false;

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
        !t.includes(":");

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

        if (index === 0 && isTitleLine(t)) return true;

        if (isMarkdownHeading(t)) return true;
        if (isCapsHeading(t)) return true;
        if (isPipeFieldHeading(t)) return true;
        if (isTitleCaseHeading(t)) return true;

        return false;
    };

    // Mark every line that belongs to a table region (a run of 2+ pipe rows),
    // so tables are kept intact and never split by heading detection.
    const rawTable = lines.map(isTableRow);
    const inTable = rawTable.map(
        (v, idx) => v && (rawTable[idx - 1] || rawTable[idx + 1])
    );

    const blocks = [];
    let buf = [];

    const pushBuf = () => {
        const chunk = buf.join("\n").trim();
        if (chunk) blocks.push(chunk);
        buf = [];
    };

    lines.forEach((line, i) => {
        const enteringTable = inTable[i] && !inTable[i - 1];
        const leavingTable = !inTable[i] && inTable[i - 1];

        // Isolate the table: flush whatever precedes it, and flush the table
        // itself before the following content starts.
        if ((enteringTable || leavingTable) && buf.length > 0) {
            pushBuf();
        }

        // Table rows are never headings; only check non-table lines.
        if (!inTable[i] && isHeading(line, i) && buf.length > 0) {
            pushBuf();
        }

        buf.push(line);
    });

    pushBuf();

    if (blocks.length <= 1) {
        return (text || "")
            .split(/\n{2,}/)
            .map((b) => b.trim())
            .filter(Boolean);
    }

    const merged = [];
    for (const b of blocks) {
        const prev = merged[merged.length - 1];
        // Merge tiny fragments into the previous block — but never fold a table
        // into its neighbour (or a neighbour into a table); tables stay atomic.
        if (
            b.length < 25 &&
            merged.length > 0 &&
            !blockIsTable(b) &&
            !blockIsTable(prev)
        ) {
            merged[merged.length - 1] = prev + "\n" + b;
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

    // Normalise tables for display only; the raw `block` is kept untouched so
    // editing and saving preserve the original source.
    const renderBlock = useMemo(() => normalizeMarkdownTables(block), [block]);

    useEffect(() => setBuffer(block), [block]);

    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
        }
    }, [isEditing]);

    const handleSave = () => {
        const next = buffer.trim();
        const original = block.trim();

        if (next !== original) {
            onSave(next);
        }

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
                            if (!inline) return null;
                            return (
                                <code className={className} {...props}>
                                    {children}
                                </code>
                            );
                        },
                        pre() {
                            return null;
                        },
                    }}
                >
                    {renderBlock}
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
    const sourceRef = useRef(null);

    const blocks = useMemo(() => splitPromptIntoBlocks(value || ""), [value]);

    // Size the Source textarea to its content so it grows instead of scrolling
    // internally — that keeps it a single block the page scrolls (like the
    // Visual tab) with no inner scrollbar to trap the wheel mid-gesture.
    useEffect(() => {
        if (tab !== "source") return;
        const el = sourceRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = el.scrollHeight + "px";
    }, [tab, value]);

    const handleSaveBlock = (index, newVal) => {
        if (disabled) return;

        const scrollY = window.scrollY; // prevent scroll jump

        const nextBlocks = [...blocks];
        nextBlocks[index] = newVal;

        const nextPrompt = nextBlocks
            .map((b) => b.trim())
            .filter(Boolean)
            .join("\n\n");

        onChange(nextPrompt);

        requestAnimationFrame(() => {
            window.scrollTo(0, scrollY);
        });

        if (onCommit) onCommit(nextPrompt);
    };

    if (!value?.trim()) return <div className="pbe-empty">No prompt found.</div>;

    return (
        <div className="pbe-root">

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

                {/* <div className="pbe-right">{rightSlot}</div> */}
            </div>

            {tab === "visual" && (
                <div className="pbe-visual">
                    {blocks
                        .map((b, originalIndex) => ({ block: b, originalIndex }))
                        .filter((item) => !shouldHideBlock(item.block))
                        .map(({ block, originalIndex }) => (
                            <Block
                                key={block.slice(0, 40) + originalIndex}
                                block={block}
                                onSave={(val) => handleSaveBlock(originalIndex, val)}
                            />
                        ))}
                </div>
            )}

            {tab === "source" && (
                <div className="pbe-source">
                    <textarea
                        ref={sourceRef}
                        value={value}
                        onChange={(e) => {
                            if (disabled) return;
                            onChange(e.target.value);
                            // Keep the box sized to its content as the user types
                            // so it never develops an internal scrollbar.
                            e.target.style.height = "auto";
                            e.target.style.height = e.target.scrollHeight + "px";
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