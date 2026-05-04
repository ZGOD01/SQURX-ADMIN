import { useState, useEffect } from 'react';
import { Globe, Plus, AlertCircle } from 'lucide-react';

interface Domain {
  _id: string;
  name: string;
  isActive: boolean;
}

export default function Domains() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newDomainName, setNewDomainName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchDomains();
  }, []);

  const getHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
    'Content-Type': 'application/json'
  });

  const fetchDomains = async () => {
    try {
      setLoading(true);
      const res = await fetch('https://squrx-backend.onrender.com/api/v1/admin/domains', {
        headers: getHeaders()
      });
      const data = await res.json();
      if (data.success) {
        const domainList = Array.isArray(data.data) 
          ? data.data 
          : (data.data?.docs || data.data?.domains || data.data?.data || []);
        setDomains(domainList);
      } else {
        setError(data.message || 'Failed to fetch domains');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomainName.trim()) return;

    try {
      setIsAdding(true);
      const res = await fetch('https://squrx-backend.onrender.com/api/v1/admin/domains', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name: newDomainName, isActive: true })
      });
      const data = await res.json();
      if (data.success) {
        setNewDomainName('');
        fetchDomains(); // Refresh list
      } else {
        setError(data.message || 'Failed to add domain');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setIsAdding(false);
    }
  };

  const toggleDomainStatus = async (id: string, currentStatus: boolean) => {
    try {
      // Optimistic update
      setDomains(domains.map(d => d._id === id ? { ...d, isActive: !currentStatus } : d));
      
      const res = await fetch(`https://squrx-backend.onrender.com/api/v1/admin/domains/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ isActive: !currentStatus })
      });
      const data = await res.json();
      if (!data.success) {
        // Revert on failure
        fetchDomains();
        setError(data.message || 'Failed to update domain status');
      }
    } catch (err) {
      fetchDomains(); // Revert
      setError('Network error');
    }
  };

  return (
    <div className="w-full max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <Globe className="w-8 h-8 text-blue-500" />
            Domains Management
          </h1>
          <p className="text-gray-500 mt-2 text-sm max-w-2xl">
            Manage academic and professional domains available in the system. Add new domains or toggle their active status.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm font-medium mb-6 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 mb-8">
        <form onSubmit={handleAddDomain} className="flex gap-4">
          <input
            type="text"
            value={newDomainName}
            onChange={e => setNewDomainName(e.target.value)}
            placeholder="Enter new domain name (e.g. Data Science)"
            className="flex-1 bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 placeholder-gray-400"
          />
          <button
            type="submit"
            disabled={isAdding || !newDomainName.trim()}
            className={`px-6 py-3 py-3.5 rounded-xl text-white font-semibold flex justify-center items-center gap-2 transition-all duration-300 shadow-lg ${
              isAdding || !newDomainName.trim() ? 'bg-gray-800 opacity-80 cursor-not-allowed' : 'bg-black hover:bg-gray-800 hover:shadow-black/20 hover:-translate-y-0.5'
            }`}
          >
            {isAdding ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Add Domain
              </>
            )}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Existing Domains</h2>
        
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
          </div>
        ) : domains.length === 0 ? (
          <div className="text-center p-8 text-gray-500">No domains found. Add your first one above.</div>
        ) : (
          <div className="space-y-3">
            {domains.map((domain) => (
              <div key={domain._id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/80 border border-gray-100">
                <span className="font-medium text-gray-900">{domain.name}</span>
                <div className="flex items-center gap-4">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${domain.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}`}>
                    {domain.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    onClick={() => toggleDomainStatus(domain._id, domain.isActive)}
                    className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${
                      domain.isActive ? 'bg-emerald-500' : 'bg-gray-300'
                    }`}
                  >
                    <div 
                      className={`w-4 h-4 bg-white rounded-full mx-1 transition-transform duration-300 shadow-sm ${
                        domain.isActive ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
