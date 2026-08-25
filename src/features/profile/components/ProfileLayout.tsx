import { Link, Outlet, useLocation, useNavigate } from '@core/router'
import { paths } from '@routes/paths'
import { Avatar } from '@shared/ui/Avatar'
import { Badge } from '@shared/ui/Badge'
import { Breadcrumb } from '@shared/ui/Breadcrumb'
import { Button } from '@shared/ui/Button'
import { Icon, type IconName } from '@shared/ui/Icon'
import { useAuth } from '@features/auth'
import '../styles/profile.css'

export type ProfileTab = 'profile' | 'orders' | 'addresses' | 'notifications' | 'security'

interface TabMeta {
  to: string
  label: string
  icon: IconName
  description: string
}

const TABS: Record<ProfileTab, TabMeta> = {
  profile: {
    to: paths.profile.root(),
    label: 'Account Profile',
    icon: 'user',
    description: 'Manage your personal details, email credentials, and profile image.',
  },
  orders: {
    to: paths.profile.orders(),
    label: 'Order History',
    icon: 'orders',
    description: 'Track real-time shipment status and review past hardware orders.',
  },
  addresses: {
    to: paths.profile.addresses(),
    label: 'Delivery Addresses',
    icon: 'map-pin',
    description: 'Manage shipping destinations and default delivery addresses.',
  },
  notifications: {
    to: paths.profile.notifications(),
    label: 'Notifications',
    icon: 'bell',
    description: 'Configure order updates, security alerts, and deal alerts.',
  },
  security: {
    to: paths.profile.security(),
    label: 'Security & Access',
    icon: 'lock',
    description: 'Manage password, multi-factor verification, and active login sessions.',
  },
}

const TAB_ORDER: ProfileTab[] = ['profile', 'orders', 'addresses', 'notifications', 'security']

/**
 * Khung khu vực tài khoản: thanh bên + tiêu đề + `<Outlet />`.
 *
 * Mỗi tab giờ là một ROUTE thật (`/profile/orders`), nên bookmark được và F5
 * không quay về tab đầu. v1 giữ tab trong `useState` rồi tự `pushState` để URL
 * trông có vẻ đúng, và tự đọc `pathname.split('/')[2]` khi Back được bấm.
 */
export function ProfileLayout() {
  const { authResult, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  if (!authResult) return null

  const activeTab = tabFromPath(location.pathname)
  const meta = TABS[activeTab]

  return (
    <div className="ts-profile-page">
      <div className="ts-profile-container">
        <div className="ts-profile-breadcrumb">
          <Breadcrumb
            items={[
              { label: <Link to={paths.home()} exact className="ts-breadcrumb__link">Home</Link> },
              {
                label: (
                  <Link to={paths.profile.root()} exact className="ts-breadcrumb__link">
                    My Account
                  </Link>
                ),
              },
              { label: activeTab === 'profile' ? 'Personal Information' : meta.label },
            ]}
          />
        </div>

        <div className="ts-profile-shell">
          <aside className="ts-profile-sidebar">
            <div className="ts-profile-summary">
              <Avatar
                src={authResult.user.avatarUrl || undefined}
                name={authResult.user.fullName}
                size="md"
              />
              <div className="ts-profile-summary__info">
                <strong className="ts-profile-summary__name">{authResult.user.fullName}</strong>
                <span className="ts-profile-summary__email">{authResult.user.email}</span>
                {authResult.user.role === 'ADMIN' && (
                  <Badge variant="accent" className="ts-profile-summary__role">
                    Admin Access
                  </Badge>
                )}
              </div>
            </div>

            <nav className="ts-profile-nav" aria-label="Account navigation">
              {TAB_ORDER.map((key) => {
                const tab = TABS[key]
                return (
                  <Link
                    key={key}
                    to={tab.to}
                    exact={key === 'profile'}
                    className="ts-profile-nav-btn"
                    activeClassName="is-active"
                  >
                    <Icon name={tab.icon} size={18} className="ts-profile-nav-icon" />
                    <span>{tab.label}</span>
                  </Link>
                )
              })}
            </nav>

            <div className="ts-profile-sidebar__footer">
              {authResult.user.role === 'ADMIN' && (
                <Link to={paths.admin.root()} className="ts-button ts-button--ghost ts-profile-admin-btn">
                  <Icon name="laptop" size={16} />
                  Admin Console
                </Link>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await signOut()
                  navigate(paths.home())
                }}
                leadingIcon={<Icon name="log-out" size={16} />}
                className="ts-profile-logout-btn"
              >
                Sign Out
              </Button>
            </div>
          </aside>

          <section className="ts-profile-panel" aria-labelledby="profile-panel-heading">
            <header className="ts-profile-panel__header">
              <h1 id="profile-panel-heading" className="ts-profile-panel__title">
                {meta.label}
              </h1>
              <p className="ts-profile-panel__subtitle">{meta.description}</p>
            </header>

            <Outlet />
          </section>
        </div>
      </div>
    </div>
  )
}

function tabFromPath(pathname: string): ProfileTab {
  const segment = pathname.split('/')[2] as ProfileTab | undefined
  return segment && segment in TABS ? segment : 'profile'
}

// `export default` chỉ dành cho module được lazy() nạp — quy ước duy nhất
// cho phép default export (ARCHITECTURE.md §9).
export default ProfileLayout
