import { useState } from 'react';
import { apiCall } from '../api';

export function OptimizePanel({ token, orgId }) {
  const [orderIds, setOrderIds] = useState('');
  const [driverIds, setDriverIds] = useState('');
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState(null);

  const handleOptimize = async () => {
    setStatus('solving...');
    setResult(null);
    try {
      const parsedOrderIds = orderIds.split(',').map(s => parseInt(s.trim())).filter(Boolean);
      const parsedDriverIds = driverIds.split(',').map(s => parseInt(s.trim())).filter(Boolean);

      const data = await apiCall('/api/solve', {
        method: 'POST',
        token,
        orgId,
        body: { order_ids: parsedOrderIds, driver_ids: parsedDriverIds },
      });

      setResult(data);
      setStatus(`job #${data.job_id} — ${data.status}`);
    } catch (err) {
      setStatus(`error: ${err.message}`);
    }
  };

  // Once C's OR-Tools TSP endpoint is wired in, this looks for a stop_order
  // array in the response and renders it as a plain ordered list. Until then,
  // it falls back to showing the raw solver output (currently just a raw
  // OSRM duration matrix, not an optimized sequence).
  const stopOrder = result?.result?.stop_order;
  // Week 2 scope: no styling, no map integration. This is intentionally a
  // plain functional view — real dashboard UI (per the Notion design doc)
  // is scoped for Week 3-4.
  return (
    <div style={{ border: '1px solid #ccc', padding: 10, margin: 10 }}>
      <h3>Optimize Routes</h3>
      <input
        placeholder="order ids (comma-separated, e.g. 1,2)"
        value={orderIds}
        onChange={e => setOrderIds(e.target.value)}
        style={{ width: 250 }}
      /><br />
      <input
        placeholder="driver ids (comma-separated, e.g. 1)"
        value={driverIds}
        onChange={e => setDriverIds(e.target.value)}
        style={{ width: 250 }}
      /><br />
      <button onClick={handleOptimize}>Optimize</button>
      {status && <p>{status}</p>}

      {result && (
        <>
          {stopOrder ? (
            <div>
              <h4>Stop Order</h4>
              <ol>
                {stopOrder.map((stopId, idx) => (
                  <li key={`${stopId}-${idx}`}>Order #{stopId}</li>
                ))}
              </ol>
            </div>
          ) : (
            <p>
              <em>
                Raw solver output shown below — stop order isn't available yet
                (pending the OR-Tools TSP endpoint).
              </em>
            </p>
          )}

          <details>
            <summary>Raw response</summary>
            <pre style={{ background: '#f5f5f5', padding: 10, overflow: 'auto' }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </>
      )}
    </div>
  );
}