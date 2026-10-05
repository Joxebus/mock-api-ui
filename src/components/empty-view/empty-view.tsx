interface EmptyViewProps {
  message?: string
}

export function EmptyView({ message = 'Nothing to show yet.' }: EmptyViewProps) {
  return (
    <div className="text-center text-secondary py-5">
      <p className="mb-0">{message}</p>
    </div>
  )
}
