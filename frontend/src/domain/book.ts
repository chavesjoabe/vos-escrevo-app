export interface Book {
  id: string;
  name: string;
  abbreviation: string;
  testament: 'OT' | 'NT';
  orderInTestament?: number;
  pericopeCount: number;
  pericopeIds?: string[];
  description?: string;
}
