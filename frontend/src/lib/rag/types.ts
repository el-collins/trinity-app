export interface PageText {
  page: number;
  text: string;
}

export interface Chunk {
  index: number;
  page: number;
  text: string;
}

export interface RetrievedChunk {
  id: string;
  text: string;
  page: number;
  score: number;
  docId: string;
  docTitle: string;
  source: 'loan_doc' | 'field_help';
}

export interface Citation {
  id: number; // the N in [doc N]
  docTitle: string;
  page: number;
}

export interface AskResult {
  answer: string;
  citations: Citation[];
  abstained: boolean;
  ungroundedIds: number[];
}
