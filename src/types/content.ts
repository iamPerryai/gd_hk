export type Scene =
  | "Meeting"
  | "Follow up"
  | "Approval"
  | "Client"
  | "Teamwork"
  | "OT / Urgent";

export type AudioStatus =
  | "pending"
  | "generating"
  | "generated"
  | "approved"
  | "rejected";

export type ReviewStatus =
  | "draft"
  | "reviewing"
  | "approved"
  | "rejected"
  | "published";

export type FeedbackType = "useful" | "normal" | "unnatural";

export interface Keyword {
  word: string;
  meaning: string;
  ipa?: string;
  partOfSpeech?: string;
  example?: string;
}

export interface ContentItem {
  id: string;
  contentNo: string;
  scene: string;
  hookText: string | null;
  cantoneseText: string;
  explanation: string;
  mainKeyword: unknown;
  supportKeywords: unknown;
  tags: unknown;
  audioUrl: string | null;
  audioStatus: string;
  reviewStatus: string;
  isToday: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface ContentListItem {
  id: string;
  contentNo: string;
  scene: string;
  hookText: string | null;
  cantoneseText: string;
  explanation: string;
  mainKeyword: unknown;
  supportKeywords: unknown;
  audioUrl: string | null;
  isToday: boolean;
}
