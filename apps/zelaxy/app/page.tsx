import Landing from '@/app/(landing)/landing'
import { ThemeProvider } from '@/app/(landing)/components/theme-provider'

export default function Page() {
  return (
    <ThemeProvider defaultTheme='light' storageKey='zelaxy-theme'>
      <Landing />
    </ThemeProvider>
  )
}
