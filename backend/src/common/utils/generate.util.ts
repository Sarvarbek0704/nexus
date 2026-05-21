import { v4 as uuidv4 } from 'uuid';

export function generateContractNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CNT-${timestamp}-${random}`;
}

export function generateInvoiceNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV-${timestamp}-${random}`;
}

export function generateDisputeNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `DSP-${timestamp}-${random}`;
}

export function generateTransactionId(): string {
  return `TXN-${uuidv4().replace(/-/g, '').toUpperCase().substring(0, 16)}`;
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function generateUsername(firstName: string, lastName: string): string {
  const base = `${firstName.toLowerCase()}${lastName.toLowerCase()}`.replace(/[^a-z0-9]/g, '');
  const random = Math.floor(Math.random() * 9999);
  return `${base}${random}`;
}

export function generateVerificationToken(): string {
  return uuidv4().replace(/-/g, '');
}
