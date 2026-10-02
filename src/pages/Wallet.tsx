import { useState, useEffect, type ReactNode } from 'react'
import { Link } from 'react-router'
import { QRCodeSVG } from 'qrcode.react'
import { Container, Hud, Cta, Badge, Panel, Brackets } from '../components/ui'
import { inr } from '../lib/data'
import {
  getWalletSummary,
  getWalletLedger,
  initiateWalletTopup,
  submitWalletTopupUtr,
  requestWalletWithdrawal,
  type WalletSummary,
  type WalletLedgerItem,
} from '../services/wallet'
import { useAuthContext } from '../context/AuthContext'
import { resolveMediaUrl } from '../services/apiClient'

function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-void/80 p-0 sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="page-in relative w-full max-w-md border border-white/15 bg-graphite p-6 md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <Brackets color="border-cyan/50" />
        <div className="flex items-center justify-between">
          <h3 className="font-display text-3xl font-black uppercase">{title}</h3>
          <button aria-label="Close" onClick={onClose} className="text-dim hover:text-ink">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function Wallet() {
  const { isSignedIn } = useAuthContext()

  const [wallet, setWallet] = useState<WalletSummary | null>(null)
  const [ledger, setLedger] = useState<WalletLedgerItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [modal, setModal] = useState<'add' | 'withdraw' | null>(null)
  const [amt, setAmt] = useState(500)
  const [withdrawUpi, setWithdrawUpi] = useState('')

  // Topup initiation state
  const [topupDetails, setTopupDetails] = useState<{
    payment_id: string
    amount_inr?: number
    upi_id: string
    payee_name: string
    upi_uri: string
    qr_url?: string
  } | null>(null)
  const [utr, setUtr] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [topupSuccess, setTopupSuccess] = useState(false)
  const [withdrawalSuccess, setWithdrawalSuccess] = useState(false)
  const [actionError, setActionError] = useState('')

  const fetchWalletData = async () => {
    if (!isSignedIn) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    try {
      const [sumRes, ledRes] = await Promise.allSettled([getWalletSummary(), getWalletLedger(5)])
      if (sumRes.status === 'fulfilled') setWallet(sumRes.value)
      if (ledRes.status === 'fulfilled') setLedger(ledRes.value)
    } catch {
      // Ignore
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchWalletData()
  }, [isSignedIn])

  const close = () => {
    setModal(null)
    setTopupDetails(null)
    setUtr('')
    setTopupSuccess(false)
    setWithdrawalSuccess(false)
    setActionError('')
  }

  const handleStartTopup = async () => {
    setIsSubmitting(true)
    setActionError('')
    try {
      const res = await initiateWalletTopup(amt)
      setTopupDetails(res)
    } catch (err: any) {
      setActionError(err.message || 'Failed to initiate deposit')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitTopupUtr = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topupDetails || utr.trim().length < 6) return
    setIsSubmitting(true)
    setActionError('')
    try {
      await submitWalletTopupUtr(topupDetails.payment_id, { utr: utr.trim() })
      setTopupSuccess(true)
      fetchWalletData()
    } catch (err: any) {
      setActionError(err.message || 'Failed to submit UTR reference')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    if (amt <= 0 || !withdrawUpi.includes('@')) {
      setActionError("Please provide a valid amount and UPI ID containing '@'")
      return
    }
    setIsSubmitting(true)
    setActionError('')
    try {
      await requestWalletWithdrawal(amt, withdrawUpi.trim())
      setWithdrawalSuccess(true)
      fetchWalletData()
    } catch (err: any) {
      setActionError(err.message || 'Withdrawal request failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const parseNum = (v: any) => {
    if (v === null || v === undefined) return 0
    const n = Number(v)
    return isNaN(n) ? 0 : n
  }

  const available = wallet
    ? parseNum(
        wallet.available_inr ??
        wallet.available_balance_inr ??
        (wallet.available_paise !== undefined ? wallet.available_paise / 100 : undefined) ??
        (wallet.inr_balance_paise !== undefined ? wallet.inr_balance_paise / 100 : undefined) ??
        wallet.inr_balance
      )
    : 0

  const reserved = wallet
    ? parseNum(
        wallet.reserved_inr ??
        (wallet.reserved_paise !== undefined ? wallet.reserved_paise / 100 : undefined) ??
        (wallet.inr_reserved_paise !== undefined ? wallet.inr_reserved_paise / 100 : undefined)
      )
    : 0

  const total = wallet
    ? parseNum(
        wallet.total_inr ??
        (wallet.total_paise !== undefined ? wallet.total_paise / 100 : undefined) ??
        (wallet.inr_balance_paise !== undefined ? wallet.inr_balance_paise / 100 : undefined) ??
        (available + reserved)
      )
    : 0

  return (
    <div className="relative min-h-screen bg-void pb-28 pt-32">
      <Container>
        <Hud className="text-cyan">◇ Secure · Encrypted</Hud>
        <h1 className="reveal mt-3 font-display text-[clamp(2.75rem,8vw,7rem)] font-black uppercase leading-[0.85]">
          Ametheus wallet
        </h1>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Panel className="overflow-hidden p-6 md:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_0%_100%,rgb(62_242_255/0.15),transparent_60%)]" />
            <div className="relative">
              <Hud>Available balance</Hud>
              <p className="mt-2 font-display text-[clamp(4rem,12vw,9rem)] font-black leading-none tabular-nums">
                {inr(available)}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Cta small onClick={() => setModal('add')}>
                  Add money
                </Cta>
                <Cta small ghost onClick={() => setModal('withdraw')}>
                  Withdraw winnings
                </Cta>
                <Cta small ghost to="/transactions">
                  Ledger History
                </Cta>
              </div>
            </div>
          </Panel>
          <div className="grid gap-px border border-white/10 bg-white/10">
            {[
              ['Total Balance', total, 'Total account funds', '#e8eaf2'],
              ['Withdrawable / Available', available, 'Instant tournament entry / withdrawal', '#2fe6b0'],
              ['Reserved / Locked', reserved, 'In active tournaments / pending withdrawals', '#ffb547'],
            ].map(([k, v, s, c]) => (
              <div key={k as string} className="flex items-center justify-between bg-void p-5 md:p-6">
                <div>
                  <Hud>{k}</Hud>
                  <p className="mt-1 text-xs text-dim">{s}</p>
                </div>
                <p className="font-display text-3xl font-black tabular-nums" style={{ color: c as string }}>
                  {inr(v as number)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex items-end justify-between">
          <Hud className="text-cyan">◇ Recent transactions</Hud>
          <Link
            to="/transactions"
            className="font-mono text-[10px] uppercase tracking-[0.2em] text-dim hover:text-cyan"
          >
            View all →
          </Link>
        </div>

        <div className="mt-4 border border-white/10">
          <div className="hidden grid-cols-[140px_1fr_120px_140px] gap-4 border-b border-white/10 px-5 py-3 md:grid">
            {['Date', 'Type / Note', 'Amount', 'Balance After'].map((h) => (
              <Hud key={h}>{h}</Hud>
            ))}
          </div>
          {ledger.length === 0 ? (
            <div className="p-8 text-center text-sm text-dim">
              No transactions recorded in wallet ledger yet.
            </div>
          ) : (
            ledger.map((t) => (
              <div
                key={t.id}
                className="grid grid-cols-2 gap-2 border-b border-white/5 px-5 py-4 last:border-0 md:grid-cols-[140px_1fr_120px_140px] md:items-center md:gap-4"
              >
                <span className="text-xs text-dim font-mono">
                  {new Date(t.created_at).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <div>
                  <span className="font-display text-sm font-black uppercase text-ink block">
                    {t.entry_type} · {t.source_type}
                  </span>
                  {t.description && <span className="text-xs text-dim">{t.description}</span>}
                </div>
                <span
                  className={`font-display text-lg font-black tabular-nums ${
                    t.entry_type === 'CREDIT' ? 'text-ok' : 'text-live'
                  }`}
                >
                  {t.entry_type === 'CREDIT' ? '+' : '−'}
                  {inr(t.amount_inr)}
                </span>
                <span className="text-xs text-dim font-mono text-right md:text-left">
                  {inr(t.balance_after_inr)}
                </span>
              </div>
            ))
          )}
        </div>
      </Container>

      {/* TOPUP & WITHDRAW MODALS */}
      {modal === 'add' && (
        <Modal title="Add Money" onClose={close}>
          {topupSuccess ? (
            <div className="py-8 text-center">
              <p className="text-4xl text-ok">✓</p>
              <p className="mt-3 font-display text-2xl font-black uppercase">
                Payment Submitted
              </p>
              <p className="mt-2 text-sm text-dim">
                UTR {utr} received. Once verified by our payment gateway, ₹{amt} will be credited to your available balance.
              </p>
              <Cta small className="mt-6" onClick={close}>
                Done
              </Cta>
            </div>
          ) : !topupDetails ? (
            <div className="space-y-4">
              <Hud className="block">Select Amount</Hud>
              <div className="grid grid-cols-3 gap-2">
                {[100, 250, 500, 1000, 2000, 5000].map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAmt(a)}
                    className={`border py-3 font-display text-xl font-black ${
                      amt === a
                        ? 'border-cyan bg-cyan/10 text-cyan'
                        : 'border-white/15 hover:border-white/40'
                    }`}
                  >
                    {inr(a)}
                  </button>
                ))}
              </div>
              <div>
                <label className="text-xs text-dim">Custom Amount (₹)</label>
                <input
                  type="number"
                  min="10"
                  value={amt}
                  onChange={(e) => setAmt(Number(e.target.value))}
                  className="mt-1 w-full border-b border-white/20 bg-transparent py-2 font-display text-2xl font-black outline-none focus:border-cyan"
                />
              </div>
              {actionError && (
                <p className="border border-live/30 bg-live/10 p-2 font-mono text-xs text-live">
                  {actionError}
                </p>
              )}
              <Cta
                className="w-full mt-4"
                disabled={isSubmitting || amt <= 0}
                onClick={handleStartTopup}
              >
                {isSubmitting ? 'Generating UPI QR...' : `Proceed to Pay ${inr(amt)}`}
              </Cta>
            </div>
          ) : (
            <form onSubmit={handleSubmitTopupUtr} className="space-y-4 text-center">
              <Hud className="text-cyan">Scan to Pay via Any UPI App</Hud>
              <div className="mx-auto my-3 flex justify-center bg-white p-3 rounded-lg w-fit">
                {topupDetails.qr_url ? (
                  <img
                    src={resolveMediaUrl(topupDetails.qr_url)}
                    alt="UPI QR Code"
                    className="size-44 object-contain"
                  />
                ) : (
                  <QRCodeSVG value={topupDetails.upi_uri} size={180} />
                )}
              </div>
              <div className="bg-void p-3 font-mono text-xs text-dim rounded space-y-1">
                <p>
                  Payee: <b className="text-ink">{topupDetails.payee_name}</b>
                </p>
                <p>
                  UPI ID: <b className="text-cyan">{topupDetails.upi_id}</b>
                </p>
                <p>
                  Amount: <b className="text-ok">₹{topupDetails.amount_inr}</b>
                </p>
              </div>
              <div className="text-left pt-2">
                <label className="text-xs text-dim">Enter 12-digit UPI UTR / Ref No.</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 427812984123"
                  value={utr}
                  onChange={(e) => setUtr(e.target.value.trim())}
                  className="mt-1 w-full border border-white/20 bg-void p-2.5 font-mono text-sm uppercase outline-none focus:border-cyan"
                />
              </div>
              {actionError && (
                <p className="border border-live/30 bg-live/10 p-2 font-mono text-xs text-live">
                  {actionError}
                </p>
              )}
              <Cta type="submit" disabled={isSubmitting || utr.length < 6} className="w-full mt-2">
                {isSubmitting ? 'Verifying...' : 'Submit UTR & Complete Top-up'}
              </Cta>
            </form>
          )}
        </Modal>
      )}

      {modal === 'withdraw' && (
        <Modal title="Withdraw Winnings" onClose={close}>
          {withdrawalSuccess ? (
            <div className="py-8 text-center">
              <p className="text-4xl text-ok">✓</p>
              <p className="mt-3 font-display text-2xl font-black uppercase">
                Withdrawal Requested
              </p>
              <p className="mt-2 text-sm text-dim">
                ₹{amt} requested to {withdrawUpi}. Processed within 24 hours.
              </p>
              <Cta small className="mt-6" onClick={close}>
                Done
              </Cta>
            </div>
          ) : (
            <form onSubmit={handleWithdraw} className="space-y-4">
              <p className="text-xs text-dim">
                Available to withdraw: <b className="text-ok">{inr(available)}</b>
              </p>
              <div>
                <label className="text-xs text-dim">Withdrawal Amount (₹)</label>
                <input
                  type="number"
                  min="100"
                  max={available}
                  value={amt}
                  onChange={(e) => setAmt(Number(e.target.value))}
                  className="mt-1 w-full border-b border-white/20 bg-transparent py-2 font-display text-2xl font-black outline-none focus:border-cyan"
                />
              </div>
              <div>
                <label className="text-xs text-dim">Your Destination UPI ID</label>
                <input
                  type="text"
                  required
                  placeholder="yourname@okhdfc"
                  value={withdrawUpi}
                  onChange={(e) => setWithdrawUpi(e.target.value)}
                  className="mt-1 w-full border border-white/20 bg-void p-2.5 font-mono text-sm outline-none focus:border-cyan"
                />
              </div>
              {actionError && (
                <p className="border border-live/30 bg-live/10 p-2 font-mono text-xs text-live">
                  {actionError}
                </p>
              )}
              <Cta
                type="submit"
                disabled={isSubmitting || amt <= 0 || amt > available}
                className="w-full mt-4"
              >
                {isSubmitting ? 'Submitting...' : `Withdraw ${inr(amt)}`}
              </Cta>
            </form>
          )}
        </Modal>
      )}
    </div>
  )
}
