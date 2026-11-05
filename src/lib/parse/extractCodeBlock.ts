export function extractCodeBlock(text: string, language?: "json" | "js"): string {
  const cleanText = text.replace(/^\uFEFF/, "").trim();
  const fencePattern = /```([a-zA-Z0-9_-]*)[ \t]*\r?\n?([\s\S]*?)```/g;
  const blocks: Array<{ language: string; content: string }> = [];
  let match = fencePattern.exec(cleanText);
  while (match) {
    blocks.push({ language: match[1].toLowerCase(), content: match[2].trim() });
    match = fencePattern.exec(cleanText);
  }

  if (blocks.length > 0) {
    if (language === "json") {
      const jsonBlock = blocks.find((block) => block.language === "json" || block.language === "");
      if (jsonBlock) return jsonBlock.content;
    }
    if (language === "js") {
      const jsBlock = blocks.find((block) => block.language === "js" || block.language === "javascript" || block.language === "");
      if (jsBlock) return jsBlock.content;
    }
    return blocks[0].content;
  }

  if (language === "json" || !language) {
    const firstBrace = cleanText.indexOf("{");
    const lastBrace = cleanText.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return cleanText.slice(firstBrace, lastBrace + 1);
    }
  }

  return cleanText;
}
