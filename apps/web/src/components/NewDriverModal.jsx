import { useState } from 'react';
import { X, Truck, Phone, Scale, MapPin } from 'lucide-react';

export default function NewDriverModal({ isOpen, onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [capacity, setCapacity] = useState('500');
  const [lat, setLat] = useState('31.298');
  const [lng, setLng] = useState('75.647');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !capacity || !lat || !lng) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSubmit({
        name,
        email: email || null,
        phone: phone || null,
        vehicle_capacity_kg: parseFloat(capacity),
        home_lat: parseFloat(lat),
        home_lng: parseFloat(lng),
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create driver');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-mono select-none">
      <div className="bg-[#121212] border border-[#262626] w-full max-w-md shadow-2xl p-6 relative text-xs">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8C8C8C] hover:text-white transition cursor-pointer"
        >
          <X size={18} />
        </button>
 
        <div className="flex items-center gap-2.5 border-b border-[#262626] pb-4 mb-4">
          <Truck size={18} className="text-[#38BDF8]" />
          <h3 className="font-bold text-sm text-white uppercase">ADD NEW FLEET DRIVER</h3>
        </div>
 
        {error && (
          <div className="bg-[#2B1216] border border-[#F43F5E]/40 text-[#F43F5E] p-2.5 mb-4 text-[11px]">
            {error}
          </div>
        )}
 
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[#A0A0A0] text-[10px] uppercase mb-1">Driver Full Name</label>
            <div className="flex items-center bg-[#1A1A1A] border border-[#333333] px-3 py-2">
              <Truck size={14} className="text-[#8C8C8C] mr-2 shrink-0" />
              <input
                type="text"
                placeholder="e.g. Rajwinder Singh"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-transparent text-white w-full outline-none text-xs"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[#A0A0A0] text-[10px] uppercase mb-1">Email (Optional - For App Login)</label>
            <div className="flex items-center bg-[#1A1A1A] border border-[#333333] px-3 py-2">
              <span className="text-[#8C8C8C] mr-2 shrink-0 font-bold">@</span>
              <input
                type="email"
                placeholder="driver@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent text-white w-full outline-none text-xs"
              />
            </div>
            <p className="text-[9px] text-[#8C8C8C] mt-1 italic">Allows driver to log in with password "password123"</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#A0A0A0] text-[10px] uppercase mb-1">Phone (Optional)</label>
              <div className="flex items-center bg-[#1A1A1A] border border-[#333333] px-3 py-2">
                <Phone size={14} className="text-[#8C8C8C] mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder="+91 98765 00000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-transparent text-white w-full outline-none text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#A0A0A0] text-[10px] uppercase mb-1">Vehicle Capacity (KG)</label>
              <div className="flex items-center bg-[#1A1A1A] border border-[#333333] px-3 py-2">
                <Scale size={14} className="text-[#8C8C8C] mr-2 shrink-0" />
                <input
                  type="number"
                  placeholder="500"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="bg-transparent text-white w-full outline-none text-xs"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#A0A0A0] text-[10px] uppercase mb-1">Depot / Home Lat</label>
              <input
                type="number"
                step="0.0001"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#333333] px-3 py-2 text-white outline-none text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-[#A0A0A0] text-[10px] uppercase mb-1">Depot / Home Lng</label>
              <input
                type="number"
                step="0.0001"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#333333] px-3 py-2 text-white outline-none text-xs"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#262626]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 bg-[#1A1A1A] text-[#A0A0A0] hover:text-white border border-[#333333] transition cursor-pointer"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-white text-[#0A0A0A] font-bold hover:bg-[#E5E5E5] transition cursor-pointer disabled:opacity-50"
            >
              {loading ? 'CREATING...' : 'ADD DRIVER'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
