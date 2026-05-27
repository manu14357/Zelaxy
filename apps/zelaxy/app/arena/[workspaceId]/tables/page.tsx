import type { Metadata } from 'next'
import { Tables } from './tables'

export const metadata: Metadata = {
  title: 'Tables',
}

export default function TablesPage() {
  return <Tables />
}
