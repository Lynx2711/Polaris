import { useState } from 'react';
import { apiCall } from '../api';

export function OrderForm({ token, orgId }) {
  const [form, setForm] = useState({
    address: '', lat: '', lng: '', weight_kg: '', deadline_start: '', deadline_end: ''
  });
  const [status, setStatus] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('saving...');
    try {
      const result = await apiCall('/api/orders', {
        method: 'POST',
        token,
        orgId,
        body: {
          address: form.address,
          lat: parseFloat(form.lat),
          lng: parseFloat(form.lng),
          weight_kg: parseFloat(form.weight_kg),
          deadline_start: form.deadline_start,
          deadline_end: form.deadline_end,
        },
      });
      setStatus(`created order #${result.id}`);
      setForm({ address: '', lat: '', lng: '', weight_kg: '', deadline_start: '', deadline_end: '' });
    } catch (err) {
      setStatus(`error: ${err.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ border: '1px solid #ccc', padding: 10, flex: 1 }}>
      <h3>Add Order</h3>
      <input name="address" placeholder="Address" value={form.address} onChange={handleChange} required /><br />
      <input name="lat" placeholder="Lat" value={form.lat} onChange={handleChange} required /><br />
      <input name="lng" placeholder="Lng" value={form.lng} onChange={handleChange} required /><br />
      <input name="weight_kg" placeholder="Weight (kg)" value={form.weight_kg} onChange={handleChange} required /><br />
      <label>Deadline start: <input type="datetime-local" name="deadline_start" value={form.deadline_start} onChange={handleChange} required /></label><br />
      <label>Deadline end: <input type="datetime-local" name="deadline_end" value={form.deadline_end} onChange={handleChange} required /></label><br />
      <button type="submit">Add Order</button>
      {status && <p>{status}</p>}
    </form>
  );
}