/**
 * 📄 HTML to Markdown Converter
 * 
 * Simple converter for exporting notes as Markdown.
 * Handles headings, lists, bold/italic, code, blockquotes, and links.
 */

export function htmlToMarkdown(html: string): string {
  let md = html;

  // Remove leading/trailing whitespace from the full string
  md = md.trim();

  // Headings
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n");
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n");
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n");
  md = md.replace(/<h4[^>]*>(.*?)<\/h4>/gi, "#### $1\n\n");
  md = md.replace(/<h5[^>]*>(.*?)<\/h5>/gi, "##### $1\n\n");
  md = md.replace(/<h6[^>]*>(.*?)<\/h6>/gi, "###### $1\n\n");

  // Bold and italic
  md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**");
  md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**");
  md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*");
  md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, "*$1*");

  // Code
  md = md.replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`");

  // Code blocks (pre > code)
  md = md.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, "\n```\n$1\n```\n");
  md = md.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, "\n```\n$1\n```\n");

  // Blockquotes
  md = md.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, content) => {
    const cleaned = content.replace(/<\/?p[^>]*>/gi, "").trim();
    return cleaned
      .split("\n")
      .map((line: string) => `> ${line.trim()}`)
      .join("\n") + "\n\n";
  });

  // Links
  md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)");

  // Unordered lists
  md = md.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_, content) => {
    return (
      content.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_: string, item: string) => {
        const cleaned = item.replace(/<\/?p[^>]*>/gi, "").trim();
        return `- ${cleaned}\n`;
      }) + "\n"
    );
  });

  // Ordered lists
  let listCounter = 0;
  md = md.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, content) => {
    listCounter = 0;
    return (
      content.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_: string, item: string) => {
        listCounter++;
        const cleaned = item.replace(/<\/?p[^>]*>/gi, "").trim();
        return `${listCounter}. ${cleaned}\n`;
      }) + "\n"
    );
  });

  // Horizontal rules
  md = md.replace(/<hr[^>]*\/?>/gi, "\n---\n\n");

  // Line breaks
  md = md.replace(/<br[^>]*\/?>/gi, "\n");

  // Paragraphs
  md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "$1\n\n");

  // Strip remaining HTML tags
  md = md.replace(/<[^>]+>/g, "");

  // Decode HTML entities
  md = md.replace(/&amp;/g, "&");
  md = md.replace(/&lt;/g, "<");
  md = md.replace(/&gt;/g, ">");
  md = md.replace(/&quot;/g, '"');
  md = md.replace(/&#39;/g, "'");
  md = md.replace(/&nbsp;/g, " ");

  // Clean up excessive blank lines
  md = md.replace(/\n{3,}/g, "\n\n");

  return md.trim();
}
