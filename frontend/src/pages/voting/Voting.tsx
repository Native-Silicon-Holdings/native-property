import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { votingApi } from '../../services/api';
import { CheckCircle, AlertCircle } from 'lucide-react';

const Voting = () => {
  const { electionId } = useParams<{ electionId: string }>();
  useAuth();
  const [status, setStatus] = useState<any>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (electionId) {
      fetchStatus();
    }
  }, [electionId]);

  const fetchStatus = async () => {
    try {
      const response = await votingApi.getStatus(electionId!);
      setStatus(response);
    } catch (error) {
      console.error('Error fetching voting status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async () => {
    if (!selectedCandidate || !electionId) {
      alert('Please select a candidate');
      return;
    }

    setSubmitting(true);
    try {
      await votingApi.castVote({
        election_id: electionId,
        candidate_id: selectedCandidate,
      });
      alert('Vote cast successfully!');
      fetchStatus(); // Refresh status
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to cast vote');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="card text-center py-12">
        <p className="text-muted-foreground">Election not found</p>
      </div>
    );
  }

  const { election, candidates, hasVoted, canVote, totalVotes } = status;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="font-display text-3xl text-foreground">{election.title}</h1>
        <p className="text-muted-foreground mt-1">
          Voting Period: {new Date(election.voting_start_date).toLocaleDateString()} -{' '}
          {new Date(election.voting_end_date).toLocaleDateString()}
        </p>
      </div>

      {hasVoted ? (
        <div className="card bg-success/10 border-success/25">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-6 w-6 text-success" />
            <div>
              <h3 className="font-semibold text-foreground">You have already voted</h3>
              <p className="text-sm text-muted-foreground">Thank you for participating in this election.</p>
            </div>
          </div>
        </div>
      ) : !canVote ? (
        <div className="card bg-warning/10 border-warning/25">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-6 w-6 text-warning" />
            <div>
              <h3 className="font-semibold text-foreground">Voting is not available</h3>
              <p className="text-sm text-muted-foreground">
                Voting window is closed or election is not in voting phase.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          <h2 className="text-lg font-semibold text-foreground mb-4">Select Your Candidate</h2>
          <div className="space-y-3">
            {candidates.map((candidate: any) => (
              <label
                key={candidate.id}
                className={`block p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  selectedCandidate === candidate.id
                    ? 'border-primary bg-accent/5'
                    : 'border-border hover:border-muted-foreground'
                }`}
              >
                <input
                  type="radio"
                  name="candidate"
                  value={candidate.id}
                  checked={selectedCandidate === candidate.id}
                  onChange={(e) => setSelectedCandidate(e.target.value)}
                  className="sr-only"
                />
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{candidate.position}</h3>
                    {candidate.statement && (
                      <p className="text-sm text-muted-foreground mt-1">{candidate.statement}</p>
                    )}
                  </div>
                  {selectedCandidate === candidate.id && <CheckCircle className="h-5 w-5 text-accent" />}
                </div>
              </label>
            ))}
          </div>
          <button onClick={handleVote} disabled={!selectedCandidate || submitting} className="btn-primary w-full mt-6">
            {submitting ? 'Submitting...' : 'Cast Vote'}
          </button>
        </div>
      )}

      {/* Results Preview (if voting closed) */}
      {election.status === 'COMPLETED' && (
        <div className="card">
          <h2 className="text-lg font-semibold text-foreground mb-4">Results</h2>
          <div className="space-y-3">
            {candidates
              .sort((a: any, b: any) => b.vote_count - a.vote_count)
              .map((candidate: any) => {
                const percentage = totalVotes > 0 ? (candidate.vote_count / totalVotes) * 100 : 0;
                return (
                  <div key={candidate.id} className="border border-border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-foreground">{candidate.position}</span>
                      <span className="text-sm text-muted-foreground">
                        {candidate.vote_count} votes ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div className="bg-accent h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Voting;
