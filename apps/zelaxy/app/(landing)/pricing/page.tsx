import { ThemeProvider } from '@/app/(landing)/components/theme-provider'
import Pricing from '@/app/(landing)/pricing/pricing'

export default function Page() {
  return (
    <ThemeProvider defaultTheme='light' storageKey='zelaxy-theme'>
      <Pricing />
    </ThemeProvider>
  )
}
