import { LinkButton } from '../components/ui/Button'

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-28 text-center">
      <p className="font-display text-display text-faint">404</p>
      <h1 className="mt-2 text-h2">Page not found</h1>
      <p className="mt-2 text-sm text-muted">
        The link may have changed, or the product you were looking for is no longer sold.
      </p>
      <LinkButton to="/" variant="primary" className="mt-8">
        Back to home
      </LinkButton>
    </div>
  )
}
