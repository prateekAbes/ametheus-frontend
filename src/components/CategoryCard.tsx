import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { GameCategory } from '../lib/categories'
import { type Genre } from '../services/genres'
import { img } from '../lib/data'
import { Hud } from './ui'

export interface CategoryCardProps {
  category?: GameCategory
  genre?: Genre
  index?: number
  onSelectGenre?: (slug: string) => void
}

export default function CategoryCard({
  category,
  genre,
  index = 0,
  onSelectGenre,
}: CategoryCardProps) {
  // Extract normalized attributes whether from backend Genre or local GameCategory
  const name = genre?.name || category?.name || 'Genre'
  const slug = genre?.slug || category?.slug || 'genre'
  const description = genre?.description || category?.description || ''
  const accent = category?.accent || '#3ef2ff'

  // Extract all images and logos from genre's games or category
  const rawImages = genre?.games && genre.games.length > 0
    ? genre.games.map((g) => g.banner_url || g.thumbnail_url).filter(Boolean) as string[]
    : category?.images || []

  const images = rawImages.length > 0
    ? rawImages
    : [genre?.banner_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200']

  const logos = genre?.games
    ? genre.games.map((g) => ({ title: g.title, logo: g.logo_url })).filter((g) => Boolean(g.logo))
    : []

  const gameTitles = genre?.games
    ? genre.games.map((g) => g.title)
    : category?.games.map((g) => g.name) || []

  const rotationInterval = Math.max(2, (genre?.rotation_interval_seconds || 4)) * 1000

  const [activeImageIndex, setActiveImageIndex] = useState(0)

  // Automatic rotation cycling through genre games & artwork
  useEffect(() => {
    if (images.length <= 1 && logos.length <= 1) return
    const count = Math.max(images.length, logos.length)
    const interval = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % count)
    }, rotationInterval)
    return () => clearInterval(interval)
  }, [images.length, logos.length, rotationInterval])

  const activeImage = images[activeImageIndex % images.length] || images[0]
  const currentLogo = logos.length > 0 ? logos[activeImageIndex % logos.length] : null

  const content = (
    <>
      {/* Rotating Background Image with smooth transition */}
      <div className="absolute inset-0 overflow-hidden bg-void">
        {images.map((imgSrc, idx) => (
          <img
            key={`${imgSrc}-${idx}`}
            src={img(imgSrc, 1200)}
            alt={`${name} preview`}
            loading={index < 2 ? 'eager' : 'lazy'}
            decoding="async"
            className={`absolute inset-0 size-full object-cover object-center transition-all duration-1000 ease-in-out group-hover:scale-105 ${
              idx === (activeImageIndex % images.length)
                ? 'opacity-60 brightness-90'
                : 'opacity-0 pointer-events-none'
            }`}
          />
        ))}

        {/* Dynamic Gradient Scrims */}
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{
            background: `radial-gradient(circle at 80% 20%, ${accent}26, transparent 65%), linear-gradient(to top, #05060a 20%, rgba(5,6,10,0.4) 60%, transparent 100%)`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-void/80 via-transparent to-transparent" />
      </div>

      {/* Top Header info */}
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-dim">0{index + 1}</span>
          <span className="border border-white/20 bg-void/80 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-cyan backdrop-blur-sm">
            {gameTitles.length} {gameTitles.length === 1 ? 'Title' : 'Titles'}
          </span>
        </div>

        {/* Rotating Game Logo Badge if available */}
        {currentLogo?.logo && (
          <div className="flex items-center gap-2 rounded bg-void/80 px-2 py-1 border border-white/15 backdrop-blur-sm transition-all duration-500">
            <img
              src={currentLogo.logo}
              alt={currentLogo.title}
              className="size-4 object-contain"
            />
            <span className="font-mono text-[10px] text-white/90 truncate max-w-[100px]">
              {currentLogo.title}
            </span>
          </div>
        )}

        {/* Rotation progress dots */}
        {images.length > 1 && !currentLogo && (
          <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-void/60 px-2 py-1 backdrop-blur-sm">
            {images.map((_, i) => (
              <span
                key={i}
                className={`size-1.5 rounded-full transition-all duration-500 ${
                  i === (activeImageIndex % images.length) ? 'w-3.5 bg-cyan' : 'bg-white/25'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom Content info */}
      <div className="relative z-10">
        <Hud className="text-cyan/90 block">Genre</Hud>
        <h3 className="mt-1 font-display text-2xl font-black uppercase text-ink transition-transform duration-300 group-hover:translate-x-1 md:text-3xl">
          {name}
        </h3>
        <p className="mt-1.5 line-clamp-1 font-sans text-xs text-dim">
          {description || gameTitles.join(' · ')}
        </p>

        <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2.5">
          <span className="font-mono text-[11px] text-ink/75 truncate max-w-[70%]">
            {gameTitles.slice(0, 3).join(' · ')}
            {gameTitles.length > 3 && ` +${gameTitles.length - 3}`}
          </span>
          <span className="inline-flex items-center gap-1 font-display text-xs font-bold uppercase tracking-wider text-cyan transition-transform group-hover:translate-x-1 shrink-0">
            Explore <span>→</span>
          </span>
        </div>
      </div>
    </>
  )

  if (onSelectGenre) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelectGenre(slug)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onSelectGenre(slug)
          }
        }}
        className="group relative flex min-h-[260px] sm:min-h-0 sm:aspect-[16/9] w-full flex-col justify-between overflow-hidden border border-white/10 bg-surface p-5 transition-all duration-500 hover:border-cyan/50 hover:shadow-[0_0_30px_rgba(62,242,255,0.15)] md:p-6 cursor-pointer text-left"
      >
        {content}
      </div>
    )
  }

  return (
    <Link
      to={`/games/category/${slug}`}
      className="group relative flex min-h-[260px] sm:min-h-0 sm:aspect-[16/9] w-full flex-col justify-between overflow-hidden border border-white/10 bg-surface p-5 transition-all duration-500 hover:border-cyan/50 hover:shadow-[0_0_30px_rgba(62,242,255,0.15)] md:p-6"
    >
      {content}
    </Link>
  )
}
