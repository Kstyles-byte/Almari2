export function formatCurrency(amount: number): string {
  return `₦${amount.toLocaleString()}`;
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString();
}
