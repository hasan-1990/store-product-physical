export function isOrderPaidForInvoice(paymentStatus?: string | null): boolean {
  const status = (paymentStatus || '').toLowerCase();
  return status === 'paid' || status === 'completed';
}
