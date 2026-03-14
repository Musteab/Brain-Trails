export interface DocxImportResult {
  html: string;
  plainText: string;
  messages: string[];
}

export async function importDocx(file: File): Promise<DocxImportResult> {
  const mammoth = await import("mammoth");
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const htmlResult = await mammoth.default.convertToHtml({ arrayBuffer });
        const textResult = await mammoth.default.extractRawText({ arrayBuffer });

        resolve({
          html: htmlResult.value,
          plainText: textResult.value,
          messages: htmlResult.messages.map((m: { message: string }) => m.message),
        });
      } catch (error) {
        reject(new Error("Failed to parse document: " + error));
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsArrayBuffer(file);
  });
}

export function cleanImportedHtml(html: string): string {
  let cleaned = html.replace(/<p>\s*<\/p>/g, "");
  cleaned = cleaned.replace(/<p><strong>(.*?)<\/strong><\/p>/g, "<h2>$1</h2>");
  cleaned = cleaned.replace(/(<\/h[1-6]>)(<h[1-6]>)/g, "$1<p></p>$2");
  return cleaned;
}
