export interface CustomField {
  id: string;
  entity_type: 'camper' | 'staff';
  name: string;
  field_type: 'text' | 'number' | 'dropdown' | 'checkbox' | 'date';
  description: string | null;
  is_required: boolean;
  is_active: boolean;
  options?: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface CustomFieldValue {
  id: string;
  field_id: string;
  entity_id: string;
  value: unknown;
  created_at: string;
  updated_at: string;
  field?: CustomField;
}
