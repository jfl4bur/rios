import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import ErrorBoundary from './ErrorBoundary'
import './i18n'
import './styles.css'
import { isLocalHost } from './utils'

// expose helper for dev/debugging and conditional logic
if (typeof window !== 'undefined') {
	try { window.isLocalHost = isLocalHost() } catch (e) { /* noop */ }
}

createRoot(document.getElementById('root')).render(
	<ErrorBoundary>
		<App />
	</ErrorBoundary>
)
