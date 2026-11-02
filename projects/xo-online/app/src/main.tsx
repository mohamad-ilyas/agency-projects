import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { BroadcastTransport, MqttTransport, type Transport } from './lib/transport'

// ?transport=local → same-browser test mode (two tabs, no broker). Default: public MQTT broker over WSS.
const local = new URLSearchParams(window.location.search).get('transport') === 'local'
const transport: Transport = local
  ? new BroadcastTransport()
  : new MqttTransport(import.meta.env.VITE_BROKER_URL as string | undefined)

const container = document.getElementById('root')
if (container) {
  createRoot(container).render(
    <StrictMode>
      <App transport={transport} perTabIdentity={local} />
    </StrictMode>,
  )
}
