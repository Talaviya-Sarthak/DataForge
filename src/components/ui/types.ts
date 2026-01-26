export interface Faq {
  question: string;
  answer: string;
}

export interface FaqCategory {
  [key: string]: string;
}

export interface FaqData {
  [key: string]: Faq[];
}
