import { useState, useEffect } from 'react'
import { Container, Hud, Chips, EmptyState } from '../components/ui'
import { NotificationCard } from '../components/kit'
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type NotificationItem,
} from '../services/notifications'
import { useAuthContext } from '../context/AuthContext'

const C = ['All', 'Tournament', 'Match', 'Registration', 'Wallet', 'Team', 'System'] as const
type Cat = Exclude<(typeof C)[number], 'All'>
const GLYPH: Record<Cat, string> = {
  Tournament: '♛',
  Match: '⚔',
  Registration: '✎',
  Wallet: '₹',
  Team: '⬡',
  System: '◇',
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

  const list = items.filter((n) => {
    if (cat === 'All') return true
    const t = (n.type || '').toUpperCase()
    return t.includes(cat.toUpperCase())
  })
  const unreadCount = items.filter((n) => !n.is_read).length

  return (
    <div className="relative min-h-screen bg-void pb-28 pt-32">
      <Container className="max-w-5xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Hud className="text-cyan">◇ {unreadCount} unread</Hud>
            <h1 className="reveal mt-3 font-display text-[clamp(3rem,9vw,7rem)] font-black uppercase leading-[0.85]">
              Notifications
            </h1>
          </div>
          <button
            disabled={!unreadCount}
            onClick={handleMarkAll}
            className="self-start font-mono text-[11px] uppercase tracking-[0.2em] text-cyan hover:text-ink disabled:text-dim md:self-auto"
          >
            Mark all read
          </button>
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
              body="No notifications in this category."
              cta="Browse Tournaments"
              to="/tournaments"
            />
          ) : (
            <div className="divide-y divide-white/5 border border-white/10">
              {list.map((n) => {
                const glyph = GLYPH[n.type as Cat] || '◇'
                return (
                  <NotificationCard
                    key={n.id}
                    glyph={glyph}
                    title={n.title}
                    body={n.message}
                    meta={`${n.type || 'SYSTEM'} · ${new Date(n.created_at).toLocaleDateString(
                      'en-IN',
                      { day: '2-digit', month: 'short' }
                    )}`}
                    unread={!n.is_read}
                    onClick={() => handleMarkOne(n.id)}
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
