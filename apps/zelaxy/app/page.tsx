import { ThemeProvider } from '@/app/(landing)/components/theme-provider'
import Landing from '@/app/(landing)/landing'

export default function Page() {
  return (
    <ThemeProvider defaultTheme='dark' storageKey='zelaxy-theme'>
      <Landing />
    </ThemeProvider>
  )
}
