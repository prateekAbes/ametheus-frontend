import { useState, useEffect, useMemo } from 'react'
import {
  getReviews,
  submitReview,
  ReviewItem,
  ReviewSummaryResponse,
} from '../services/reviews'
import { useAuthContext } from '../context/AuthContext'
import { Container, Hud, Badge, SectionHead, Brackets, Panel, Modal } from '../components/ui'
import DynamicImage from '../components/DynamicImage'
import { resolveMediaUrl } from '../services/apiClient'

const REVIEW_CATEGORIES = [
  'ALL',
  'TOURNAMENTS',
  'MATCHMAKING',
  'PLATFORM',
  'COMMUNITY',
  'PAYOUTS',
] as const

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const stars = [1, 2, 3, 4, 5]
  const sizeClass = size === 'lg' ? 'size-6' : size === 'md' ? 'size-5' : 'size-4'

  return (
    <div className="flex items-center gap-1">
      {stars.map((s) => (
        <span
          key={s}
          className={`${sizeClass} inline-flex items-center justify-center font-bold select-none ${
            s <= Math.round(rating) ? 'text-warn' : 'text-white/20'
          }`}
        >
          ★
        </span>
      ))}
    </div>
  )
}

export default function Reviews() {
  const { profile, displayName: authDisplayName, isSignedIn } = useAuthContext()

  const [summary, setSummary] = useState<ReviewSummaryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')

  // Write Review Modal
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false)
  const [rating, setRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [category, setCategory] = useState('TOURNAMENTS')
  const [displayName, setDisplayName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const fetchReviews = async (cat?: string) => {
    setLoading(true)
    try {
      const data = await getReviews(cat)
      setSummary(data)
    } catch (err) {
      console.warn('Failed to fetch reviews:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews(selectedCategory)
  }, [selectedCategory])

  const reviewsList = summary?.reviews || []
  const featured = summary?.featured_review || reviewsList.find((r) => r.is_featured) || reviewsList[0]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    if (reviewText.trim().length < 10) {
      alert('Review must be at least 10 characters long.')
      return
    }

    setSubmitting(true)
    try {
      await submitReview({
        rating,
        review_text: reviewText.trim(),
        category,
        user_name: displayName.trim() || profile?.username || profile?.display_name || authDisplayName || 'Player',
      })
      setFeedbackMsg({
        type: 'ok',
        text: 'Thank you for your feedback! Your review has been submitted and published.',
      })
      setIsWriteModalOpen(false)
      setReviewText('')
      setRating(5)
      fetchReviews(selectedCategory)
      setTimeout(() => setFeedbackMsg(null), 6000)
    } catch (err: any) {
      alert(err?.message || 'Failed to submit review.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="py-24 font-mono text-xs text-ink min-h-screen">
      <Container>
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
          <div>
            <Hud className="text-cyan">COMMUNITY REPUTATION &amp; BENCHMARKS</Hud>
            <h1 className="mt-2 font-display text-4xl sm:text-6xl font-black uppercase tracking-tight text-ink">
              Contender <span className="text-cyan">Reviews</span>
            </h1>
            <p className="mt-2 text-sm text-dim max-w-2xl font-sans">
              Authentic feedback from verified players, team captains, and tournament contenders across India&apos;s competitive esports battlegrounds.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                setDisplayName(profile?.username || profile?.display_name || authDisplayName || '')
                setIsWriteModalOpen(true)
              }}
              className="border border-cyan bg-cyan px-5 py-2.5 font-display text-xs font-black uppercase tracking-wider text-void hover:bg-cyan/90 transition-all cursor-pointer shadow-sm"
            >
              ★ Write a Review
            </button>
            <button
              onClick={() => fetchReviews(selectedCategory)}
              disabled={loading}
              className="border border-white/20 bg-surface px-3 py-2.5 uppercase text-dim hover:text-ink cursor-pointer"
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {feedbackMsg && (
          <div
            className={`mt-6 p-4 border text-xs font-bold ${
              feedbackMsg.type === 'ok'
                ? 'border-ok/40 bg-ok/10 text-ok'
                : 'border-live/40 bg-live/10 text-live'
            }`}
          >
            {feedbackMsg.text}
          </div>
        )}

        {/* Rating Metrics & Star Breakdown */}
        {summary && summary.total_reviews > 0 && (
          <div className="mt-10 grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left: Overall Score Card */}
            <Panel className="md:col-span-4 p-6 sm:p-8 flex flex-col justify-center items-center text-center bg-surface/40 border-white/15">
              <Hud className="text-dim">Overall Platform Rating</Hud>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-display text-6xl sm:text-7xl font-black text-ink">
                  {summary.average_rating.toFixed(1)}
                </span>
                <span className="font-display text-2xl font-bold text-dim">/ 5.0</span>
              </div>
              <div className="mt-3">
                <StarRating rating={summary.average_rating} size="lg" />
              </div>
              <p className="mt-3 text-xs text-dim">
                Ground truth based on <strong>{summary.total_reviews} verified</strong> tournament contender experiences.
              </p>
            </Panel>

            {/* Right: Star Distribution Bars */}
            <Panel className="md:col-span-8 p-6 sm:p-8 bg-surface/40 border-white/15 space-y-3 justify-center flex flex-col">
              <Hud className="text-cyan">Rating Distribution</Hud>
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = summary.rating_distribution?.[String(stars)] || 0
                const percent = summary.total_reviews > 0 ? (count / summary.total_reviews) * 100 : 0

                return (
                  <div key={stars} className="flex items-center gap-3 text-xs">
                    <span className="w-16 font-mono text-dim flex items-center gap-1 shrink-0">
                      <span>{stars}</span>
                      <span className="text-warn">★</span>
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-cyan rounded-full transition-all duration-700"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="w-12 text-right font-mono text-dim shrink-0">{count}</span>
                  </div>
                )
              })}
            </Panel>
          </div>
        )}

        {/* Global Empty State Banner when no reviews exist */}
        {summary && summary.total_reviews === 0 && !loading && (
          <div className="mt-10 p-12 border border-dashed border-white/20 bg-surface/30 text-center flex flex-col items-center justify-center space-y-4">
            <span className="text-3xl text-dim">★</span>
            <h3 className="font-display text-xl font-bold uppercase text-ink">
              No reviews yet. Be the first to share your experience.
            </h3>
            <p className="text-xs text-dim max-w-md">
              Share your feedback on tournaments, matchmaking, and gameplay to help fellow contenders.
            </p>
            <button
              onClick={() => {
                setDisplayName(profile?.username || profile?.display_name || authDisplayName || '')
                setIsWriteModalOpen(true)
              }}
              className="mt-2 border border-cyan bg-cyan px-5 py-2.5 font-display text-xs font-black uppercase tracking-wider text-void hover:bg-cyan/90 transition-all cursor-pointer"
            >
              ★ Write the First Review
            </button>
          </div>
        )}

        {/* Featured Spotlight Review */}
        {featured && (
          <div className="mt-12">
            <Panel className="p-6 md:p-8 border-cyan/40 bg-void/90 relative overflow-hidden">
              <Brackets color="border-cyan/40" />
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <span className="border border-magenta bg-magenta/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-magenta">
                    ★ Spotlight Contender Review
                  </span>
                  <span className="border border-white/15 px-2 py-0.5 text-[10px] text-dim uppercase">
                    {featured.category}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <StarRating rating={featured.rating} size="md" />
                  <span className="text-xs text-warn font-bold font-mono">{featured.rating}.0 / 5.0</span>
                </div>
              </div>

              <blockquote className="mt-5 text-base sm:text-lg font-sans text-ink leading-relaxed italic">
                &ldquo;{featured.review_text}&rdquo;
              </blockquote>

              <div className="mt-6 flex items-center justify-between gap-4 pt-4 border-t border-white/10">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-full bg-surface border border-white/20 flex items-center justify-center font-display font-black text-cyan uppercase overflow-hidden">
                    {featured.avatar_url ? (
                      <DynamicImage src={resolveMediaUrl(featured.avatar_url)} alt={featured.user_name} className="size-full object-cover" />
                    ) : (
                      featured.user_name.charAt(0)
                    )}
                  </div>
                  <div>
                    <div className="font-display text-sm font-black uppercase text-ink flex items-center gap-2">
                      <span>{featured.user_name}</span>
                      {featured.is_verified && (
                        <span className="text-[10px] text-cyan border border-cyan/30 px-1 py-0.2">
                          ✓ Verified Athlete
                        </span>
                      )}
                    </div>
                    {featured.created_at && (
                      <span className="text-[10px] text-dim">
                        {new Date(featured.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Panel>
          </div>
        )}

        {/* Category Tabs */}
        <div className="mt-14 flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
          <span className="text-dim uppercase font-bold mr-2 text-[11px]">Filter Category:</span>
          {REVIEW_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'border border-cyan bg-cyan text-void font-bold'
                  : 'border border-white/10 bg-surface text-dim hover:text-ink'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* All Reviews Grid */}
        <div className="mt-8">
          {loading ? (
            <div className="p-12 text-center text-dim font-mono">Loading reviews...</div>
          ) : reviewsList.length === 0 ? (
            <div className="p-12 border border-dashed border-white/15 text-center text-dim space-y-3">
              <p className="text-sm font-semibold text-ink/80">No reviews yet. Be the first to share your experience.</p>
              <button
                onClick={() => {
                  setDisplayName(profile?.username || profile?.display_name || authDisplayName || '')
                  setIsWriteModalOpen(true)
                }}
                className="mt-2 text-cyan underline hover:text-cyan/80 text-xs font-mono"
              >
                Write a Review →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {reviewsList.map((rev) => (
                <Panel key={rev.id} className="p-5 flex flex-col justify-between space-y-4 border-white/10 bg-surface/40 hover:border-cyan/40 transition-colors">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <StarRating rating={rev.rating} size="sm" />
                      <span className="text-[10px] font-mono border border-white/15 px-1.5 py-0.5 text-dim uppercase">
                        {rev.category}
                      </span>
                    </div>
                    <p className="font-sans text-xs text-ink/90 leading-relaxed italic line-clamp-4">
                      &ldquo;{rev.review_text}&rdquo;
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="size-6 rounded-full bg-void border border-white/20 flex items-center justify-center font-black text-cyan text-[10px] shrink-0 overflow-hidden">
                        {rev.avatar_url ? (
                          <DynamicImage src={resolveMediaUrl(rev.avatar_url)} alt={rev.user_name} className="size-full object-cover" />
                        ) : (
                          rev.user_name.charAt(0)
                        )}
                      </div>
                      <span className="font-display font-black uppercase text-ink truncate">
                        {rev.user_name}
                      </span>
                    </div>
                    {rev.is_verified && (
                      <span className="text-[9px] text-cyan uppercase font-bold shrink-0">
                        ✓ Verified
                      </span>
                    )}
                  </div>
                </Panel>
              ))}
            </div>
          )}
        </div>
      </Container>

      {/* WRITE REVIEW MODAL */}
      <Modal
        open={isWriteModalOpen}
        onClose={() => setIsWriteModalOpen(false)}
        title="Write Platform Review"
        subtitle="Rate your experience with tournaments, matchmaking, and esports operations."
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
              {/* Star Rating Interactive Selector */}
              <div>
                <label className="block text-dim uppercase mb-1.5">Rating (1 to 5 Stars)</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className={`size-10 border text-xl flex items-center justify-center transition-all cursor-pointer ${
                        s <= rating
                          ? 'border-warn bg-warn/15 text-warn font-black'
                          : 'border-white/20 bg-surface text-dim hover:text-ink'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="ml-2 font-display text-sm font-bold text-warn">
                    {rating} out of 5 Stars
                  </span>
                </div>
              </div>

              {/* Review Category */}
              <div>
                <label className="block text-dim uppercase mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-white/20 bg-surface px-3 py-2 text-xs text-ink outline-none focus:border-cyan"
                >
                  <option value="TOURNAMENTS">Tournaments &amp; Brackets</option>
                  <option value="MATCHMAKING">Matchmaking &amp; Lobbies</option>
                  <option value="PLATFORM">Platform UI &amp; Performance</option>
                  <option value="PAYOUTS">Instant UPI Payouts</option>
                  <option value="COMMUNITY">Community &amp; Discord / WhatsApp</option>
                </select>
              </div>

              {/* Contender Name */}
              <div>
                <label className="block text-dim uppercase mb-1">Your Name / Gamer Tag</label>
                <input
                  type="text"
                  placeholder="e.g. Aman 'Shadow' or AlphaCaptain"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full border border-white/20 bg-surface px-3 py-2 text-xs text-ink outline-none focus:border-cyan"
                />
              </div>

              {/* Review Text */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-dim uppercase">Review Experience</label>
                  <span className="text-[10px] text-dim">{reviewText.length} / 500</span>
                </div>
                <textarea
                  rows={4}
                  maxLength={500}
                  required
                  placeholder="Share details about match organization, server stability, referee clarity, or platform responsiveness..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="w-full border border-white/20 bg-surface p-3 text-xs text-ink outline-none focus:border-cyan resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsWriteModalOpen(false)}
                  className="border border-white/20 px-4 py-2 uppercase text-dim hover:text-ink cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="border border-cyan bg-cyan px-5 py-2 font-display text-xs font-black uppercase tracking-wider text-void hover:bg-cyan/90 transition-all cursor-pointer"
                >
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
      </Modal>
    </div>
  )
}
