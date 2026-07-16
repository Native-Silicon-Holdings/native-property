import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { maintenanceApi, propertyApi } from '../../services/api';
import { Wrench, Plus, Filter } from 'lucide-react';

const Maintenance = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    propertyId: '',
  });

  const canManage = user?.role === 'DIRECTOR' || user?.role === 'MANAGER';

  useEffect(() => {
    fetchProperties();
    fetchRequests();
    if (canManage) {
      fetchStats();
    }
  }, [filters]);

  const fetchProperties = async () => {
    try {
      const response = await propertyApi.getMyProperties();
      if (!response.error && response.data) {
        setProperties(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const fetchRequests = async () => {
    try {
      const params: { status?: string; category?: string; property_id?: string } = {};
      if (filters.status) params.status = filters.status;
      if (filters.category) params.category = filters.category;
      if (filters.propertyId) params.property_id = filters.propertyId;

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
      const response = await maintenanceApi.getStats();
      if (!response.error && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      SUBMITTED: 'bg-yellow-100 text-yellow-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      RESOLVED: 'bg-green-100 text-green-800',
      CLOSED: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      LOW: 'bg-gray-100 text-gray-800',
      MEDIUM: 'bg-blue-100 text-blue-800',
      HIGH: 'bg-orange-100 text-orange-800',
      URGENT: 'bg-red-100 text-red-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Maintenance Requests</h1>
        <Link to="/maintenance/new" className="btn-primary flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>New Request</span>
        </Link>
      </div>

      {/* Stats (Admin only) */}
      {canManage && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <p className="text-sm text-gray-600">Submitted</p>
            <p className="text-2xl font-bold mt-1">{stats.byStatus?.SUBMITTED || 0}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">In Progress</p>
            <p className="text-2xl font-bold mt-1">{stats.byStatus?.IN_PROGRESS || 0}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">Resolved</p>
            <p className="text-2xl font-bold mt-1">{stats.byStatus?.RESOLVED || 0}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">Avg Resolution</p>
            <p className="text-2xl font-bold mt-1">
              {stats.averageResolutionDays?.toFixed(1) || '0'} days
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
              <select
                value={filters.propertyId}
                onChange={(e) => setFilters({ ...filters, propertyId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Properties</option>
                {properties.map((prop) => (
                  <option key={prop.id} value={prop.id}>
                    {prop.unitNumber}
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
            to={`/maintenance/${request.id}`}
            className="card hover:shadow-lg transition-shadow block"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold">{request.category}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(request.status)}`}>
                    {request.status.replace('_', ' ')}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(request.priority)}`}>
                    {request.priority}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{request.description}</p>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>Property: {request.property?.unitNumber}</span>
                  <span>Submitted: {new Date(request.submittedAt).toLocaleDateString()}</span>
                  {request.estimatedCost && (
                    <span>Est. Cost: R {request.estimatedCost.toFixed(2)}</span>
                  )}
                </div>
              </div>
              <Wrench className="h-6 w-6 text-primary-600" />
            </div>
          </Link>
        ))}
      </div>

      {requests.length === 0 && (
        <div className="card text-center py-12">
          <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No maintenance requests found</p>
        </div>
      )}
    </div>
  );
};

export default Maintenance;
