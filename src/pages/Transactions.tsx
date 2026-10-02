import { useState, useEffect } from 'react'
import { Container, Hud, Chips, EmptyState } from '../components/ui'
import { inr } from '../lib/data'
import { getWalletLedger, type WalletLedgerItem } from '../services/wallet'
import { useAuthContext } from '../context/AuthContext'

const F = ['All', 'Deposits', 'Tournament Entries', 'Winnings', 'Withdrawals', 'Refunds'] as const

export default function Transactions() {
  const { isSignedIn } = useAuthContext()
  const [f, setF] = useState<(typeof F)[number]>('All')
  const [ledger, setLedger] = useState<WalletLedgerItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isSignedIn) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    getWalletLedger(100)
      .then((data) => {
        if (Array.isArray(data)) setLedger(data)
      })
      .catch((err) => console.warn('Could not load ledger:', err))
      .finally(() => setIsLoading(false))
  }, [isSignedIn])

  const filtered = ledger.filter((item) => {
    if (f === 'All') return true
    const s = (item.source_type || '').toUpperCase()
    if (f === 'Deposits') return s.includes('TOPUP') || s.includes('DEPOSIT')
    if (f === 'Tournament Entries') return s.includes('TOURNAMENT') || s.includes('ENTRY')
    if (f === 'Winnings') return s.includes('WINNING') || s.includes('PRIZE')
    if (f === 'Withdrawals') return s.includes('WITHDRAW') || s.includes('PAYOUT')
    if (f === 'Refunds') return s.includes('REFUND')
    return true
  })

  return (
    <div className="relative min-h-screen bg-void pb-28 pt-32">
      <Container>
        <Hud className="text-cyan">◇ Ledger</Hud>
        <h1 className="reveal mt-3 font-display text-[clamp(3rem,9vw,8rem)] font-black uppercase leading-[0.85]">
          Transactions
        </h1>
        <div className="mt-10">
          <Chips items={F} value={f} onChange={setF} />
        </div>
        <div className="mt-8">
          {isLoading ? (
            <div className="p-16 text-center border border-white/10 bg-surface/50">
              <div className="inline-block size-6 animate-spin rounded-full border-2 border-cyan border-t-transparent mb-3" />
              <Hud className="text-cyan">Retrieving financial ledger...</Hud>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              code="0"
              title="No transactions"
              body="No records found for this category."
              cta="Back to wallet"
              to="/wallet"
            />
          ) : (
            <div className="border border-white/10 divide-y divide-white/5">
              {filtered.map((t) => (
                <div
                  key={t.id}
                  className="grid grid-cols-2 gap-3 p-5 md:grid-cols-[160px_1fr_140px_140px] md:items-center"
                >
                  <div>
                    <p className="font-mono text-xs text-dim">
                      {new Date(t.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                    <Hud className="mt-0.5 text-[10px]">
                      {new Date(t.created_at).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Hud>
                  </div>
                  {(() => {
                    const isCredit =
                      t.entry_type === 'CREDIT' ||
                      t.source_type === 'WALLET_TOPUP' ||
                      (t.source_type && (t.source_type.includes('TOPUP') || t.source_type.includes('DEPOSIT') || t.source_type.includes('WINNING'))) ||
                      t.amount_inr > 0
                    const displayType = (t.source_type || (isCredit ? 'DEPOSIT' : 'WITHDRAWAL')).replace(/_/g, ' ')
                    const absAmount = Math.abs(t.amount_inr ?? 0)

                    return (
                      <>
                        <div>
                          <p className="font-display text-lg font-black uppercase text-ink">
                            {displayType}
                          </p>
                          <p className="font-mono text-xs text-dim">
                            {t.description || `Ledger Ref: ${t.reference_id || t.id.slice(0, 8)}`}
                          </p>
                        </div>
                        <div>
                          <span
                            className={`font-display text-2xl font-black tabular-nums ${
                              isCredit ? 'text-ok' : 'text-live'
                            }`}
                          >
                            {isCredit ? '+' : '−'}
                            {inr(absAmount)}
                          </span>
                          <Hud className="block text-[10px]">{isCredit ? 'CREDIT' : 'DEBIT'}</Hud>
                        </div>
                      </>
                    )
                  })()}
                  <div className="text-right md:text-left">
                    <p className="font-mono text-xs text-dim">Balance</p>
                    <p className="font-mono text-sm font-bold text-ink">
                      {inr(t.balance_after_inr)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Container>
    </div>
  )
}
