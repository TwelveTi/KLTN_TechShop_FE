import { Badge } from '@shared/ui/Badge'
import { Icon, type IconName } from '@shared/ui/Icon'

interface PlannedModule {
  id: string
  title: string
  description: string
  icon: IconName
  badge: string
  estimatedTimeline: string
}

const PLANNED_MODULES: PlannedModule[] = [
  {
    id: 'vnpay-recon',
    title: 'VNPay & Gateway Reconciliation',
    description: 'Automated batch settlement matching, refund dispute handling, and transaction fee breakdown for financial accounting.',
    icon: 'credit-card',
    badge: 'Finance',
    estimatedTimeline: 'Phase 2',
  },
  {
    id: 'ai-assistant',
    title: 'AI Assistant Conversation Logs',
    description: 'Monitor live Gemini customer conversations, intent satisfaction rates, fallback routing, and shopping assistant prompts.',
    icon: 'sparkles',
    badge: 'AI & ML',
    estimatedTimeline: 'Phase 2',
  },
  {
    id: 'recommendations',
    title: 'Recommendation Engine Rules',
    description: 'Manage collaborative filtering weights, cross-sell campaigns, frequently bought together rules, and curated hardware sets.',
    icon: 'sliders-horizontal',
    badge: 'Growth',
    estimatedTimeline: 'Phase 2',
  },
  {
    id: 'reviews',
    title: 'Reviews & Customer Feedback Moderation',
    description: 'Queue for moderating verified purchase ratings, spam filtering, flagged media attachments, and official staff replies.',
    icon: 'star',
    badge: 'Community',
    estimatedTimeline: 'Phase 3',
  },
  {
    id: 'discounts',
    title: 'Promotions, Vouchers & Scheduled Flash Sales',
    description: 'Rule-based coupon creation (percentage, fixed amount, free shipping, minimum order spend), usage caps, and scheduling.',
    icon: 'tag',
    badge: 'Marketing',
    estimatedTimeline: 'Phase 3',
  },
  {
    id: 'activity-audit',
    title: 'Audit Logs & Staff Permissions (RBAC)',
    description: 'Detailed administrator action trails, role permissions matrix, sensitive change tracking, and login session auditing.',
    icon: 'shield-check',
    badge: 'Security',
    estimatedTimeline: 'Phase 3',
  },
]

export function PlannedSection() {
  return (
    <div className="ts-admin-section">
      <div className="ts-admin-planned-hero">
        <div className="ts-admin-planned-hero__icon">
          <Icon name="layers" size={24} />
        </div>
        <div>
          <h2 className="ts-admin-planned-hero__title">Roadmap & Planned Modules</h2>
          <p className="ts-admin-planned-hero__subtitle">
            These architecture modules are pre-structured into the TechShop design system. API integration points and specialized UI controllers will become active as backend endpoints land.
          </p>
        </div>
      </div>

      <div className="ts-admin-planned-grid">
        {PLANNED_MODULES.map((mod) => (
          <div key={mod.id} className="ts-admin-planned-card">
            <div className="ts-admin-planned-card__header">
              <div className="ts-admin-planned-card__icon-wrap">
                <Icon name={mod.icon} size={20} />
              </div>
              <div className="ts-admin-planned-card__badges">
                <Badge variant="neutral">{mod.badge}</Badge>
                <Badge variant="info">{mod.estimatedTimeline}</Badge>
              </div>
            </div>

            <h3 className="ts-admin-planned-card__title">{mod.title}</h3>
            <p className="ts-admin-planned-card__desc">{mod.description}</p>

            <div className="ts-admin-planned-card__footer">
              <span className="ts-admin-status-indicator">
                <span className="ts-admin-pulse-dot" />
                <span>Backend Route Reserved</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
