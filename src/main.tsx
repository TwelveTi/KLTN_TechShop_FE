import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@shared/styles/tokens.css'
import '@shared/styles/base.css'
import '@shared/ui/ui.css'
import '@routes/route-state.css'
import { configureHttp } from './app/bootstrap/configureHttp'
import { AppProviders } from './app/AppProviders'
import App from './app/App'

// Tiêm token + refresh vào core/http TRƯỚC khi render, để request đầu tiên
// của bất kỳ component nào cũng đã có client sẵn sàng.
configureHttp()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
)
