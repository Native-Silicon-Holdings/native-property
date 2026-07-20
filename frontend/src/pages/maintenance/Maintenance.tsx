import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useEstate } from '../../contexts/EstateContext';
import { maintenanceApi, unitApi } from '../../services/api';
import { Wrench, Plus, Filter } from 'lucide-react';

const Maintenance = () => {
  const { user } = useAuth();
  const { activeEstate } = useEstate();
  const { estateSlug } = useParams<{ estateSlug: string }>();
  const [requests, setRequests] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    unitId: '',
  });

  const canManage = user?.isOrgStaff || user?.estateRole === 'DIRECTOR';

  useEffect(() => {
    fetchUnits();
    fetchRequests();
    if (canManage) {
      fetchStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, activeEstate?.id]);

  const fetchUnits = async () => {
    try {
      const response = await unitApi.getMyUnits(activeEstate?.id);
      if (!response.error && response.data) {
        setUnits(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching units:', error);
    }
  };

  const fetchRequests = async () => {
    try {
      const params: { estateId?: string; status?: string; category?: string; unit_id?: string } = {
        estateId: activeEstate?.id,
      };
      if (filters.status) params.status = filters.status;
      if (filters.category) params.category = filters.category;
      if (filters.unitId) params.unit_id = filters.unitId;

      const response = await maintenanceApi.getAll(params);
      if (!response.error && response.data) {
        setRequests(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching maintenance requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await maintenanceApi.getStats(activeEstate?.id);
      if (!response.error && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      SUBMITTED: 'bg-warning/15 text-warning',
      IN_PROGRESS: 'bg-info/15 text-info',
      RESOLVED: 'bg-success/15 text-success',
      CLOSED: 'bg-muted text-muted-foreground',
    };
    return colors[status] || 'bg-muted text-muted-foreground';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      LOW: 'bg-muted text-muted-foreground',
      MEDIUM: 'bg-info/15 text-info',
      HIGH: 'bg-warning/15 text-warning',
      URGENT: 'bg-destructive/15 text-destructive',
    };
    return colors[priority] || 'bg-muted text-muted-foreground';
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
        <h1 className="font-display text-3xl text-foreground">Maintenance Requests</h1>
        <Link to={`/e/${estateSlug}/maintenance/new`} className="btn-primary flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>New Request</span>
        </Link>
      </div>

      {/* Stats (Admin only) */}
      {canManage && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <p className="text-sm text-muted-foreground">Submitted</p>
            <p className="text-2xl font-bold mt-1">{stats.byStatus?.SUBMITTED || 0}</p>
          </div>
          <div className="card">
            <p className="text-sm text-muted-foreground">In Progress</p>
            <p className="text-2xl font-bold mt-1">{stats.byStatus?.IN_PROGRESS || 0}</p>
          </div>
          <div className="card">
            <p className="text-sm text-muted-foreground">Resolved</p>
            <p className="text-2xl font-bold mt-1">{stats.byStatus?.RESOLVED || 0}</p>
          </div>
          <div className="card">
            <p className="text-sm text-muted-foreground">Avg Resolution</p>
            <p className="text-2xl font-bold mt-1">{stats.averageResolutionDays?.toFixed(1) || '0'} days</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="input"
            >
              <option value="">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
          <div>
            <label className="label">Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="input"
            >
              <option value="">All Categories</option>
              <option value="PLUMBING">Plumbing</option>
              <option value="ELECTRICAL">Electrical</option>
              <option value="SECURITY">Security</option>
              <option value="GARDEN">Garden</option>
              <option value="CLEANING">Cleaning</option>
              <option value="STRUCTURAL">Structural</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          {canManage && (
            <div>
              <label className="label">Unit</label>
              <select
                value={filters.unitId}
                onChange={(e) => setFilters({ ...filters, unitId: e.target.value })}
                className="input"
              >
                <option value="">All Units</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.unit_number}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {requests.map((request) => (
          <Link
            key={request.id}
            to={`/e/${estateSlug}/maintenance/${request.id}`}
            className="card hover:shadow-lg transition-shadow block"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-foreground">{request.category}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(request.status)}`}>
                    {request.status.replace('_', ' ')}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(request.priority)}`}>
                    {request.priority}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{request.description}</p>
                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                  <span>Unit: {request.units?.unit_number}</span>
                  <span>Submitted: {new Date(request.submitted_at).toLocaleDateString()}</span>
                  {request.estimated_cost && <span>Est. Cost: R {request.estimated_cost.toFixed(2)}</span>}
                </div>
              </div>
              <Wrench className="h-6 w-6 text-accent" />
            </div>
          </Link>
        ))}
      </div>

      {requests.length === 0 && (
        <div className="card text-center py-12">
          <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No maintenance requests found</p>
        </div>
      )}
    </div>
  );
};

export default Maintenance;
