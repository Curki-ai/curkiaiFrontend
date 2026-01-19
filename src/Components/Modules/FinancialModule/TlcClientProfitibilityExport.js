import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType } from "docx";
import { saveAs } from "file-saver";
import { marked } from "marked";

import { ImageRun } from "docx";

export const addSectionWithGraphsToWord = async ({
    title,
    sectionKey,
    children,
    reportRoot,
    captureNode,
}) => {
    // console.log("📄 WORD EXPORT → Section:", sectionKey);

    children.push(
        new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 200 },
        })
    );

    if (!reportRoot) {
        console.warn("❌ reportRoot is null");
        return;
    }

    const sectionEl = reportRoot.querySelector(
        `[data-report-section="${sectionKey}"]`
    );

    // console.log("🔍 sectionEl:", sectionEl);

    if (!sectionEl) {
        console.warn(`❌ No section found for ${sectionKey}`);
        return;
    }
    // ✅ SCORE CARDS EXPORT
    const scoreCards = sectionEl.querySelectorAll(".summary-card");

    scoreCards.forEach(card => {
        const label = card.querySelector("p")?.innerText || "";
        const value = card.querySelector("h3")?.innerText || "";

        if (!label && !value) return;

        children.push(
            new Paragraph({
                children: [
                    new TextRun({ text: `${label}: `, bold: true }),
                    new TextRun({ text: value }),
                ],
                spacing: { after: 120 },
            })
        );
    });

    // const charts = sectionEl.querySelectorAll(".charts-grid > div");
    const charts = sectionEl.querySelectorAll(".chart-box");


    // console.log(`📊 Charts found in ${sectionKey}:`, charts.length);



    for (let i = 0; i < charts.length; i++) {
        const chart = charts[i];

        // 🧠 browser ko breath do
        // await new Promise(r => requestAnimationFrame(r));
        await new Promise(r => setTimeout(r, 50));


        if (!chart.offsetWidth || !chart.offsetHeight) continue;

        const { data, width, height } = await captureNode(chart);

        children.push(
            new Paragraph({
                children: [
                    new ImageRun({
                        data,
                        transformation: {
                            width: 550,
                            height: Math.round((height / width) * 550),
                        },
                    }),
                ],
                spacing: { after: 300 },
            })
        );
    }
    // ✅ TABLE EXPORT (Payroll Comparison ka last table)
    const tables = sectionEl.querySelectorAll(".table-box");

    // console.log(`📋 Tables found in ${sectionKey}:`, tables.length);

    for (let i = 0; i < tables.length; i++) {
        const table = tables[i];

        // await new Promise(r => requestAnimationFrame(r));
        await new Promise(r => setTimeout(r, 50));


        if (!table.offsetWidth || !table.offsetHeight) continue;

        const { data, width, height } = await captureNode(table);

        children.push(
            new Paragraph({
                children: [
                    new ImageRun({
                        data,
                        transformation: {
                            width: 550,
                            height: Math.round((height / width) * 550),
                        },
                    }),
                ],
                spacing: { after: 300 },
            })
        );
    }

};



const stripMarkdown = (markdown) => {
    return markdown
        // Remove bold formatting - handle **** (double asterisks on both sides)
        .replace(/\*{2,4}([^*]+)\*{2,4}/g, '$1')
        // Handle single asterisks for emphasis
        .replace(/\*([^*]+)\*/g, '$1')
        // Clean up any remaining asterisks
        .replace(/\*+/g, '')
        // Remove up arrow indicators (↑) and other special characters if needed
        .replace(/[↑↓]/g, '')
        // Keep markdown headers, bullets, and other structure
        // Clean up extra spaces
        .replace(/\s+/g, ' ')
        .trim();
};

// Alternative: A more aggressive approach that keeps structure but removes formatting
const cleanMarkdownForWord = (markdown) => {
    return markdown
        // Step 1: Fix the specific "****" issue with proper spacing
        .replace(/an \*\*\*\* in/g, 'an increase in') // Replace "an **** in" with "an increase in"
        .replace(/an \*\*↑\*\* in/g, 'an increase in') // Replace "an **↑** in" with "an increase in"
        // Step 2: Handle bold text with any number of asterisks
        .replace(/\*{2,}([^*\n]+)\*{2,}/g, '$1')
        // Step 3: Handle italic text
        .replace(/\*([^*\n]+)\*/g, '$1')
        // Step 4: Clean up any stray asterisks
        .replace(/(?<=\s)\*+(?=\s)/g, '')
        .replace(/^\*+/gm, '')
        // Step 5: Fix the "**.**" issue
        .replace(/\*\*\.\*\*/g, 'increase')
        // Step 6: Fix spacing issues
        .replace(/anincrease/g, 'an increase') // Fix "anincrease" to "an increase"
        .replace(/a increase/g, 'an increase') // Fix "a increase" to "an increase"
        // Step 7: Remove special characters if they're causing issues
        .replace(/[↑↓◆●]/g, '');
};
export const parseMarkdownToDocx = (markdown) => {

    const cleanMarkdown = cleanMarkdownForWord(markdown);
    const tokens = marked.lexer(cleanMarkdown);
    const content = [];

    tokens.forEach((token) => {
        switch (token.type) {
            case "heading":
                content.push(
                    new Paragraph({
                        text: token.text,
                        heading:
                            token.depth === 1
                                ? HeadingLevel.HEADING_1
                                : token.depth === 2
                                    ? HeadingLevel.HEADING_2
                                    : HeadingLevel.HEADING_3,
                        spacing: { after: 200 },
                    })
                );
                break;

            case "paragraph":
                content.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: token.text,
                                font: "Calibri",
                                size: 24,
                            }),
                        ],
                        spacing: { after: 200 },
                    })
                );
                break;

            case "list":
                token.items.forEach((item) => {
                    // Split raw text by lines
                    const lines = item.raw
                        .split("\n")
                        .map(l => l.replace(/^-\s*/, "").trim())
                        .filter(Boolean);

                    lines.forEach((line, index) => {
                        content.push(
                            new Paragraph({
                                text: line,
                                bullet: { level: index === 0 ? 0 : 1 }, // 👈 nested bullets
                                spacing: { after: 100 },
                            })
                        );
                    });
                });
                break;


            case "table":
                const rows = token.rows.map((row) =>
                    new TableRow({
                        children: row.map(
                            (cell) =>
                                new TableCell({
                                    width: { size: 25, type: WidthType.PERCENTAGE },
                                    children: [
                                        new Paragraph({
                                            text: cell,
                                            spacing: { after: 100 },
                                        }),
                                    ],
                                })
                        ),
                    })
                );

                content.push(
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows,
                    })
                );
                break;

            case "code":
                content.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: token.text,
                                font: "Courier New",
                                size: 22,
                            }),
                        ],
                        shading: {
                            fill: "F3F4F6",
                        },
                        spacing: { after: 200 },
                    })
                );
                break;

            default:
                break;
        }
    });

    return content;
};

export const TlcClientProfitibilityAiWordExporter = ({ markdown, fileName }) => {
    const downloadWord = async () => {
        if (!markdown) {
            alert("No AI summary available");
            return;
        }

        const doc = new Document({
            sections: [
                {
                    children: [
                        new Paragraph({
                            text: "AI Summary Report",
                            heading: HeadingLevel.TITLE,
                            spacing: { after: 300 },
                        }),
                        ...parseMarkdownToDocx(markdown),
                    ],
                },
            ],
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `${fileName}.docx`);
    };

    return downloadWord;
};

export default TlcClientProfitibilityAiWordExporter;