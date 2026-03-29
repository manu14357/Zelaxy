import Link from 'next/link'

export default function NotFound() {
  return (
    <div className='flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center'>
      <p className='font-medium text-fd-muted-foreground text-sm uppercase tracking-widest'>404</p>
      <h1 className='font-semibold text-2xl tracking-tight'>Page not found</h1>
      <p className='max-w-md text-fd-muted-foreground text-sm'>
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href='/docs'
        className='mt-2 inline-flex items-center gap-1.5 rounded-lg bg-fd-primary px-4 py-2 font-medium text-fd-primary-foreground text-sm transition-colors hover:opacity-90'
      >
        Back to Docs
      </Link>
    </div>
  )
}
