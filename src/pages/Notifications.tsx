import { useState, useEffect } from 'react'
import { Container, Hud, Chips, EmptyState } from '../components/ui'
import { NotificationCard } from '../components/kit'
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearNotification,
  clearAllNotifications,
  type NotificationItem,
} from '../services/notifications'
import { useAuthContext } from '../context/AuthContext'

const C = ['All', 'System', 'Team', 'Wallet', 'Registration', 'Batches'] as const
type Cat = Exclude<(typeof C)[number], 'All'>
const GLYPH: Record<Cat, string> = {
  System: '◇',
  Team: '⬡',
  Wallet: '₹',
  Registration: '✎',
  Batches: '☰',
}

export function getCanonicalCategory(n: NotificationItem): Cat {
  const cat = (n.category || '').toUpperCase()
  if (cat === 'WALLET') return 'Wallet'
  if (cat === 'REGISTRATION') return 'Registration'
  if (cat === 'TEAM') return 'Team'
  if (cat === 'BATCHES' || cat === 'BATCH') return 'Batches'
  if (cat === 'SYSTEM') return 'System'

  // Heuristic fallbacks for legacy records
  const type = (n.type || '').toUpperCase()
  const title = (n.title || '').toUpperCase()

  if (
    type.includes('WALLET') ||
    type.includes('PAYMENT') ||
    type.includes('PAYOUT') ||
    type.includes('WITHDRAW') ||
    title.includes('PAYMENT') ||
    title.includes('WALLET') ||
    title.includes('WITHDRAWAL') ||
    title.includes('DEPOSIT')
  ) {
    return 'Wallet'
  }

  if (
    type.includes('REGISTR') ||
    title.includes('REGISTER') ||
    title.includes('REGISTRATION')
  ) {
    return 'Registration'
  }

  if (
    type.includes('TEAM') ||
    type.includes('ROSTER') ||
    type.includes('SQUAD') ||
    title.includes('TEAM') ||
    title.includes('ROSTER')
  ) {
    return 'Team'
  }

  if (type.includes('BATCH') || title.includes('BATCH')) {
    return 'Batches'
  }

  return 'System'
}

export default function Notifications() {
  const { isSignedIn } = useAuthContext()
  const [cat, setCat] = useState<(typeof C)[number]>('All')
  const [items, setItems] = useState<NotificationItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchItems = () => {
    if (!isSignedIn) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    getNotifications()
      .then((data) => {
        if (Array.isArray(data)) setItems(data)
      })
      .catch((err) => console.warn('Could not fetch notifications:', err))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    fetchItems()
  }, [isSignedIn])

  const handleMarkOne = async (id: string) => {
    try {
      await markNotificationAsRead(id)
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    } catch {}
  }

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsAsRead()
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })))
    } catch {}
  }

  const handleClearOne = async (id: string) => {
    // Instantly remove from active frontend view while preserving DB record
    setItems((prev) => prev.filter((n) => n.id !== id && n._id !== id))
    try {
      await clearNotification(id)
    } catch (err) {
      console.warn('Could not clear notification:', err)
    }
  }

  const handleClearAll = async () => {
    // Instantly remove from active frontend view while preserving DB record
    setItems([])
    try {
      await clearAllNotifications()
    } catch (err) {
      console.warn('Could not clear all notifications:', err)
    }
  }

  const list = items.filter((n) => {
    if (cat === 'All') return true
    return getCanonicalCategory(n) === cat
  })
  const unreadCount = items.filter((n) => !n.is_read).length

  return (
    <div className="relative min-h-screen bg-void pb-28 pt-32">
      <Container className="max-w-5xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Hud className="text-cyan font-bold tracking-wider">
              {unreadCount > 0 ? `${unreadCount} unread ${unreadCount === 1 ? 'notification' : 'notifications'}` : '0 unread notifications'}
            </Hud>
            <h1 className="reveal mt-3 font-display text-[clamp(3rem,9vw,7rem)] font-black uppercase leading-[0.85]">
              Notifications
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-4 self-start md:self-auto">
            <button
              disabled={!unreadCount}
              onClick={handleMarkAll}
              className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan hover:text-ink disabled:text-dim transition-colors"
            >
              Mark all read
            </button>
            <span className="text-white/20">·</span>
            <button
              disabled={items.length === 0}
              onClick={handleClearAll}
              className="font-mono text-[11px] uppercase tracking-[0.2em] text-dim hover:text-warn disabled:text-dim/40 transition-colors"
              title="Clear all notifications from view (stored safely in backend)"
            >
              Clear all
            </button>
          </div>
        </div>

        <div className="mt-10">
          <Chips items={C} value={cat} onChange={setCat} />
        </div>

        <div className="mt-8">
          {isLoading ? (
            <div className="p-16 text-center border border-white/10 bg-surface/50">
              <div className="inline-block size-6 animate-spin rounded-full border-2 border-cyan border-t-transparent mb-3" />
              <Hud className="text-cyan">Querying notification dispatch...</Hud>
            </div>
          ) : list.length === 0 ? (
            <EmptyState
              code="0"
              title="All quiet"
              body={
                cat === 'Batches'
                  ? 'No batch notifications found.'
                  : cat === 'All'
                  ? 'You have no notifications right now.'
                  : `No notifications in ${cat.toLowerCase()} category.`
              }
              cta="Browse Tournaments"
              to="/tournaments"
            />
          ) : (
            <div className="divide-y divide-white/5 border border-white/10">
              {list.map((n) => {
                const cardCat = getCanonicalCategory(n)
                const glyph = GLYPH[cardCat] || '◇'
                const rawTitle = n.title || ''
                const isGenericResponse = rawTitle.trim().toLowerCase() === 'response'
                const displayTitle = isGenericResponse ? 'Admin Response' : rawTitle
                const displayLabel = n.label || (isGenericResponse ? 'Admin Response' : undefined)
                return (
                  <NotificationCard
                    key={n.id}
                    glyph={glyph}
                    title={displayTitle}
                    body={n.message}
                    label={displayLabel}
                    meta={`${cardCat.toUpperCase()} · ${new Date(n.created_at).toLocaleDateString(
                      'en-IN',
                      { day: '2-digit', month: 'short' }
                    )}`}
                    unread={!n.is_read}
                    onClick={() => handleMarkOne(n.id)}
                    onClear={() => handleClearOne(n.id)}
                  />
                )
              })}
            </div>
          )}
        </div>
      </Container>
    </div>
  )
}
