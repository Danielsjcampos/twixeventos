import { Suspense } from 'react'
import { ReservationDrawer } from '@/components/public/ReservationDrawer'
import { SmoothScroll } from '@/components/providers/SmoothScroll'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <SmoothScroll>
      <Suspense>
        {children}
        <ReservationDrawer />
      </Suspense>
    </SmoothScroll>
  )
}
