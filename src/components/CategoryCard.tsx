import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { GameCategory } from '../lib/categories'
import { img } from '../lib/data'
import { Hud, Dot } from './ui'

export default function CategoryCard({
  category,
  index = 0,
}: {
  category: GameCategory
  index?: number
}) {
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  // 5-second automatic rotation cycling through category images
  useEffect(() => {
    if (category.images.length <= 1) return
    const interval = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % category.images.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [category.images.length])

  const activeImage = category.images[activeImageIndex] || category.images[0]

  return (
    <Link
      to={`/games/category/${category.slug}`}
      className="group relative flex min-h-[260px] sm:min-h-0 sm:aspect-[16/9] w-full flex-col justify-between overflow-hidden border border-white/10 bg-surface p-5 transition-all duration-500 hover:border-cyan/50 hover:shadow-[0_0_30px_rgba(62,242,255,0.15)] md:p-6"
    >
      {/* Rotating Background Image with smooth transition */}
      <div className="absolute inset-0 overflow-hidden bg-void">
        {category.images.map((imgSrc, idx) => (
          <img
            key={`${imgSrc}-${idx}`}
            src={img(imgSrc, 1200)}
            alt={`${category.name} preview`}
            loading={index < 2 ? 'eager' : 'lazy'}
            decoding="async"
            className={`absolute inset-0 size-full object-cover object-center transition-all duration-1000 ease-in-out group-hover:scale-105 ${
              idx === activeImageIndex
                ? 'opacity-60 brightness-90'
                : 'opacity-0 pointer-events-none'
            }`}
          />
        ))}

        {/* Dynamic Gradient Scrims */}
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{
            background: `radial-gradient(circle at 80% 20%, ${category.accent}26, transparent 65%), linear-gradient(to top, #05060a 20%, rgba(5,6,10,0.4) 60%, transparent 100%)`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-void/80 via-transparent to-transparent" />
      </div>

      {/* Top Header info */}
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-dim">0{index + 1}</span>
          <span className="border border-white/20 bg-void/80 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-cyan backdrop-blur-sm">
            {category.games.length} {category.games.length === 1 ? 'Title' : 'Titles'}
          </span>
        </div>

        {/* 5-second image rotation progress indicators */}
        {category.images.length > 1 && (
          <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-void/60 px-2 py-1 backdrop-blur-sm">
            {category.images.map((_, i) => (
              <span
                key={i}
                className={`size-1.5 rounded-full transition-all duration-500 ${
                  i === activeImageIndex ? 'w-3.5 bg-cyan' : 'bg-white/25'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom Content info */}
      <div className="relative z-10">
        <Hud className="text-cyan/90 block">Category</Hud>
        <h3 className="mt-1 font-display text-2xl font-black uppercase text-ink transition-transform duration-300 group-hover:translate-x-1 md:text-3xl">
          {category.name}
        </h3>
        <p className="mt-1.5 line-clamp-1 font-sans text-xs text-dim">
          {category.description || category.games.map((g) => g.name).join(' · ')}
        </p>

        <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2.5">
          <span className="font-mono text-[11px] text-ink/75">
            {category.games.slice(0, 3).map((g) => g.name).join(' · ')}
            {category.games.length > 3 && ` +${category.games.length - 3}`}
          </span>
          <span className="inline-flex items-center gap-1 font-display text-xs font-bold uppercase tracking-wider text-cyan transition-transform group-hover:translate-x-1">
            Browse <span>→</span>
          </span>
        </div>
      </div>
    </Link>
  )
}
