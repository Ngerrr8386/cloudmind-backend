// Import qua lib path để tránh đoạn debug đọc file test trong index.js của pdf-parse.
declare module 'pdf-parse/lib/pdf-parse.js' {
  interface PdfParseResult {
    text: string
    numpages: number
    numrender: number
    info: unknown
    metadata: unknown
    version: string
  }
  function pdfParse(dataBuffer: Buffer): Promise<PdfParseResult>
  export default pdfParse
}
