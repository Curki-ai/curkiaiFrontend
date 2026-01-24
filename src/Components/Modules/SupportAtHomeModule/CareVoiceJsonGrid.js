import React, { useEffect, useMemo, useRef, useState } from "react";
import JSONEditor from "jsoneditor";
import "jsoneditor/dist/jsoneditor.min.css";

import {
    Layers,
    LayoutGrid,
    Code2,
    Plus,
    Trash2,
    ChevronDown,
    CheckCircle,
    Circle,
} from "lucide-react";

import "../../../Styles/CareVoiceJsonGrid.css";
import MapperGrid from "./VoiceModuleMapper";

const DEFAULT_CONFIG = {
    mapper: {
        PARTICIPANT_NAME: {
            source_pattern: ["Name:", "Participant name is", "Client name"],
            type: "text",
            required: true,
            validation: { regex: "^[A-Z][a-z]+(\\s[A-Z][a-z]+)*$" },
        },
        NDIS_NUMBER: {
            source_pattern: ["NDIS number", "NDIS ID", "NDIS#"],
            type: "text",
            required: true,
            validation: { regex: "^(NDIS)?\\d{6,}$" },
        },
        ASSESSMENT_DATE: {
            source_pattern: ["Assessment date", "Date completed"],
            type: "date",
            required: true,
            validation: { format: "YYYY-MM-DD" },
        },
    },
};

const normalizeKey = (key) =>
    key.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_");

const mapperToRows = (mapperObj = {}) => {
    return Object.entries(mapperObj || {}).map(([key, value]) => ({
        template_field: key,
        source: Array.isArray(value?.source_pattern)
            ? value.source_pattern.join(", ")
            : "",
        type: value?.type || "text",
        required: !!value?.required,
        validation: value?.validation || {}, // keep validation
    }));
};

const rowsToMapper = (rows = []) => {
    return rows.reduce((acc, row) => {
        const key = normalizeKey(row.template_field || "");
        if (!key) return acc;

        acc[key] = {
            source_pattern: row.source
                ? row.source.split(",").map((s) => s.trim()).filter(Boolean)
                : [],
            type: row.type || "text",
            required: !!row.required,
            validation: row.validation || {},
        };

        return acc;
    }, {});
};

const stableStringify = (obj) => {
    try {
        return JSON.stringify(obj);
    } catch {
        return "";
    }
};

const FieldMapperPro = ({
    initialConfig = DEFAULT_CONFIG,
    onChangeConfig,

    mapperRows,
    setMapperRows,
    mapperMode = "edit", // "view" | "edit"
}) => {
    const [view, setView] = useState("grid"); // grid | json | table

    /**
     * ✅ FIX: Single source of truth for UI = mapperRows
     * config is derived (not competing with rows)
     */
    const mapperRowsSafe = Array.isArray(mapperRows) ? mapperRows : [];

    // local config derived from rows
    const derivedConfig = useMemo(() => {
        return { mapper: rowsToMapper(mapperRowsSafe) };
    }, [mapperRowsSafe]);

    // local state only for grid edits (visual view)
    const [gridMapper, setGridMapper] = useState(derivedConfig.mapper);

    /**
     * 🔥 IMPORTANT:
     * when rows change from table/json/parent -> update gridMapper
     * BUT DO NOT overwrite while user is typing in grid? (grid uses textarea controlled)
     * So safe to sync always.
     */
    useEffect(() => {
        setGridMapper(derivedConfig.mapper);
    }, [derivedConfig.mapper]);

    // JSON Editor refs
    const jsonEditorRef = useRef(null);
    const jsonEditorInstanceRef = useRef(null);

    // footer stats
    const count = useMemo(
        () => Object.keys(gridMapper || {}).length,
        [gridMapper]
    );
    const [lastUpdated, setLastUpdated] = useState("Ready");

    const updateSyncedTime = () => {
        setLastUpdated(
            "Synced: " +
            new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        );
    };

    /**
     * ✅ Debounced sync from table -> visual/code
     * This is the MAIN flicker fix (prevents config wars)
     */
    const debounceRef = useRef(null);
    const pushRowsDebounced = (updatedRows) => {
        if (typeof setMapperRows !== "function") return;

        // always update rows instantly (table smooth)
        setMapperRows(updatedRows);

        // config sync callback (optional)
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            const cfg = { mapper: rowsToMapper(updatedRows) };
            onChangeConfig?.(cfg);
            updateSyncedTime();
        }, 200);
    };

    /**
     * ✅ Whenever gridMapper changes (Visual edits)
     * convert to rows and push
     */
    useEffect(() => {
        if (view !== "grid") return;
        if (typeof setMapperRows !== "function") return;

        const rows = mapperToRows(gridMapper);

        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setMapperRows(rows);
            onChangeConfig?.({ mapper: gridMapper });
            updateSyncedTime();
        }, 150);
    }, [gridMapper, view]);

    /**
     * ✅ JSON Editor init ONLY when view === json
     * and destroy on exit to avoid flicker
     */
    useEffect(() => {
        if (view !== "json") return;

        // destroy old
        if (jsonEditorInstanceRef.current) {
            jsonEditorInstanceRef.current.destroy();
            jsonEditorInstanceRef.current = null;
        }

        const editor = new JSONEditor(jsonEditorRef.current, {
            mode: "tree",
            modes: ["tree", "code"],

            // 🔥 This is fired frequently - keep it stable
            onChangeJSON: (json) => {
                const mapperObj = json || {};

                // update grid view
                setGridMapper(mapperObj);

                // update rows (table)
                const updatedRows = mapperToRows(mapperObj);
                pushRowsDebounced(updatedRows);
            },
        });

        jsonEditorInstanceRef.current = editor;

        // initial set
        editor.set(gridMapper);

        setTimeout(() => {
            try {
                editor.expandAll();
            } catch { }
        }, 50);

        return () => {
            if (jsonEditorInstanceRef.current) {
                jsonEditorInstanceRef.current.destroy();
                jsonEditorInstanceRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view]);

    /**
     * ✅ When switching to json view, update editor content
     * but do not constantly update on every keystroke (flicker)
     */
    const lastEditorHashRef = useRef("");
    useEffect(() => {
        if (view !== "json") return;
        if (!jsonEditorInstanceRef.current) return;

        const hash = stableStringify(gridMapper);
        if (hash === lastEditorHashRef.current) return;
        lastEditorHashRef.current = hash;

        try {
            jsonEditorInstanceRef.current.update(gridMapper);
        } catch { }
    }, [gridMapper, view]);

    // ===== Visual Actions =====
    const addNewField = () => {
        const baseName = "NEW_PLACEHOLDER";
        let counter = 1;
        let id = `${baseName}_${counter}`;
        while (gridMapper?.[id]) {
            counter++;
            id = `${baseName}_${counter}`;
        }

        setGridMapper((prev) => ({
            ...(prev || {}),
            [id]: { source_pattern: [], type: "text", required: false, validation: {} },
        }));
    };

    const deleteField = (key) => {
        setGridMapper((prev) => {
            const updated = { ...(prev || {}) };
            delete updated[key];
            return updated;
        });
    };

    const updatePatterns = (key, text) => {
        const patterns = text
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);

        setGridMapper((prev) => ({
            ...(prev || {}),
            [key]: { ...(prev?.[key] || {}), source_pattern: patterns },
        }));
    };

    const updateType = (key, type) => {
        setGridMapper((prev) => ({
            ...(prev || {}),
            [key]: { ...(prev?.[key] || {}), type },
        }));
    };

    const toggleRequired = (key) => {
        setGridMapper((prev) => ({
            ...(prev || {}),
            [key]: {
                ...(prev?.[key] || {}),
                required: !prev?.[key]?.required,
            },
        }));
    };

    const renameKey = (oldKey, newRawKey) => {
        const newKey = normalizeKey(newRawKey);
        if (!newKey || newKey === oldKey) return;

        setGridMapper((prev) => {
            const copy = { ...(prev || {}) };
            if (copy[newKey]) return prev; // avoid override

            const val = copy[oldKey];
            delete copy[oldKey];
            copy[newKey] = val;
            return copy;
        });
    };

    const mapperEntries = useMemo(
        () => Object.entries(gridMapper || {}),
        [gridMapper]
    );

    return (
        <div className="fmp-root">
            {/* ===== Header ===== */}
            <header className="fmp-header">
                {/* <div className="fmp-brand">
          <div className="fmp-logo">
            <Layers size={14} color="#fff" />
          </div>
          <h1 className="fmp-title">Mapper Pro</h1>
        </div> */}

                <div className="fmp-toggle">
                    <button
                        className={`fmp-toggle-btn ${view === "table" ? "active" : ""}`}
                        onClick={() => setView("table")}
                        type="button"
                    >
                        Tables
                    </button>
                    <button
                        className={`fmp-toggle-btn ${view === "grid" ? "active" : ""}`}
                        onClick={() => setView("grid")}
                        type="button"
                    >
                        {/* <LayoutGrid size={14} /> */}
                        Visual
                    </button>

                    <button
                        className={`fmp-toggle-btn ${view === "json" ? "active" : ""}`}
                        onClick={() => setView("json")}
                        type="button"
                    >
                        {/* <Code2 size={14} /> */}
                        Grid
                    </button>

                </div>
            </header>

            {/* ===== Main ===== */}
            <main className="fmp-main">
                {/* GRID VIEW */}
                {view === "grid" && (
                    <div className="fmp-view-container">
                        <div className="fmp-page">
                            <div className="fmp-heading">

                            </div>

                            <div className="fmp-grid">
                                {mapperEntries.map(([key, field]) => (
                                    <div key={key} className="fmp-card">
                                        <div className="fmp-card-top">
                                            <div className="fmp-card-left">
                                                <label className="fmp-label">Placeholder Name</label>

                                                <input
                                                    className="fmp-key-input"
                                                    defaultValue={key}
                                                    placeholder="PLACEHOLDER_ID"
                                                    onBlur={(e) => {
                                                        const newKey = e.target.value;
                                                        if (!newKey?.trim()) {
                                                            e.target.value = key;
                                                            return;
                                                        }
                                                        renameKey(key, newKey);
                                                    }}
                                                />
                                            </div>

                                            <button
                                                className="fmp-delete-btn"
                                                onClick={() => deleteField(key)}
                                                type="button"
                                                title="Delete field"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>

                                        <div className="fmp-block">
                                            <label className="fmp-label">Matching Keywords</label>
                                            <textarea
                                                className="fmp-pattern-input"
                                                value={(field.source_pattern || []).join(", ")}
                                                onChange={(e) => updatePatterns(key, e.target.value)}
                                                placeholder="Pattern 1, Pattern 2..."
                                            />
                                        </div>

                                        <div className="fmp-controls">
                                            <div className="fmp-select-wrap">
                                                <select
                                                    className="fmp-type-input"
                                                    value={field.type || "text"}
                                                    onChange={(e) => updateType(key, e.target.value)}
                                                >
                                                    <option value="text">Text</option>
                                                    <option value="date">Date</option>
                                                    <option value="number">Num</option>
                                                    <option value="boolean">Bool</option>
                                                </select>
                                                <ChevronDown size={14} className="fmp-chevron" />
                                            </div>

                                            <button
                                                className={`fmp-required-btn ${field.required ? "active" : ""
                                                    }`}
                                                onClick={() => toggleRequired(key)}
                                                type="button"
                                            >
                                                {field.required ? (
                                                    <CheckCircle size={14} />
                                                ) : (
                                                    <Circle size={14} />
                                                )}
                                                <span>Required</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>


                            <div className="fmp-add-row">
                                {mapperMode === "edit" && (
                                    <button className="fmp-add-btn" onClick={addNewField} type="button">
                                        <Plus size={16} />
                                        Add New Placeholder
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* JSON VIEW */}
                {view === "json" && (
                    <div className="fmp-json-view">
                        <div ref={jsonEditorRef} className="fmp-json-editor" />
                    </div>
                )}

                {/* TABLE VIEW */}
                {view === "table" && (
                    <div className="fmp-view-container">
                        <div className="fmp-page">
                            <MapperGrid
                                rows={mapperRowsSafe}
                                setRows={(updatedRows) => {
                                    // ✅ NO config state updates here (prevents flicker)
                                    pushRowsDebounced(updatedRows);
                                }}
                                readOnly={mapperMode === "view"}
                            />
                        </div>
                    </div>
                )}
            </main>

            {/* ===== Footer ===== */}
            <footer className="fmp-footer">
                <div className="fmp-stats">
                    <span>
                        {count} {count === 1 ? "Field" : "Fields"} Active
                    </span>
                    <span className="fmp-divider" />
                    <span>{lastUpdated}</span>
                </div>

                <div className="fmp-realtime">
                    <span className="fmp-dot" />
                    Real-time Sync
                </div>
            </footer>
        </div>
    );
};

export default FieldMapperPro;
