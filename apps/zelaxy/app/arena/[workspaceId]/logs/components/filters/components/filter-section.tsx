export default function FilterSection({
  title,
  content,
}: {
  title: string
  content?: React.ReactNode
}) {
  return (
    <div className='mb-2 space-y-1'>
      <div className='font-medium text-[11px] text-muted-foreground/60 uppercase tracking-wider'>
        {title}
      </div>
      <div>
        {content || (
          <div className='text-muted-foreground text-sm'>
            Filter options for {title} will go here
          </div>
        )}
      </div>
    </div>
  )
}
