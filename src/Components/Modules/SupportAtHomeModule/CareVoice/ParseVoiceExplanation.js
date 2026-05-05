export const parseVoiceExplanation = (text) => {
    console.log("text", text)
    if (!text) return [];

    const blocks = text
        .split(/\n---\n/g) // section separators
        .map(b => b.trim())
        .filter(Boolean);

    return blocks.map((block, index) => {
        // Try to detect heading
        const lines = block.split("\n").filter(Boolean);
        const titleLine = lines[0];

        return {
            id: index,
            title: titleLine.length < 80 ? titleLine : `Section ${index + 1}`,
            content: lines.slice(1).join("\n"),
            raw: block
        };
    });
};
