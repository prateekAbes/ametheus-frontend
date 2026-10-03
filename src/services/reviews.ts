import { apiClient } from './apiClient'

export interface ReviewItem {
  id: string
  user_id: string
  user_name: string
  avatar_url?: string
  rating: number
  review_text: string
  category: string
  status: 'APPROVED' | 'FEATURED' | 'PENDING' | 'HIDDEN'
  is_verified: boolean
  is_featured: boolean
  admin_notes?: string
  created_at?: string
}

export interface ReviewSummaryResponse {
  average_rating: number
  total_reviews: number
  rating_distribution: Record<string, number>
  reviews: ReviewItem[]
  featured_review?: ReviewItem | null
}

export interface ReviewCreatePayload {
  rating: number
  review_text: string
  category?: string
  user_name?: string
  avatar_url?: string
}

export interface ReviewStatusUpdatePayload {
  status: 'APPROVED' | 'FEATURED' | 'PENDING' | 'HIDDEN'
  admin_notes?: string
}

export async function getReviews(category?: string): Promise<ReviewSummaryResponse> {
  const q = category && category !== 'ALL' ? `?category=${encodeURIComponent(category)}` : ''
  return apiClient<ReviewSummaryResponse>(`/reviews${q}`)
}

export async function submitReview(payload: ReviewCreatePayload): Promise<ReviewItem> {
  return apiClient<ReviewItem>('/reviews', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getAdminReviews(params?: {
  status_filter?: string
  search?: string
}): Promise<ReviewItem[]> {
  const searchParams = new URLSearchParams()
  if (params?.status_filter && params.status_filter !== 'ALL') {
    searchParams.set('status_filter', params.status_filter)
  }
  if (params?.search) {
    searchParams.set('search', params.search)
  }
  const q = searchParams.toString() ? `?${searchParams.toString()}` : ''
  return apiClient<ReviewItem[]>(`/admin/reviews${q}`)
}

export async function moderateReview(
  id: string,
  payload: ReviewStatusUpdatePayload
): Promise<ReviewItem> {
  return apiClient<ReviewItem>(`/admin/reviews/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteReview(id: string): Promise<{ status: string; message: string }> {
  return apiClient<{ status: string; message: string }>(`/admin/reviews/${id}`, {
    method: 'DELETE',
  })
}
