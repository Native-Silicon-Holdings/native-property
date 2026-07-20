import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { electionApi, votingApi } from '../../services/api';
import { Vote, UserPlus } from 'lucide-react';

const ElectionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [election, setElection] = useState<any>(null);
  const [votingStatus, setVotingStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchElection();
      fetchVotingStatus();
    }
  }, [id]);

  const fetchElection = async () => {
    try {
      const { data, error } = await electionApi.getById(id!);
      if (!error && data) {
        setElection(data);
      }
    } catch (error) {
      console.error('Error fetching election:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVotingStatus = async () => {
    try {
      const response = await votingApi.getStatus(id!);
      setVotingStatus(response);
    } catch (error) {
      console.error('Error fetching voting status:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!election) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-600">Election not found</p>
      </div>
    );
  }

  const canVote = votingStatus && !votingStatus.hasVoted && (
    election.status === 'VOTING_OPEN'
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">{election.title}</h1>
          {election.description && (
            <p className="text-gray-600 mt-1">{election.description}</p>
          )}
        </div>
        {canVote && (
          <Link to={`/voting/${id}`} className="btn-primary flex items-center space-x-2">
            <Vote className="h-4 w-4" />
            <span>Cast Vote</span>
          </Link>
        )}
      </div>

      {/* Election Info */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Election Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Type</p>
            <p className="font-medium">{election.type}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <p className="font-medium">{election.status.replace('_', ' ')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Nominations Period</p>
            <p className="font-medium">
              {new Date(election.nominations_start_date).toLocaleDateString()} -{' '}
              {new Date(election.nominations_end_date).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Voting Period</p>
            <p className="font-medium">
              {new Date(election.voting_start_date).toLocaleDateString()} -{' '}
              {new Date(election.voting_end_date).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Candidates */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Candidates</h2>
          {election.status === 'NOMINATIONS_OPEN' && (
            <button className="btn-secondary flex items-center space-x-2">
              <UserPlus className="h-4 w-4" />
              <span>Nominate</span>
            </button>
          )}
        </div>
        <div className="space-y-3">
          {election.candidates?.map((candidate: any) => (
            <div key={candidate.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold">{candidate.position}</h3>
                  {candidate.statement && (
                    <p className="text-sm text-gray-600 mt-1">{candidate.statement}</p>
                  )}
                  <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                    <span>Status: {candidate.status}</span>
                    {candidate.vote_choices?.[0] && (
                      <span>Votes: {candidate.vote_choices[0].vote_count}</span>
                    )}
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  candidate.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                  candidate.status === 'NOMINATED' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {candidate.status}
                </span>
              </div>
            </div>
          ))}
        </div>
        {(!election.candidates || election.candidates.length === 0) && (
          <p className="text-gray-600 text-center py-4">No candidates yet</p>
        )}
      </div>

      {/* Results Link */}
      {election.status === 'COMPLETED' && (
        <div className="card">
          <Link
            to={`/elections/${id}/results`}
            className="btn-primary w-full text-center"
          >
            View Results
          </Link>
        </div>
      )}
    </div>
  );
};

export default ElectionDetail;
