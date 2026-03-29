'use client'

import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'

const GITHUB_REPO = 'manu14357/Zelaxy'

export function GitHubStarsBanner() {
  const [stars, setStars] = useState<number | null>(null)

  useEffect(() => {
    fetch(`https://api.github.com/repos/${GITHUB_REPO}`)
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.stargazers_count === 'number') {
          setStars(data.stargazers_count)
        }
      })
      .catch(() => {})
  }, [])

  return (
    <div className='relative z-50 flex items-center justify-center bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 py-2.5 backdrop-blur-md'>
      <div className='flex items-center gap-3 text-[13px]'>
        <span className='inline-flex items-center gap-1.5 font-medium text-white/90'>
          <span className='inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-orange-400' />
          Zelaxy is open source
        </span>

        {stars !== null && (
          <span className='inline-flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-0.5 text-[12px] font-medium text-amber-300'>
            <Star className='h-3 w-3 fill-amber-400 text-amber-400' />
            {stars} {stars === 1 ? 'star' : 'stars'} on GitHub
          </span>
        )}
      </div>
    </div>
  )
}
