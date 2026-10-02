import { apiClient } from './apiClient'

export interface WalletSummary {
  inr_balance: string
  inr_balance_paise: number
  inr_reserved_paise: number
  available_balance_inr: number
}

export interface WalletLedgerItem {
  id: string
  user_id: string
  amount_inr: number
  amount_paise: number
  balance_after_inr: number
  balance_after_paise: number
  entry_type: 'CREDIT' | 'DEBIT' | 'HOLD' | 'RELEASE'
  source_type: string
  reference_id?: string
  description?: string
  created_at: string
}

export async function getWalletSummary(): Promise<WalletSummary> {
  return apiClient<WalletSummary>('/wallet/balance')
}

export async function getWalletLedger(limit: number = 50, offset: number = 0): Promise<WalletLedgerItem[]> {
  return apiClient<WalletLedgerItem[]>(`/wallet/ledger?limit=${limit}&offset=${offset}`)
}

export async function initiateWalletTopup(amountInr: number): Promise<{
  payment_id: string
  amount_inr: number
  amount_paise: number
  payment_account_code: string
  upi_id: string
  payee_name: string
  qr_url?: string
  upi_uri: string
}> {
  return apiClient('/payments/wallet/topup/initiate', {
    method: 'POST',
    body: JSON.stringify({ amount_inr: amountInr }),
  })
}

export async function submitWalletTopupUtr(
  paymentId: string,
  payload: { utr: string; screenshot_url?: string }
): Promise<any> {
  return apiClient(`/payments/${paymentId}/submit-utr`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function requestWalletWithdrawal(amountInr: number, upiId: string): Promise<any> {
  return apiClient('/wallet/withdraw', {
    method: 'POST',
    body: JSON.stringify({ amount_inr: amountInr, upi_id: upiId }),
  })
}
