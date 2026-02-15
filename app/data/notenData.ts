// notenData.ts - Gesangsnoten / Sheet Music

export interface NotenItem {
  label: string;
  filename: string;
  thumbnail?: string;
}

export const notenCategories = [
  { label: 'Izberi noto', value: 0 },
  { label: 'Gesangsnoten', value: 1 },
];

export const notenDataMap: Record<number, NotenItem[]> = {
  0: [],
  // Gesangsnoten
  1: [
    {
      label: 'Mam pa mihno kajžo - Hanzi Kežar',
      filename: 'Mam pa mihno kajžo , Hanzi Kežar.pdf',
      thumbnail: 'Mam pa mihno kajžo , Hanzi Kežar.jpeg',
    },
  ],
};

// Base URL für Media Server
export const MEDIA_BASE_URL = 'https://media.kezar.at/videoarchiv/imagefiles';
