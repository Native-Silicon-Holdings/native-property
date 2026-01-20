import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { directorApi } from '../../services/api';
import { Users, Plus } from 'lucide-react';

const Directors = () => {
  const { user } = useAuth();
  const [directors, setDirectors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'expiring'>('all');

  useEffect(() => {
    fetchDirectors();
  }, [filter]);

  const fetchDirectors = async () => {
    try {
      let response;
      if (filter === 'active') {
        response = await directorApi.getActive();
      } else if (filter === 'expiring') {
        response = await directorApi.getExpiring();
      } else {
        response = await directorApi.getAll();
      }

      if (response.data.success && response.data.data) {
        setDirectors(response.data.data.directors || []);
      }
    } catch (error) {
      console.error('Error fetching directors:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const canManage = user?.role === 'DIRECTOR' || user?.role === 'MANAGER';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Directors</h1>
        {canManage && (
          <button className="btn-primary flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add Director</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          All Directors
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'active' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setFilter('expiring')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'expiring' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Expiring Terms
        </button>
      </div>

      {/* Directors List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {directors.map((director) => (
          <div key={director.id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold">
                  {director.user?.firstName} {director.user?.lastName}
                </h3>
                <p className="text-sm text-gray-600 mt-1">{director.position}</p>
                {director.portfolio && (
                  <p className="text-sm text-gray-500 mt-1">{director.portfolio}</p>
                )}
                <div className="mt-3 text-xs text-gray-500">
                  <p>Elected: {new Date(director.electedDate).toLocaleDateString()}</p>
                  <p>Term Ends: {new Date(director.termEndDate).toLocaleDateString()}</p>
                </div>
                {!director.isActive && (
                  <span className="inline-block mt-2 px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded">
                    Inactive
                  </span>
                )}
              </div>
              <Users className="h-8 w-8 text-primary-600" />
            </div>
            {director.biography && (
              <p className="mt-3 text-sm text-gray-600 line-clamp-2">{director.biography}</p>
            )}
          </div>
        ))}
      </div>

      {directors.length === 0 && (
        <div className="card text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No directors found</p>
        </div>
      )}
    </div>
  );
};

export default Directors;



