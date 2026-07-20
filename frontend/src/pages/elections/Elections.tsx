import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { electionApi } from '../../services/api';
import { Vote, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

const Elections = () => {
  const { user } = useAuth();
  const [elections, setElections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchElections();
  }, [filter]);

  const fetchElections = async () => {
    try {
      let response;
      if (filter === 'active') {
        response = await electionApi.getActive();
      } else if (filter !== 'all') {
        response = await electionApi.getByStatus(filter);
      } else {
        response = await electionApi.getAll();
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const canManage = user?.role === 'DIRECTOR' || user?.role === 'MANAGER';

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      UPCOMING: 'bg-gray-100 text-gray-800',
      NOMINATIONS_OPEN: 'bg-blue-100 text-blue-800',
      VOTING_OPEN: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-purple-100 text-purple-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Elections</h1>
        {canManage && (
          <button className="btn-primary flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Create Election</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex space-x-4 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'active' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Active
        </button>
        {['UPCOMING', 'NOMINATIONS_OPEN', 'VOTING_OPEN', 'COMPLETED'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg ${
              filter === status ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Elections List */}
      <div className="space-y-4">
        {elections.map((election) => (
          <Link
            key={election.id}
            to={`/elections/${election.id}`}
            className="card hover:shadow-lg transition-shadow block"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold">{election.title}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(election.status)}`}>
                    {election.status.replace('_', ' ')}
                  </span>
                </div>
                {election.description && (
                  <p className="text-sm text-gray-600 mb-3">{election.description}</p>
                )}
                <div className="flex flex-wrap gap-4 text-xs text-gray-500">
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
                  <p className="text-sm text-gray-600 mt-2">
                    {election.candidates.length} candidate(s)
                  </p>
                )}
              </div>
              <Vote className="h-6 w-6 text-primary-600" />
            </div>
          </Link>
        ))}
      </div>

      {elections.length === 0 && (
        <div className="card text-center py-12">
          <Vote className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No elections found</p>
        </div>
      )}
    </div>
  );
};

export default Elections;
