export interface AppearanceConfig {
  theme: 'Dark' | 'Midnight' | 'OLED' | 'Crimson'
  accent: 'Cyan' | 'Flame' | 'Emerald' | 'Violet' | 'Crimson' | 'Gold'
}

export const THEME_PALETTES: Record<string, { void: string; graphite: string; surface: string }> = {
  Dark: {
    void: '#05060a',
    graphite: '#0c0e15',
    surface: '#12141d',
  },
  Midnight: {
    void: '#070a1a',
    graphite: '#0c1228',
    surface: '#111a38',
  },
  OLED: {
    void: '#000000',
    graphite: '#080808',
    surface: '#101010',
  },
  Crimson: {
    void: '#0e0407',
    graphite: '#18060c',
    surface: '#220912',
  },
}

export const ACCENT_PALETTES: Record<string, { hex: string; name: string }> = {
  Cyan: { hex: '#3ef2ff', name: 'Cyan (Default)' },
  Flame: { hex: '#ff7a1a', name: 'Flame Orange' },
  Emerald: { hex: '#3dff9a', name: 'Emerald Lime' },
  Violet: { hex: '#8b5cff', name: 'Ultraviolet' },
  Crimson: { hex: '#ff3b4e', name: 'Crimson Red' },
  Gold: { hex: '#ffc23d', name: 'Solar Gold' },
}

const STORAGE_KEY = 'ametheus_appearance'

export function getSavedAppearance(): AppearanceConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        theme: parsed.theme && THEME_PALETTES[parsed.theme] ? parsed.theme : 'Dark',
        accent: parsed.accent && ACCENT_PALETTES[parsed.accent] ? parsed.accent : 'Cyan',
      }
    }
  } catch {}
  return { theme: 'Dark', accent: 'Cyan' }
}

export function applyAppearance(theme: string, accent: string) {
  const root = document.documentElement
  const themeColors = THEME_PALETTES[theme] || THEME_PALETTES['Dark']
  const accentData = ACCENT_PALETTES[accent] || ACCENT_PALETTES['Cyan']

  // Apply theme background tokens
  root.style.setProperty('--color-void', themeColors.void)
  root.style.setProperty('--color-graphite', themeColors.graphite)
  root.style.setProperty('--color-surface', themeColors.surface)

  // Apply accent tokens
  root.style.setProperty('--color-cyan', accentData.hex)
  root.style.setProperty('--acc', accentData.hex)

  // Document background
  root.style.backgroundColor = themeColors.void

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme, accent }))
  } catch {}
}

export function initAppearance() {
  const config = getSavedAppearance()
  applyAppearance(config.theme, config.accent)
}
