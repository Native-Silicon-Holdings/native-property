import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useEstate } from '../../contexts/EstateContext';
import { electionApi } from '../../services/api';
import { Vote, Plus } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import clsx from 'clsx';

const Elections = () => {
  const { user } = useAuth();
  const { activeEstate } = useEstate();
  const { estateSlug } = useParams<{ estateSlug: string }>();
  const [elections, setElections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const canManage = user?.isOrgStaff || user?.estateRole === 'DIRECTOR';

  useEffect(() => {
    fetchElections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, activeEstate?.id]);

  const fetchElections = async () => {
    try {
      let response;
      if (filter === 'active') {
        response = await electionApi.getActive(activeEstate?.id);
      } else if (filter !== 'all') {
        response = await electionApi.getByStatus(filter, activeEstate?.id);
      } else {
        response = await electionApi.getAll(activeEstate?.id);
      }

      if (!response.error && response.data) {
        setElections(response.data);
      }
    } catch (error) {
      console.error('Error fetching elections:', error);
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      UPCOMING: 'bg-muted text-muted-foreground',
      NOMINATIONS_OPEN: 'bg-info/15 text-info',
      VOTING_OPEN: 'bg-success/15 text-success',
      COMPLETED: 'bg-accent/15 text-accent',
      CANCELLED: 'bg-destructive/15 text-destructive',
    };
    return colors[status] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-display text-3xl text-foreground">Elections</h1>
        {canManage && (
          <button className="btn-primary flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Create Election</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex space-x-4 flex-wrap gap-y-2">
        {['all', 'active', 'UPCOMING', 'NOMINATIONS_OPEN', 'VOTING_OPEN', 'COMPLETED'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              filter === status ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
            )}
          >
            {status === 'all' ? 'All' : status === 'active' ? 'Active' : status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Elections List */}
      <div className="space-y-4">
        {elections.map((election) => (
          <Link
            key={election.id}
            to={`/e/${estateSlug}/elections/${election.id}`}
            className="card hover:shadow-lg transition-shadow block"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-foreground">{election.title}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(election.status)}`}>
                    {election.status.replace('_', ' ')}
                  </span>
                </div>
                {election.description && (
                  <p className="text-sm text-muted-foreground mb-3">{election.description}</p>
                )}
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span>Type: {election.type}</span>
                  <span>
                    Nominations: {new Date(election.nominations_start_date).toLocaleDateString()} -{' '}
                    {new Date(election.nominations_end_date).toLocaleDateString()}
                  </span>
                  <span>
                    Voting: {new Date(election.voting_start_date).toLocaleDateString()} -{' '}
                    {new Date(election.voting_end_date).toLocaleDateString()}
                  </span>
                </div>
                {election.candidates && (
                  <p className="text-sm text-muted-foreground mt-2">{election.candidates.length} candidate(s)</p>
                )}
              </div>
              <Vote className="h-6 w-6 text-accent" />
            </div>
          </Link>
        ))}
      </div>

      {elections.length === 0 && (
        <div className="card text-center py-12">
          <Vote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No elections found</p>
        </div>
      )}
    </div>
  );
};

export default Elections;
