import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType } from "docx";
import { saveAs } from "file-saver";
import { marked } from "marked";

/**
 * Converts markdown to Word paragraphs & tables
 */
/**
 * Strips markdown formatting from text
 */
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
const parseMarkdownToDocx = (markdown) => {

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
                    content.push(
                        new Paragraph({
                            text: item.text,
                            bullet: { level: 0 },
                            spacing: { after: 100 },
                        })
                    );
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

const TlcAiWordExporter = ({ markdown, fileName }) => {
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

export default TlcAiWordExporter;