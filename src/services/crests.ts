import { apiClient } from './apiClient'

export interface Crest {
  id: string
  name: string
  description?: string | null
  image_url: string
  is_active: boolean
  category?: string
  created_at?: string
  updated_at?: string
}

export interface CrestCreatePayload {
  name: string
  description?: string
  image_url: string
  is_active?: boolean
  category?: string
}

export interface CrestUpdatePayload {
  name?: string
  description?: string
  image_url?: string
  is_active?: boolean
  category?: string
}

export async function getAvailableCrests(): Promise<Crest[]> {
  return apiClient<Crest[]>('/crests')
}

export async function getAllCrestsAdmin(search?: string): Promise<Crest[]> {
  const query = search ? `?search=${encodeURIComponent(search)}` : ''
  return apiClient<Crest[]>(`/admin/crests${query}`)
}

export async function createCrestAdmin(payload: CrestCreatePayload): Promise<Crest> {
  return apiClient<Crest>('/admin/crests', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateCrestAdmin(crestId: string, payload: CrestUpdatePayload): Promise<Crest> {
  return apiClient<Crest>(`/admin/crests/${crestId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function deleteCrestAdmin(crestId: string): Promise<{ status: string; message: string }> {
  return apiClient<{ status: string; message: string }>(`/admin/crests/${crestId}`, {
    method: 'DELETE',
  })
}
