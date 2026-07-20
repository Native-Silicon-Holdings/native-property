import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useEstate } from '../../contexts/EstateContext';
import { directorApi } from '../../services/api';
import { Users, Plus } from 'lucide-react';
import clsx from 'clsx';

const Directors = () => {
  const { user } = useAuth();
  const { activeEstate } = useEstate();
  const [directors, setDirectors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'expiring'>('all');

  const canManage = user?.isOrgStaff || user?.estateRole === 'DIRECTOR';

  useEffect(() => {
    fetchDirectors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, activeEstate?.id]);

  const fetchDirectors = async () => {
    try {
      let response;
      if (filter === 'active') {
        response = await directorApi.getActive(activeEstate?.id);
      } else if (filter === 'expiring') {
        response = await directorApi.getExpiring(activeEstate?.id);
      } else {
        response = await directorApi.getAll(activeEstate?.id);
      }

      if (!response.error && response.data) {
        setDirectors(response.data);
      }
    } catch (error) {
      console.error('Error fetching directors:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-display text-3xl text-foreground">Directors</h1>
        {canManage && (
          <button className="btn-primary flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add Director</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        {(['all', 'active', 'expiring'] as const).map((key) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              filter === key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
            )}
          >
            {key === 'all' ? 'All Directors' : key === 'active' ? 'Active' : 'Expiring Terms'}
          </button>
        ))}
      </div>

      {/* Directors List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {directors.map((director) => (
          <div key={director.id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground">
                  {director.user
                    ? `${director.user.first_name} ${director.user.last_name}`
                    : director.contact_email || 'Director'}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">{director.position}</p>
                {director.portfolio && (
                  <p className="text-sm text-muted-foreground mt-1">{director.portfolio}</p>
                )}
                <div className="mt-3 text-xs text-muted-foreground">
                  <p>Elected: {new Date(director.elected_date).toLocaleDateString()}</p>
                  <p>Term Ends: {new Date(director.term_end_date).toLocaleDateString()}</p>
                </div>
                {!director.is_active && (
                  <span className="inline-block mt-2 px-2 py-1 text-xs bg-muted text-muted-foreground rounded">
                    Inactive
                  </span>
                )}
              </div>
              <Users className="h-8 w-8 text-accent" />
            </div>
            {director.biography && (
              <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{director.biography}</p>
            )}
          </div>
        ))}
      </div>

      {directors.length === 0 && (
        <div className="card text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No directors found</p>
        </div>
      )}
    </div>
  );
};

export default Directors;
