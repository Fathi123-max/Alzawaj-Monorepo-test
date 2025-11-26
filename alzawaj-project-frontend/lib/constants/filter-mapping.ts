// Mapping between frontend Arabic display values and backend API values

// Frontend Arabic → Backend English mappings
const educationMap: Record<string, string> = {
  'ابتدائي': 'primary',
  'ثانوي': 'secondary',
  'ثانوي عام': 'high-school',
  'دبلوم': 'diploma',
  'جامعي': 'bachelor',
  'بكالوريوس': 'bachelor',
  'دراسات عليا': 'master',
  'ماجستير': 'master',
  'دكتوراه': 'doctorate',
  'أخرى': 'other',
};

const maritalStatusMap: Record<string, string> = {
  'أعزب': 'single',
  'عزباء': 'single',
  'مطلق': 'divorced',
  'مطلقة': 'divorced',
  'أرمل': 'widowed',
  'أرملة': 'widowed',
};

const religiousLevelMap: Record<string, string> = {
  'أساسي': 'basic',
  'متوسط': 'moderate',
  'ملتزم': 'practicing',
  'ملتزم جداً': 'very-religious',
};

// Validate and convert all filters for backend
export function validateAndConvertFilters(filters: Record<string, any>): Record<string, any> {
  const converted: Record<string, any> = { ...filters };

  // Convert education
  if (converted.education) {
    converted.education = educationMap[converted.education] || converted.education;
  }

  // Convert marital status
  if (converted.maritalStatus) {
    converted.maritalStatus = maritalStatusMap[converted.maritalStatus] || converted.maritalStatus;
  }

  // Convert religiousLevel → religiousCommitment (backend parameter name)
  if (converted.religiousLevel) {
    converted.religiousCommitment = religiousLevelMap[converted.religiousLevel] || converted.religiousLevel;
    delete converted.religiousLevel;
  }

  // Remove frontend-only fields that backend doesn't accept
  // Backend automatically determines gender based on logged-in user
  delete converted.gender;

  return converted;
}
