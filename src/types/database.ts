export type UserRole = "employee" | "admin";

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  budget_amount: number;
  created_at: string;
}

export interface AppSettings {
  id: number;
  default_budget: number;
  updated_at: string | null;
  updated_by: string | null;
}

export interface Expense {
  id: string;
  serial_number: number;
  user_id: string;
  purchaser_name: string;
  purchase_date: string;
  amount: number;
  currency: string;
  receipt_path: string | null;
  no_receipt_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseWithProfile extends Expense {
  profiles?: Pick<Profile, "full_name"> | null;
}

export interface EmployeeLedgerSummary {
  id: string;
  full_name: string;
  budget_amount: number;
  total_expenses: number;
  remaining_budget: number;
}

export interface ExpenseFormData {
  purchase_date: string;
  amount: number;
  receipt_file: File | null;
  no_receipt_reason: string;
  has_receipt: boolean;
}
