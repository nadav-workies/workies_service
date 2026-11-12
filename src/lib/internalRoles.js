export const INTERNAL_ROLES = [
  {
    key: "service_manager",
    label: "מנהלת שירות",
    department: "service"
  },
  {
    key: "collections_manager",
    label: "מנהל גבייה",
    department: "collections"
  },
  {
    key: "operations_manager",
    label: "מנהל תפעול",
    department: "operations"
  },
  {
    key: "maintenance_manager",
    label: "מנהל תחזוקה",
    department: "maintenance"
  },
  {
    key: "sales_manager",
    label: "מנהל מכירות",
    department: "sales"
  }
];

// תפקידים פנימיים עם גישה לניהול לידים
export const LEAD_INTERNAL_ROLES = ["sales_manager", "operations_manager", "collections_manager"];

export const DEPARTMENT_LABELS = {
  service: "שירות",
  collections: "גבייה",
  operations: "תפעול",
  maintenance: "תחזוקה",
  sales: "מכירות"
};

export function getInternalRoleLabel(key) {
  return INTERNAL_ROLES.find(r => r.key === key)?.label || "—";
}

export function getDepartmentLabel(dept) {
  return DEPARTMENT_LABELS[dept] || "—";
}

export function getInternalRoleByKey(key) {
  return INTERNAL_ROLES.find(r => r.key === key) || null;
}