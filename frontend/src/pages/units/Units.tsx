import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Building2, Filter, MapPin, Plus, Search, Users } from 'lucide-react';
import { unitApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useEstate } from '../../contexts/EstateContext';
import { Modal } from '../../components/ui/Modal';

const UNIT_TYPES = [
  { value: '', label: 'All unit types' },
  { value: 'HOUSE', label: 'House' },
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'TOWNHOUSE', label: 'Townhouse' },
  { value: 'COMMERCIAL', label: 'Commercial' },
];

const Units = () => {
  const { user } = useAuth();
  const { estateSlug } = useParams<{ estateSlug: string }>();
  const { activeEstate } = useEstate();
  const canManage = user?.isOrgStaff || user?.estateRole === 'DIRECTOR';

  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', type: '' });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    unitNumber: '',
    address: '',
    unitType: 'APARTMENT',
    squareMeters: '',
    occupants: 1,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUnits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, canManage, activeEstate?.id]);

  const fetchUnits = async () => {
    setLoading(true);
    try {
      let response;
      if (canManage) {
        const params: any = { estateId: activeEstate?.id };
        if (filters.search) params.search = filters.search;
        if (filters.type) params.unit_type = filters.type;
        response = await unitApi.getAll(params);
      } else {
        response = await unitApi.getMyUnits(activeEstate?.id);
      }

      setUnits(response.data || []);
    } catch (err) {
      console.error('Error fetching units:', err);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const totalOccupants = units.reduce((sum, unit) => sum + (unit.occupants || 0), 0);
    const byType = UNIT_TYPES.filter((t) => t.value).map((type) => ({
      ...type,
      count: units.filter((unit) => unit.unit_type === type.value).length,
    }));

    return { total: units.length, totalOccupants, byType };
  }, [units]);

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);

    try {
      if (!activeEstate) throw new Error('No active estate');

      await unitApi.create({
        unit_number: formData.unitNumber.trim(),
        address: formData.address.trim(),
        unit_type: formData.unitType,
        square_meters: parseFloat(formData.squareMeters as any) || 0,
        occupants: Number(formData.occupants) || 1,
        organization_id: activeEstate.organizationId,
        estate_id: activeEstate.id,
      });

      setShowCreateModal(false);
      setFormData({ unitNumber: '', address: '', unitType: 'APARTMENT', squareMeters: '', occupants: 1 });
      fetchUnits();
    } catch (err: any) {
      setError(err?.message || 'Failed to create unit');
    } finally {
      setCreating(false);
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl text-foreground">Units</h1>
          <p className="text-muted-foreground mt-1">
            Manage units, ownership, and occupancy for {activeEstate?.name || 'this estate'}.
          </p>
        </div>
        {canManage && (
          <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>New Unit</span>
          </button>
        )}
      </div>

      {/* High-level stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Units</p>
            <p className="text-2xl font-bold mt-1">{stats.total}</p>
          </div>
          <Building2 className="h-8 w-8 text-accent" />
        </div>
        <div className="card flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Recorded Occupants</p>
            <p className="text-2xl font-bold mt-1">{stats.totalOccupants}</p>
          </div>
          <Users className="h-8 w-8 text-accent" />
        </div>
        <div className="card flex flex-col">
          <div className="flex items-center space-x-2 mb-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">By Type</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {stats.byType.map((type) => (
              <div key={type.value} className="flex items-center justify-between bg-secondary px-3 py-2 rounded-lg">
                <span className="text-sm text-foreground">{type.label}</span>
                <span className="text-sm font-semibold text-foreground">{type.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-4">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <label className="label">Search</label>
            <div className="relative">
              <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Unit number or address"
                className="input pl-9"
              />
            </div>
          </div>
          <div>
            <label className="label">Unit Type</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="input"
            >
              {UNIT_TYPES.map((type) => (
                <option key={type.value || 'all'} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <div>
              <p className="text-sm text-muted-foreground">
                Showing {units.length} of {stats.total} records
              </p>
              {!canManage && <p className="text-xs text-muted-foreground">Limited to units you can access</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Unit list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {units.map((unit) => (
          <Link
            key={unit.id}
            to={`/e/${estateSlug}/units/${unit.id}`}
            className="card hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-3">
                  <h3 className="text-xl font-semibold text-foreground">{unit.unit_number}</h3>
                  <span className="badge badge-primary">{unit.unit_type}</span>
                </div>
                <div className="flex items-center space-x-2 text-muted-foreground mt-2">
                  <MapPin className="h-4 w-4" />
                  <span>{unit.address}</span>
                </div>
              </div>
              <Building2 className="h-6 w-6 text-accent" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div>
                <p className="text-xs text-muted-foreground">Size</p>
                <p className="text-sm font-semibold">{unit.square_meters || 0} m²</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Occupants</p>
                <p className="text-sm font-semibold flex items-center space-x-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{unit.occupants || 0}</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Owners</p>
                <p className="text-sm font-semibold">{unit.unit_ownerships?.length || 0}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Unit</p>
                <p className="text-sm font-semibold">{unit.unit_number}</p>
              </div>
            </div>

            {unit.unit_ownerships?.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground mb-2">Ownership</p>
                <div className="flex flex-wrap gap-2">
                  {unit.unit_ownerships.slice(0, 4).map((ownership: any) => (
                    <span
                      key={ownership.user_id + ownership.ownership_type}
                      className="px-3 py-1 rounded-full bg-secondary text-xs font-medium text-foreground"
                    >
                      {ownership.ownership_type}
                      {!ownership.is_active ? ' (inactive)' : ''}
                    </span>
                  ))}
                  {unit.unit_ownerships.length > 4 && (
                    <span className="text-xs text-muted-foreground">+{unit.unit_ownerships.length - 4} more</span>
                  )}
                </div>
              </div>
            )}
          </Link>
        ))}
      </div>

      {units.length === 0 && (
        <div className="card text-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No units found for the current filters.</p>
        </div>
      )}

      {/* Create unit modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add Unit" size="lg">
        <form onSubmit={handleCreateUnit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm border border-destructive/25">
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
              <label className="label">Unit Type</label>
              <select
                value={formData.unitType}
                onChange={(e) => setFormData({ ...formData, unitType: e.target.value })}
                className="input"
              >
                {UNIT_TYPES.filter((t) => t.value).map((type) => (
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
            <button type="button" onClick={() => setShowCreateModal(false)} className="btn-outline px-4 py-2 rounded-lg">
              Cancel
            </button>
            <button type="submit" disabled={creating} className="btn-primary px-4 py-2 rounded-lg flex items-center space-x-2">
              {creating && (
                <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
              )}
              <span>{creating ? 'Saving...' : 'Create Unit'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Units;
