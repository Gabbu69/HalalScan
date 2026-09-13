import type { IngredientEvidence, ProductVerdict } from "../shared/verdict";
export interface ScanRecord {
  id: string;
  date: string;
  barcode: string;
  name: string;
  brand: string;
  image: string | null;
  ingredients: string;
  verdict: ProductVerdict;
  originalVerdict?: string;
  favorite?: boolean;
  confidence: number;
  flagged_ingredients: string[];
  reason: string;
  recommendation: string;
  certification?: {
    input?: string;
    recognized?: boolean;
    status?: string;
    reason?: string;
  };
  ingredient_results?: IngredientEvidence[];
  triggered_rules?: string[];
  rubric_evidence?: any;
  architectureDetails?: any;
  evidenceMode?:
    "local-rules" | "server-rules" | "online-services" | "historical";
  policyVersion?: number;
}
export interface AnalysisDraft {
  id: string;
  mode: "barcode" | "photo" | "text";
  barcode?: string;
  text?: string;
  name?: string;
  image?: string | null;
}
