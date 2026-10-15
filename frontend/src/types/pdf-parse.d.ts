declare module 'pdf-parse/lib/pdf-parse.js' {
  interface PdfPageData {
    getTextContent(opts?: object): Promise<{ items: { str: string }[] }>;
  }
  interface Options {
    pagerender?: (page: PdfPageData) => Promise<string> | string;
  }
  function pdf(data: Uint8Array, options?: Options): Promise<{ numpages: number; text: string }>;
  export default pdf;
}
