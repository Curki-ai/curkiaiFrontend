import React, { useState, useEffect, useImperativeHandle,forwardRef } from "react";
import * as XLSX from "xlsx";
import icon2 from "../../../Images/Icon (2).png";
import collapseIcon from "../../../Images/Vector.png";
import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    Table,
    TableRow,
    TableCell,
    AlignmentType,
    WidthType,
    BorderStyle,
} from "docx";
import { saveAs } from "file-saver";

const PreviewDataSection = forwardRef(
  ({ apiExcelUrls, tabTitles, financialReport }, ref) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [sheets, setSheets] = useState({});
    const [activeSheet, setActiveSheet] = useState("");
    const [columnWidths, setColumnWidths] = useState({});
    const [rowHeights, setRowHeights] = useState({});

    // Generate Excel-like column headers (A, B, C, ...)
    const getColumnHeader = (index) => {
        let result = '';
        while (index >= 0) {
            result = String.fromCharCode(65 + (index % 26)) + result;
            index = Math.floor(index / 26) - 1;
        }
        return result;
    };

    const generateEmptyGrid = () => {
        const rows = [];
        for (let i = 1; i <= 20; i++) {
            const row = Array(13).fill('');
            rows.push(row);
        }
        return rows;
    };

    const calculateColumnWidths = (data) => {
        const widths = {};
        const maxCols = 13;
        const baseWidth = 120;
        const charWidth = 8;
        const padding = 24;

        for (let colIndex = 0; colIndex < maxCols; colIndex++) {
            let maxLength = getColumnHeader(colIndex).length;
            for (let rowIndex = 0; rowIndex < Math.min(data.length, 50); rowIndex++) {
                const cellValue = data[rowIndex]?.[colIndex];
                if (cellValue != null) maxLength = Math.max(maxLength, String(cellValue).length);
            }
            const contentWidth = Math.max(maxLength, 1) * charWidth + padding;
            widths[colIndex] = Math.min(Math.max(contentWidth, baseWidth), 300);
        }

        return widths;
    };

    const calculateRowHeights = (data) => {
        const heights = {};
        const baseHeight = 40;
        const lineHeight = 20;
        const maxLines = 3;

        for (let rowIndex = 0; rowIndex < Math.min(data.length, 20); rowIndex++) {
            const row = data[rowIndex] || [];
            let maxLinesInRow = 1;

            for (let colIndex = 0; colIndex < 13; colIndex++) {
                const cellValue = row[colIndex];
                if (cellValue && String(cellValue).length > 50) {
                    const estimatedLines = Math.ceil(String(cellValue).length / 50);
                    maxLinesInRow = Math.max(maxLinesInRow, Math.min(estimatedLines, maxLines));
                }
            }
            heights[rowIndex] = baseHeight + (maxLinesInRow - 1) * lineHeight;
        }

        return heights;
    };

    useEffect(() => {
        const emptyGrid = generateEmptyGrid();

        if (!apiExcelUrls || apiExcelUrls.length === 0) {
            setSheets({
                [tabTitles?.[0] || "Order Sub-Items"]: emptyGrid,
                [tabTitles?.[1] || "Invoices"]: emptyGrid,
                [tabTitles?.[2] || "Client"]: emptyGrid,
            });
            setActiveSheet(tabTitles?.[0] || "Order Sub-Items");
            setColumnWidths(calculateColumnWidths(emptyGrid));
            return;
        }

        const fetchAndParse = async () => {
            try {
                const res = await fetch(apiExcelUrls[0]);
                const arrayBuffer = await res.arrayBuffer();
                const workbook = XLSX.read(arrayBuffer, { type: "array" });

                const allSheets = {};
                workbook.SheetNames.forEach((name, index) => {
                    const sheet = workbook.Sheets[name];
                    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                    const newName = tabTitles?.[index] || name; // Use custom title if provided
                    allSheets[newName] = rows;
                });

                setSheets(allSheets);
                setActiveSheet(Object.keys(allSheets)[0]);

                const firstSheetData = allSheets[Object.keys(allSheets)[0]] || [];
                setColumnWidths(calculateColumnWidths(firstSheetData));
                setRowHeights(calculateRowHeights(firstSheetData));

            } catch (err) {
                console.error("Failed to parse Excel preview:", err);

                setSheets({
                    [tabTitles?.[0] || "Order Sub-Items"]: emptyGrid,
                    [tabTitles?.[1] || "Invoices"]: emptyGrid,
                    [tabTitles?.[2] || "Client"]: emptyGrid,
                });
                setActiveSheet(tabTitles?.[0] || "Order Sub-Items");
                setColumnWidths(calculateColumnWidths(emptyGrid));
            }
        };

        fetchAndParse();
    }, [apiExcelUrls, tabTitles]);

    useEffect(() => {
        const currentData = sheets[activeSheet] || generateEmptyGrid();
        setColumnWidths(calculateColumnWidths(currentData));
        setRowHeights(calculateRowHeights(currentData));
    }, [activeSheet, sheets]);

    const currentData = sheets[activeSheet] || generateEmptyGrid();
    const maxCols = 13;
    const maxRows = 20;

    const getColumnWidth = (colIndex) => columnWidths[colIndex] || 120;
    const getRowHeight = (rowIndex) => rowHeights[rowIndex] || 40;
    const handleDownloadBoth = async () => {
        try {
            // Step 1️⃣: Download Excel file
            if (apiExcelUrls && apiExcelUrls.length > 0) {
                const link = document.createElement("a");
                link.href = apiExcelUrls[0];
                link.download = "Combined_API_Report.xlsx";
                document.body.appendChild(link);
                link.click();
                link.remove();
            }

            // Step 2️⃣: Generate DOCX
            if (!financialReport) {
                alert("No summary report available to download.");
                return;
            }

            const parsed =
                typeof financialReport === "string"
                    ? JSON.parse(financialReport)
                    : financialReport;

            // ✅ Handle both old & new field names safely
            const {
                review_response,
                compliance_level,
                completeness_audit = parsed.completness_audit, // fallback for old key
            } = parsed;

            // 🧽 Markdown cleanup helper
            const sanitize = (t = "") =>
                String(t)
                    .replaceAll("\\n", "\n")
                    .replace(/[*#`_>]/g, "") // remove markdown symbols
                    .replace(/\|/g, "|") // keep pipes for tables
                    .replace(/\n{2,}/g, "\n")
                    .replace(/[\x00-\x09\x0B-\x1F\x7F-\x9F]/g, "")
                    .trim();

            // 🧠 Extract text + table sections from mixed Markdown
            const extractSections = (text) => {
                const lines = text.split("\n");
                const sections = [];
                let buffer = [];
                let isTable = false;

                for (let line of lines) {
                    const isTableLine = /\|.*\|/.test(line);
                    if (isTableLine) {
                        isTable = true;
                        buffer.push(line);
                    } else {
                        if (isTable && buffer.length > 0) {
                            sections.push({ type: "table", content: buffer.join("\n") });
                            buffer = [];
                        }
                        isTable = false;
                        if (line.trim()) sections.push({ type: "text", content: line });
                    }
                }

                if (buffer.length > 0)
                    sections.push({ type: "table", content: buffer.join("\n") });

                return sections;
            };

            // 🧱 Create formatted table for Word
            const createTable = (markdown) => {
                const rows = markdown
                    .split("\n")
                    .filter((r) => r.includes("|"))
                    .map((line) =>
                        line
                            .split("|")
                            .filter((c) => c.trim() !== "")
                            .map((c) => sanitize(c.trim()))
                    );

                return new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: {
                        top: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
                        bottom: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
                        left: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
                        right: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
                        insideH: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
                        insideV: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
                    },
                    rows: rows.map(
                        (cells, i) =>
                            new TableRow({
                                children: cells.map(
                                    (cell) =>
                                        new TableCell({
                                            shading: i === 0 ? { type: "solid", color: "E9E6FF" } : {},
                                            children: [
                                                new Paragraph({
                                                    children: [
                                                        new TextRun({
                                                            text: cell,
                                                            bold: i === 0,
                                                            size: 22,
                                                        }),
                                                    ],
                                                    alignment: AlignmentType.CENTER,
                                                }),
                                            ],
                                        })
                                ),
                            })
                    ),
                });
            };

            // 🧩 Build DOCX content
            const docElements = [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "Financial Summary Report",
                            bold: true,
                            size: 36,
                            color: "4B3FFF",
                        }),
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 200 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Generated on: ${new Date().toLocaleString()}`,
                            italics: true,
                            size: 22,
                            color: "6B7280",
                        }),
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Overall Compliance Level: ${compliance_level || "N/A"}`,
                            bold: true,
                            color:
                                compliance_level === "High"
                                    ? "008000"
                                    : compliance_level === "Moderate"
                                        ? "E6A700"
                                        : compliance_level === "Low"
                                            ? "D32F2F"
                                            : "000000",
                            size: 26,
                        }),
                    ],
                    spacing: { after: 400 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "AI Review Summary:",
                            bold: true,
                            size: 26,
                        }),
                    ],
                    spacing: { after: 200 },
                }),
            ];

            // 🧠 Parse both text + table sections cleanly
            const reviewSections = extractSections(sanitize(review_response));
            reviewSections.forEach((section) => {
                if (section.type === "text") {
                    docElements.push(
                        new Paragraph({
                            children: [new TextRun({ text: section.content, size: 24 })],
                            spacing: { after: 150 },
                        })
                    );
                } else if (section.type === "table") {
                    docElements.push(createTable(section.content));
                    docElements.push(new Paragraph({ text: "", spacing: { after: 200 } }));
                }
            });

            // 🧾 Completeness Audit
            docElements.push(
                new Paragraph({
                    children: [new TextRun({ text: "Completeness Audit", bold: true, size: 26 })],
                    spacing: { after: 200 },
                })
            );

            const auditSections = extractSections(sanitize(completeness_audit));
            auditSections.forEach((section) => {
                if (section.type === "table") {
                    docElements.push(createTable(section.content));
                    docElements.push(new Paragraph({ text: "", spacing: { after: 200 } }));
                }
            });

            // Footer
            docElements.push(
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: "", italics: true, color: "888888", size: 20 })],
                })
            );

            const doc = new Document({ sections: [{ properties: {}, children: docElements }] });
            const blob = await Packer.toBlob(doc);
            saveAs(blob, "Financial_Summary_Report.docx");
        } catch (err) {
            console.error("Error generating report:", err);
            alert("Error generating DOCX. Check console for details.");
        }
    };
    useImperativeHandle(ref, () => ({
        downloadAll: handleDownloadBoth,
    }));

    return (
        <div style={{ margin: "20px 0", backgroundColor: "#fff", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
            {!isCollapsed && (
                <div>
                    {/* Sheet Tabs */}
                    <div style={{ marginBottom: "16px", display: "flex", gap: "10px", borderBottom: "1px solid #e5e7eb" }}>
                        {Object.keys(sheets).map((sheetName) => (
                            <button
                                key={sheetName}
                                onClick={() => setActiveSheet(sheetName)}
                                style={{
                                    padding: "8px 16px",
                                    border: "none",
                                    background: activeSheet === sheetName ? "#6C4CDC" : "#f3f4f6",
                                    color: activeSheet === sheetName ? "#fff" : "#6b7280",
                                    cursor: "pointer",
                                    fontSize: "13px",
                                    fontWeight: "500",
                                    borderRadius: "6px 6px 0 0",
                                    marginBottom: "-1px",
                                }}
                            >
                                {sheetName}
                            </button>
                        ))}
                    </div>

                    {/* Excel Grid */}
                    <div style={{ border: "1px solid #e5e7eb", borderRadius: "4px", overflow: "hidden", backgroundColor: "#fff", marginBottom: "16px" }}>
                        {/* Column Headers */}
                        <div style={{ display: "flex", backgroundColor: "#f9fafb" }}>
                            <div style={{ minWidth: "50px", width: "50px", height: "35px", borderRight: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb", backgroundColor: "#f3f4f6", flexShrink: 0 }}></div>
                            {Array.from({ length: maxCols }, (_, i) => (
                                <div key={i} style={{
                                    minWidth: `${getColumnWidth(i)}px`,
                                    width: `${getColumnWidth(i)}px`,
                                    height: "35px",
                                    borderRight: i < maxCols - 1 ? "1px solid #e5e7eb" : "none",
                                    borderBottom: "1px solid #e5e7eb",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "13px",
                                    color: "#6b7280",
                                    fontWeight: "500",
                                    backgroundColor: "#f9fafb",
                                    flexShrink: 0
                                }}>
                                    {getColumnHeader(i)}
                                </div>
                            ))}
                        </div>

                        {/* Data Rows */}
                        <div style={{ maxHeight: "400px", overflow: "auto" }}>
                            {Array.from({ length: maxRows }, (_, rowIndex) => {
                                const row = currentData[rowIndex] || [];
                                const rowHeight = getRowHeight(rowIndex);
                                return (
                                    <div key={rowIndex} style={{ display: "flex" }}>
                                        {/* Row Number */}
                                        <div style={{
                                            minWidth: "50px",
                                            width: "50px",
                                            height: `${rowHeight}px`,
                                            backgroundColor: "#f9fafb",
                                            borderRight: "1px solid #e5e7eb",
                                            borderBottom: rowIndex < maxRows - 1 ? "1px solid #e5e7eb" : "none",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: "13px",
                                            color: "#6b7280",
                                            fontWeight: "500",
                                            flexShrink: 0
                                        }}>{rowIndex + 1}</div>

                                        {/* Data Cells */}
                                        {Array.from({ length: maxCols }, (_, colIndex) => (
                                            <div key={colIndex} style={{
                                                minWidth: `${getColumnWidth(colIndex)}px`,
                                                width: `${getColumnWidth(colIndex)}px`,
                                                height: `${rowHeight}px`,
                                                borderRight: colIndex < maxCols - 1 ? "1px solid #e5e7eb" : "none",
                                                borderBottom: rowIndex < maxRows - 1 ? "1px solid #e5e7eb" : "none",
                                                display: "flex",
                                                alignItems: "center",
                                                padding: "0 12px",
                                                fontSize: "14px",
                                                color: "#374151",
                                                backgroundColor: "#fff",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                                flexShrink: 0
                                            }}>{row[colIndex] || ''}</div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Download Button */}
                    {/* {apiExcelUrls && apiExcelUrls.length > 0 && (
                        <button
                            onClick={handleDownloadBoth}
                            style={{
                                backgroundColor: "#6C4CDC",
                                color: "#fff",
                                border: "none",
                                borderRadius: "40px",
                                padding: "10px 20px",
                                fontSize: "14px",
                                fontWeight: "500",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            Download All
                            <img src={icon2} alt="download" style={{ width: "12px", height: "12px" }} />
                        </button>

                    )} */}
                </div>
            )}
        </div>
    );
  }
);

export default PreviewDataSection;
