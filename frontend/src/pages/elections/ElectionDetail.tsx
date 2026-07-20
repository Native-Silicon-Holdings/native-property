import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { electionApi, votingApi } from '../../services/api';
import { Vote, UserPlus } from 'lucide-react';

const ElectionDetail = () => {
  const { id, estateSlug } = useParams<{ id: string; estateSlug: string }>();
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!election) {
    return (
      <div className="card text-center py-12">
        <p className="text-muted-foreground">Election not found</p>
      </div>
    );
  }

  const canVote = votingStatus && !votingStatus.hasVoted && election.status === 'VOTING_OPEN';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="font-display text-3xl text-foreground">{election.title}</h1>
          {election.description && <p className="text-muted-foreground mt-1">{election.description}</p>}
        </div>
        {canVote && (
          <Link to={`/e/${estateSlug}/voting/${id}`} className="btn-primary flex items-center space-x-2">
            <Vote className="h-4 w-4" />
            <span>Cast Vote</span>
          </Link>
        )}
      </div>

      {/* Election Info */}
      <div className="card">
        <h2 className="text-lg font-semibold text-foreground mb-4">Election Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Type</p>
            <p className="font-medium">{election.type}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="font-medium">{election.status.replace('_', ' ')}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Nominations Period</p>
            <p className="font-medium">
              {new Date(election.nominations_start_date).toLocaleDateString()} -{' '}
              {new Date(election.nominations_end_date).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Voting Period</p>
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
          <h2 className="text-lg font-semibold text-foreground">Candidates</h2>
          {election.status === 'NOMINATIONS_OPEN' && (
            <button className="btn-secondary flex items-center space-x-2">
              <UserPlus className="h-4 w-4" />
              <span>Nominate</span>
            </button>
          )}
        </div>
        <div className="space-y-3">
          {election.candidates?.map((candidate: any) => (
            <div key={candidate.id} className="border border-border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{candidate.position}</h3>
                  {candidate.statement && (
                    <p className="text-sm text-muted-foreground mt-1">{candidate.statement}</p>
                  )}
                  <div className="mt-2 flex items-center space-x-4 text-xs text-muted-foreground">
                    <span>Status: {candidate.status}</span>
                    {candidate.vote_choices?.[0] && <span>Votes: {candidate.vote_choices[0].vote_count}</span>}
                  </div>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    candidate.status === 'ACCEPTED'
                      ? 'bg-success/15 text-success'
                      : candidate.status === 'NOMINATED'
                      ? 'bg-warning/15 text-warning'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {candidate.status}
                </span>
              </div>
            </div>
          ))}
        </div>
        {(!election.candidates || election.candidates.length === 0) && (
          <p className="text-muted-foreground text-center py-4">No candidates yet</p>
        )}
      </div>

      {/* Results Link */}
      {election.status === 'COMPLETED' && (
        <div className="card">
          <Link to={`/e/${estateSlug}/elections/${id}/results`} className="btn-primary w-full text-center">
            View Results
          </Link>
        </div>
      )}
    </div>
  );
};

export default ElectionDetail;
