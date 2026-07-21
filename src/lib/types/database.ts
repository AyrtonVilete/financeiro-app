export type RiskProfile = "conservador" | "moderado" | "arrojado";
export type CategoryKind = "expense" | "income";
export type TransactionKind = "expense" | "income";

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  risk_profile: RiskProfile | null;
  monthly_surplus: number | null;
  created_at: string;
}

export interface Household {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
}

export interface HouseholdMember {
  household_id: string;
  user_id: string;
  joined_at: string;
}

export interface Category {
  id: string;
  user_id: string | null;
  name: string;
  icon: string;
  color: string;
  kind: CategoryKind;
  created_at: string;
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  household_id: string | null;
  category_id: string | null;
  kind: TransactionKind;
  amount: number;
  description: string | null;
  occurred_at: string;
  is_shared: boolean;
  created_at: string;
  installment_group_id: string | null;
  installment_number: number | null;
  installment_total: number | null;
}

export interface TransactionWithRelations extends Transaction {
  category: Category | null;
  items: TransactionItem[];
}
