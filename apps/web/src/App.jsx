import { useState } from 'react'
import './App.css'
import { DispatchMap } from './components/DispatchMap'
import { DriverForm } from './components/DriverForm'
import { OrderForm } from './components/OrderForm'
import { OptimizePanel } from './components/OptimizePanel'

function App() {
  const [token, setToken] = useState('');
  const [orgId, setOrgId] = useState('');

  return (
    <>
      {/* TEMPORARY: manual token/org-id input, standing in for real login until
          marketing's signup/login UI is ready. Remove once that exists. */}
      <div style={{ padding: 10, background: '#eee', display: 'flex', gap: 10 }}>
        <input
          placeholder="paste JWT token"
          value={token}
          onChange={e => setToken(e.target.value)}
          style={{ width: 400 }}
        />
        <input
          placeholder="org id (e.g. test-org-2)"
          value={orgId}
          onChange={e => setOrgId(e.target.value)}
        />
      </div>
      
      {/* Week 2 scope: functional forms only, unstyled. Real layout/design
          (top bar, left rail, driver colors, etc.) comes in Week 3-4 per the
          dispatcher dashboard design doc — these will likely be restructured
          then, not styled in place. */}
      <div style={{ display: 'flex', gap: 20, padding: 10 }}>
        <DriverForm token={token} orgId={orgId} />
        <OrderForm token={token} orgId={orgId} />
      </div>

      <OptimizePanel token={token} orgId={orgId} />

      <DispatchMap />
    </>
  )
}

export default App