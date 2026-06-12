/**
 * normalizeMarkdownTables
 * -----------------------
 * remark-gfm renders a markdown table only when the table is a clean,
 * self-contained block:
 *   - it is separated from surrounding text by a blank line, and
 *   - its second line is a delimiter row (e.g. | --- | --- |).
 *
 * LLM / free-form markdown frequently breaks one of these structural rules:
 *   1. No blank line before/after the table, so GFM folds the header row into
 *      the preceding paragraph and never treats it as a table.
 *   2. The delimiter row is missing.
 * In both cases the table falls back to plain text (each cell on its own line),
 * which is the bug seen in the CareVoice explanation / template views.
 *
 * This helper is intentionally *structural only*. It does NOT inspect, drop,
 * reorder or rewrite any cell content — it never assumes what the table is
 * about. It only:
 *   - wraps a contiguous run of pipe rows in blank lines, and
 *   - inserts a delimiter row derived purely from the header's column count
 *     when one is missing.
 * The actual parsing is then left entirely to remark-gfm, so any valid
 * markdown still flows through unchanged.
 */
function normalizeMarkdownTables(markdown) {
    if (!markdown || typeof markdown !== "string") return markdown;

    const lines = markdown.replace(/\r\n/g, "\n").split("\n");
    const output = [];
    let i = 0;

    // A row that belongs to a pipe table: starts (after optional spaces) with "|".
    const isTableRow = (l) => /^\s*\|/.test(l) && l.includes("|");

    // A GFM delimiter row: cells made only of -, :, spaces and pipes,
    // with at least one dash. e.g. | --- | :--: |  or  |---|---|
    const isDelimiterRow = (l) =>
        /-/.test(l) && /^\s*\|?[\s:|-]*\|?\s*$/.test(l) && l.includes("-");

    const columnCount = (headerLine) =>
        headerLine
            .trim()
            .replace(/^\|/, "")
            .replace(/\|$/, "")
            .split("|").length;

    while (i < lines.length) {
        if (isTableRow(lines[i])) {
            const block = [];
            while (i < lines.length && isTableRow(lines[i])) {
                block.push(lines[i]);
                i++;
            }

            // A single pipe line is not a table (could be a "FIELD | text"
            // heading); leave it exactly as-is.
            if (block.length >= 2) {
                // Ensure a blank line before the table block.
                if (output.length > 0 && output[output.length - 1].trim() !== "") {
                    output.push("");
                }

                // Ensure the second line is a delimiter row; if not, synthesise
                // one from the header's column count without altering any cell.
                if (!isDelimiterRow(block[1])) {
                    const cols = Math.max(columnCount(block[0]), 1);
                    const delimiter =
                        "| " + Array(cols).fill("---").join(" | ") + " |";
                    block.splice(1, 0, delimiter);
                }

                output.push(...block);

                // Ensure a blank line after the table block.
                if (i < lines.length && lines[i].trim() !== "") {
                    output.push("");
                }
            } else {
                output.push(...block);
            }
        } else {
            output.push(lines[i]);
            i++;
        }
    }

    return output.join("\n");
}

export default normalizeMarkdownTables;
