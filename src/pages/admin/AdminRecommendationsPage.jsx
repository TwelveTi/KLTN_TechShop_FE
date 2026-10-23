import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import adminApi from '../../api/adminApi'
import Alert from '../../components/ui/Alert'
import Button from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'

function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-sm bg-sunken p-4 text-center">
      <p className="tabular text-h3 text-heading">{value}</p>
      <p className="mt-0.5 text-caption text-muted">{label}</p>
      {sub && <p className="mt-1 text-caption text-muted">{sub}</p>}
    </div>
  )
}

function pct(rate) {
  if (rate == null || isNaN(rate)) return '—'
  return (rate * 100).toFixed(1) + '%'
}

export default function AdminRecommendationsPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rebuilding, setRebuilding] = useState(false)
  const [rebuildResult, setRebuildResult] = useState(null)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    setLoading(true)
    setError('')
    try {
      setStats(await adminApi.getRecommendationStats())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleRebuild() {
    if (!confirm('Rebuild the product similarity matrix? This may take a few seconds.')) return
    setRebuilding(true)
    setError('')
    setRebuildResult(null)
    try {
      const result = await adminApi.rebuildSimilarity()
      setRebuildResult(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setRebuilding(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 rounded-md" />
        <Skeleton className="h-64 rounded-md" />
      </div>
    )
  }

  if (error && !stats) {
    return (
      <Alert title="Could not load recommendation stats" onRetry={loadStats}>
        {error}
      </Alert>
    )
  }

  const types = stats?.byType || {}
  const typeEntries = Object.entries(types)

  return (
    <div className="space-y-6">
      {error && <Alert>{error}</Alert>}

      <section className="rounded-md border border-line bg-surface p-6 shadow-sm">
        <h2 className="text-h4">Overall performance</h2>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Shown" value={stats?.shown || 0} />
          <StatCard label="Clicked" value={stats?.clicked || 0} />
          <StatCard label="Added to cart" value={stats?.addedToCart || 0} />
          <StatCard label="Purchased" value={stats?.purchased || 0} />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <StatCard label="Click-through rate" value={pct(stats?.clickThroughRate)} />
          <StatCard label="Cart rate" value={pct(stats?.cartRate)} />
          <StatCard label="Conversion rate" value={pct(stats?.conversionRate)} />
        </div>
      </section>

      {typeEntries.length > 0 && (
        <section className="rounded-md border border-line bg-surface p-6 shadow-sm">
          <h2 className="text-h4">By recommendation type</h2>

          <div className="mt-5 space-y-6">
            {typeEntries.map(([type, data]) => (
              <div key={type}>
                <h3 className="text-sm font-semibold text-heading">{type.replace(/_/g, ' ')}</h3>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <StatCard label="Shown" value={data.shown || 0} />
                  <StatCard label="CTR" value={pct(data.clickThroughRate)} />
                  <StatCard label="Cart rate" value={pct(data.cartRate)} />
                  <StatCard label="Conversion" value={pct(data.conversionRate)} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-md border border-line bg-surface p-6 shadow-sm">
        <h2 className="text-h4">Similarity matrix</h2>
        <p className="mt-2 text-sm text-muted">
          Rebuild the product similarity matrix after changing product data or adding new products.
        </p>

        <div className="mt-4 flex items-center gap-4">
          <Button
            variant="secondary"
            leadingIcon={RefreshCw}
            isLoading={rebuilding}
            onClick={handleRebuild}
          >
            Rebuild now
          </Button>

          {rebuildResult && (
            <p className="text-sm text-muted">
              {rebuildResult.products} products, {rebuildResult.pairs} similarity pairs stored.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
