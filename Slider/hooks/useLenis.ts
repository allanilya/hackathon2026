import { useContext } from 'react'
import { LenisContext } from '@/components/providers/SmoothScrollProvider'
import type Lenis from 'lenis'

export function useLenis(): Lenis | null {
  return useContext(LenisContext)
}
