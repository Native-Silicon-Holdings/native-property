import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Filter, MapPin, Plus, Search, Users } from 'lucide-react';
import { propertyApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Modal } from '../../components/ui/Modal';

const PROPERTY_TYPES = [
  { value: '', label: 'All property types' },
  { value: 'HOUSE', label: 'House' },
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'TOWNHOUSE', label: 'Townhouse' },
  { value: 'COMMERCIAL', label: 'Commercial' },
];

const Properties = () => {
  const { user } = useAuth();
  const isAdmin = user && ['DIRECTOR', 'MANAGER'].includes(user.role);

  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', type: '' });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    unitNumber: '',
    address: '',
    propertyType: 'APARTMENT',
    squareMeters: '',
    occupants: 1,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, isAdmin]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      let response;
      if (isAdmin) {
        const params: any = {};
        if (filters.search) params.search = filters.search;
        if (filters.type) params.type = filters.type;
        response = await propertyApi.getAll(params);
      } else {
        response = await propertyApi.getMyProperties();
      }

      const data = response.data.data;
      const list = data?.properties || [];
      setProperties(list);
    } catch (err) {
      console.error('Error fetching properties:', err);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const totalOccupants = properties.reduce((sum, prop) => sum + (prop.occupants || 0), 0);
    const totalResidents = properties.reduce((sum, prop) => sum + (prop.users?.length || 0), 0);
    const byType = PROPERTY_TYPES.filter((t) => t.value).map((type) => ({
      ...type,
      count: properties.filter((prop) => prop.propertyType === type.value).length,
    }));

    return {
      total: properties.length,
      totalOccupants,
      totalResidents,
      byType,
    };
  }, [properties]);

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);

    try {
      await propertyApi.create({
        unitNumber: formData.unitNumber.trim(),
        address: formData.address.trim(),
        propertyType: formData.propertyType,
        squareMeters: parseFloat(formData.squareMeters as any) || 0,
        occupants: Number(formData.occupants) || 1,
      });

      setShowCreateModal(false);
      setFormData({
        unitNumber: '',
        address: '',
        propertyType: 'APARTMENT',
        squareMeters: '',
        occupants: 1,
      });
      fetchProperties();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create property');
    } finally {
      setCreating(false);
    }
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Property Management</h1>
          <p className="text-gray-600 mt-1">
            Manage units, ownership, and occupancy based on the estate schema.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>New Property</span>
          </button>
        )}
      </div>

      {/* High-level stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Properties</p>
            <p className="text-2xl font-bold mt-1">{stats.total}</p>
          </div>
          <Building2 className="h-8 w-8 text-primary-600" />
        </div>
        <div className="card flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Recorded Occupants</p>
            <p className="text-2xl font-bold mt-1">{stats.totalOccupants}</p>
          </div>
          <Users className="h-8 w-8 text-secondary-600" />
        </div>
        <div className="card flex flex-col">
          <div className="flex items-center space-x-2 mb-3">
            <Filter className="h-4 w-4 text-gray-500" />
            <p className="text-sm text-gray-600">By Type</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {stats.byType.map((type) => (
              <div key={type.value} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                <span className="text-sm text-gray-700">{type.label}</span>
                <span className="text-sm font-semibold text-gray-900">{type.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <label className="label">Search</label>
            <div className="relative">
              <Search className="h-4 w-4 text-gray-500 absolute left-3 top-3" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Unit number or address"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <div>
            <label className="label">Property Type</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {PROPERTY_TYPES.map((type) => (
                <option key={type.value || 'all'} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <div>
              <p className="text-sm text-gray-500">
                Showing {properties.length} of {stats.total} records
              </p>
              {!isAdmin && (
                <p className="text-xs text-gray-500">Limited to properties you can access</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Property list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {properties.map((property) => (
          <Link
            key={property.id}
            to={`/properties/${property.id}`}
            className="card hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-3">
                  <h3 className="text-xl font-semibold text-gray-900">{property.unitNumber}</h3>
                  <span className="badge badge-primary">{property.propertyType}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600 mt-2">
                  <MapPin className="h-4 w-4" />
                  <span>{property.address}</span>
                </div>
              </div>
              <Building2 className="h-6 w-6 text-primary-600" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div>
                <p className="text-xs text-gray-500">Size</p>
                <p className="text-sm font-semibold">{property.squareMeters || 0} m²</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Occupants</p>
                <p className="text-sm font-semibold flex items-center space-x-1">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span>{property.occupants || 0}</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Residents</p>
                <p className="text-sm font-semibold">{property.users?.length || 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Unit</p>
                <p className="text-sm font-semibold">{property.unitNumber}</p>
              </div>
            </div>

            {property.users?.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-gray-500 mb-2">Linked Users</p>
                <div className="flex flex-wrap gap-2">
                  {property.users.slice(0, 4).map((user: any) => (
                    <span
                      key={user.id}
                      className="px-3 py-1 rounded-full bg-gray-100 text-xs font-medium text-gray-800"
                    >
                      {user.firstName} {user.lastName} • {user.role}
                    </span>
                  ))}
                  {property.users.length > 4 && (
                    <span className="text-xs text-gray-500">
                      +{property.users.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </Link>
        ))}
      </div>

      {properties.length === 0 && (
        <div className="card text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No properties found for the current filters.</p>
        </div>
      )}

      {/* Create property modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add Property"
        size="lg"
      >
        <form onSubmit={handleCreateProperty} className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm border border-red-200">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Unit Number</label>
              <input
                type="text"
                value={formData.unitNumber}
                onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                required
                className="input"
              />
            </div>
            <div>
              <label className="label">Property Type</label>
              <select
                value={formData.propertyType}
                onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                className="input"
              >
                {PROPERTY_TYPES.filter((t) => t.value).map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
                className="input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Size (m²)</label>
                <input
                  type="number"
                  value={formData.squareMeters}
                  onChange={(e) => setFormData({ ...formData, squareMeters: e.target.value })}
                  className="input"
                  min={0}
                />
              </div>
              <div>
                <label className="label">Occupants</label>
                <input
                  type="number"
                  value={formData.occupants}
                  onChange={(e) => setFormData({ ...formData, occupants: Number(e.target.value) })}
                  className="input"
                  min={1}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="btn-outline px-4 py-2 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="btn-primary px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              {creating && (
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              )}
              <span>{creating ? 'Saving...' : 'Create Property'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Properties;
