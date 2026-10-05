interface ErrorViewProps {
  message?: string
}

export function ErrorView({ message = 'Something went wrong.' }: ErrorViewProps) {
  return (
    <div className="alert alert-danger" role="alert">
      {message}
    </div>
  )
}
