/**
 * Utility functions untuk menggantikan moment.js
 * Menggunakan native Date untuk performa yang lebih baik
 */

/**
 * Format date ke YYYY-MM-DD
 */
export function formatDate(date: Date | string | null | undefined): string | undefined {
  if (!date) return undefined;
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return undefined;
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date ke YYYYMMDD (untuk password hash)
 */
export function formatDateCompact(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Hitung umur dari date of birth
 */
export function calculateAge(dateOfBirth: Date | string | null | undefined): number | undefined {
  if (!dateOfBirth) return undefined;
  const dob = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
  if (isNaN(dob.getTime())) return undefined;
  
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  
  // Validate age: negative age indicates data quality issue (future date)
  if (age < 0) {
    console.warn(`Invalid age calculated: ${age} for date of birth: ${dob.toISOString()}. Date appears to be in the future.`);
    return undefined;
  }
  
  return age;
}

