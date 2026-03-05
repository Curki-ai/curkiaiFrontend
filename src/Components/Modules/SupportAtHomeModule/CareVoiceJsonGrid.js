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

    // local state only for grid edits (json/tree view)
    const [gridMapper, setGridMapper] = useState(derivedConfig.mapper);

    // ✅ FIX: updateValidation now operates on mapperRowsSafe by index
    const updateValidation = (idx, raw) => {
        try {
            const parsed = raw?.trim() ? JSON.parse(raw) : {};
            setMapperRows(
                mapperRowsSafe.map((r, i) =>
                    i === idx ? { ...r, validation: parsed } : r
                )
            );
        } catch {
            // ignore invalid JSON while typing
        }
    };

    /**
     * ✅ FIX: Only sync gridMapper when actually SWITCHING views (not on every
     * derivedConfig change). Removing derivedConfig.mapper from deps breaks the
     * loop: edit → setMapperRows → derivedConfig changes → setGridMapper → reorder
     */
    const prevViewRef = useRef(null);
    useEffect(() => {
        if (view === "json") return;
        if (prevViewRef.current === view) return; // already in this view, skip
        prevViewRef.current = view;
        setGridMapper(rowsToMapper(mapperRowsSafe));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view]); // ← view ONLY, not derivedConfig.mapper

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
     * ✅ Whenever gridMapper changes (JSON/tree view edits)
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
            onCreateMenu: (items) => {
                // remove left menu options
                return items.filter(
                    (item) =>
                        !["type", "sort", "transform", "extract"].includes(item.text?.toLowerCase())
                );
            },
            onChange: () => {
                try {
                    const json = editor.get();   // ✅ always fetch latest full json
                    const mapperObj = json || {};

                    setGridMapper(mapperObj);

                    const updatedRows = mapperToRows(mapperObj);
                    pushRowsDebounced(updatedRows);
                } catch (err) {
                    // ✅ ignore invalid JSON while typing
                }
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
    // ✅ FIX: All actions now operate on mapperRowsSafe (array) by index.
    // Previously they used setGridMapper (object) which caused key reordering
    // on every re-render via Object.entries().

    const addNewField = () => {
        const newRow = {
            template_field: `NEW_PLACEHOLDER_${mapperRowsSafe.length + 1}`,
            source: "",
            type: "text",
            required: false,
            validation: {},
        };
        setMapperRows([...mapperRowsSafe, newRow]);
    };

    const deleteField = (idx) => {
        setMapperRows(mapperRowsSafe.filter((_, i) => i !== idx));
    };

    const updatePatterns = (idx, text) => {
        setMapperRows(
            mapperRowsSafe.map((r, i) =>
                i === idx ? { ...r, source: text } : r
            )
        );
    };

    const updateType = (idx, type) => {
        setMapperRows(
            mapperRowsSafe.map((r, i) =>
                i === idx ? { ...r, type } : r
            )
        );
    };

    const toggleRequired = (idx) => {
        setMapperRows(
            mapperRowsSafe.map((r, i) =>
                i === idx ? { ...r, required: !r.required } : r
            )
        );
    };

    const renameKey = (idx, newRawKey) => {
        const newKey = normalizeKey(newRawKey);
        if (!newKey) return;
        setMapperRows(
            mapperRowsSafe.map((r, i) =>
                i === idx ? { ...r, template_field: newKey } : r
            )
        );
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
                {/* ✅ FIX: Visual tab now renders from mapperRowsSafe (array, always ordered)
                    instead of mapperEntries (derived from object, reorders on re-render) */}
                {view === "grid" && (
                    <div className="fmp-view-container">
                        <div className="fmp-page">
                            <div className="fmp-heading">

                            </div>

                            <div className="fmp-grid">
                                {mapperRowsSafe.map((row, idx) => (
                                    <div key={idx} className="fmp-card">
                                        <div className="fmp-card-top">
                                            <div className="fmp-card-left">
                                                <label className="fmp-label">Placeholder Name</label>

                                                <input
                                                    className="fmp-key-input"
                                                    defaultValue={row.template_field}
                                                    placeholder="PLACEHOLDER_ID"
                                                    key={row.template_field}
                                                    onBlur={(e) => {
                                                        const newKey = e.target.value;
                                                        if (!newKey?.trim()) {
                                                            e.target.value = row.template_field;
                                                            return;
                                                        }
                                                        renameKey(idx, newKey);
                                                    }}
                                                />
                                            </div>

                                            <button
                                                className="fmp-delete-btn"
                                                onClick={() => deleteField(idx)}
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
                                                value={row.source || ""}
                                                onChange={(e) => updatePatterns(idx, e.target.value)}
                                                placeholder="Pattern 1, Pattern 2..."
                                            />
                                        </div>
                                        <div className="fmp-block">
                                            <label className="fmp-label">Validation (JSON)</label>

                                            <textarea
                                                className="fmp-validation-input"
                                                rows={5}
                                                spellCheck={false}
                                                value={JSON.stringify(row.validation || {}, null, 2)}
                                                onChange={(e) => updateValidation(idx, e.target.value)}
                                                placeholder={`{
  "regex": "^...$"
}`}
                                            />

                                        </div>

                                        <div className="fmp-controls">
                                            <div className="fmp-select-wrap">
                                                <select
                                                    className="fmp-type-input"
                                                    value={row.type || "text"}
                                                    onChange={(e) => updateType(idx, e.target.value)}
                                                >
                                                    <option value="text">Text</option>
                                                    <option value="date">Date</option>
                                                    <option value="number">Num</option>
                                                    <option value="boolean">Bool</option>
                                                </select>
                                                <ChevronDown size={14} className="fmp-chevron" />
                                            </div>

                                            <button
                                                className={`fmp-required-btn ${row.required ? "active" : ""
                                                    }`}
                                                onClick={() => toggleRequired(idx)}
                                                type="button"
                                            >
                                                {row.required ? (
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

                                <button className="fmp-add-btn" onClick={addNewField} type="button">
                                    <Plus size={16} />
                                    Add New Placeholder
                                </button>

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
                                readOnly={false}
                            />
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default FieldMapperPro;