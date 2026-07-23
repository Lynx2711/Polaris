import { useState } from 'react';
import { X, Package, MapPin, Scale, Clock } from 'lucide-react';

export default function NewOrderModal({ isOpen, onClose, onSubmit }) {
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('31.315');
  const [lng, setLng] = useState('75.585');
  const [weightKg, setWeightKg] = useState('100');
  const [deadlineMinutes, setDeadlineMinutes] = useState('120'); // Default 2 hours window
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!address || !lat || !lng || !weightKg) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    const now = new Date();
    const start = now.toISOString();
    const end = new Date(now.getTime() + parseInt(deadlineMinutes) * 60 * 1000).toISOString();

    try {
      await onSubmit({
        address,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        weight_kg: parseFloat(weightKg),
        deadline_start: start,
        deadline_end: end,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create order');
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
          <Package size={18} className="text-[#FBBF24]" />
          <h3 className="font-bold text-sm text-white uppercase">ADD NEW DELIVERY ORDER</h3>
        </div>

        {error && (
          <div className="bg-[#2B1216] border border-[#F43F5E]/40 text-[#F43F5E] p-2.5 mb-4 text-[11px]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[#A0A0A0] text-[10px] uppercase mb-1">Delivery Address</label>
            <div className="flex items-center bg-[#1A1A1A] border border-[#333333] px-3 py-2">
              <MapPin size={14} className="text-[#8C8C8C] mr-2 shrink-0" />
              <input
                type="text"
                placeholder="e.g. Model Town Market, Jalandhar"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="bg-transparent text-white w-full outline-none text-xs"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#A0A0A0] text-[10px] uppercase mb-1">Latitude</label>
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
              <label className="block text-[#A0A0A0] text-[10px] uppercase mb-1">Longitude</label>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#A0A0A0] text-[10px] uppercase mb-1">Payload Weight (KG)</label>
              <div className="flex items-center bg-[#1A1A1A] border border-[#333333] px-3 py-2">
                <Scale size={14} className="text-[#8C8C8C] mr-2 shrink-0" />
                <input
                  type="number"
                  placeholder="100"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="bg-transparent text-white w-full outline-none text-xs"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[#A0A0A0] text-[10px] uppercase mb-1">Deadline (Minutes)</label>
              <div className="flex items-center bg-[#1A1A1A] border border-[#333333] px-3 py-2">
                <Clock size={14} className="text-[#8C8C8C] mr-2 shrink-0" />
                <input
                  type="number"
                  placeholder="120"
                  value={deadlineMinutes}
                  onChange={(e) => setDeadlineMinutes(e.target.value)}
                  className="bg-transparent text-white w-full outline-none text-xs"
                  required
                />
              </div>
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
              {loading ? 'CREATING...' : 'CREATE ORDER'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
