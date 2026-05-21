export interface Ingredient {
  name: string;
  primaryType: string | null;
  secondaryType: string | null;
}

export interface Product {
  regNum: string;
  regType: string;
  abn: string;
  productName: string;
  company: string;
  companyNum: string;
  ingredients: Ingredient[];
  ingredientCount: number;
  crops: string[];
  primaryTypes: string[];
  status: string;
  statusGroup: string;
  statusDate: string;
  dateFirstRegistered: string;
  latestLabelDate: string;
  pesticideType: string;
  pesticideCategory: string;
  physicalForm: string;
  signalWord: string;
  restrictedUse: boolean;
  restrictedUseReason: string;
  transferHistory: string;
  meeToo: string;
  notes: string;
}

export interface ColDef {
  key: string;
  label: string;
  sortable?: boolean;
  thClass?: string;
  tdClass?: string;
}
