import { useState } from 'react';
import { apiCall } from '../api';

export function DriverForm({ token, orgId }) {
  const [form, setForm] = useState({
    name: '', phone: '', vehicle_capacity_kg: '', home_lat: '', home_lng: ''
  });
  const [status, setStatus] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('saving...');
    try {
      const result = await apiCall('/api/drivers', {
        method: 'POST',
        token,
        orgId,
        body: {
          name: form.name,
          phone: form.phone,
          vehicle_capacity_kg: parseFloat(form.vehicle_capacity_kg),
          home_lat: parseFloat(form.home_lat),
          home_lng: parseFloat(form.home_lng),
        },
      });
      setStatus(`created driver #${result.id}`);
      setForm({ name: '', phone: '', vehicle_capacity_kg: '', home_lat: '', home_lng: '' });
    } catch (err) {
      setStatus(`error: ${err.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ border: '1px solid #ccc', padding: 10, flex: 1 }}>
      <h3>Add Driver</h3>
      <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required /><br />
      <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} /><br />
      <input name="vehicle_capacity_kg" placeholder="Capacity (kg)" value={form.vehicle_capacity_kg} onChange={handleChange} required /><br />
      <input name="home_lat" placeholder="Home Lat" value={form.home_lat} onChange={handleChange} required /><br />
      <input name="home_lng" placeholder="Home Lng" value={form.home_lng} onChange={handleChange} required /><br />
      <button type="submit">Add Driver</button>
      {status && <p>{status}</p>}
    </form>
  );
}