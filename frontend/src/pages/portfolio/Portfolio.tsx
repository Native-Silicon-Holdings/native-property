import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Building2, MapPin, Plus, Vote, Wrench } from 'lucide-react';
import { useEstate } from '../../contexts/EstateContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { directorApi, electionApi, maintenanceApi } from '../../services/api';
import { Modal } from '../../components/ui/Modal';

interface PortfolioAlert {
  label: string;
  count: number;
  icon: typeof AlertTriangle;
  tone: 'warning' | 'error';
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const Portfolio = () => {
  const { user } = useAuth();
  const { estates, loading, createEstate, refresh } = useEstate();
  const [unitCounts, setUnitCounts] = useState<Record<string, number>>({});
  const [alerts, setAlerts] = useState<PortfolioAlert[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', slug: '', address: '', coverUrl: '' });

  useEffect(() => {
    if (estates.length === 0) return;

    // Unit counts per estate -- RLS lets org staff see units across the whole org.
    supabase
      .schema('native_estate')
      .from('units')
      .select('estate_id')
      .in('estate_id', estates.map((e) => e.id))
      .then(({ data }) => {
        const counts: Record<string, number> = {};
        (data || []).forEach((row: any) => {
          counts[row.estate_id] = (counts[row.estate_id] || 0) + 1;
        });
        setUnitCounts(counts);
      });
  }, [estates]);

  useEffect(() => {
    // Portfolio-wide alert strip. RLS scopes these to the org's estates for staff,
    // so no explicit estate filter is needed. Falls back to placeholders on failure.
    const loadAlerts = async () => {
      try {
        const [expiringDirectors, openMaintenance, activeElections] = await Promise.all([
          directorApi.getExpiring(),
          maintenanceApi.getAll({ status: 'SUBMITTED' }),
          electionApi.getActive(),
        ]);

        setAlerts([
          {
            label: 'Director terms expiring soon',
            count: expiringDirectors.data?.length ?? 0,
            icon: AlertTriangle,
            tone: 'warning',
          },
          {
            label: 'Open maintenance requests',
            count: openMaintenance.data?.length ?? 0,
            icon: Wrench,
            tone: 'error',
          },
          {
            label: 'Elections in progress',
            count: activeElections.data?.length ?? 0,
            icon: Vote,
            tone: 'warning',
          },
        ]);
      } catch (err) {
        console.error('Error loading portfolio alerts:', err);
        setAlerts([
          { label: 'Director terms expiring soon', count: 0, icon: AlertTriangle, tone: 'warning' },
          { label: 'Open maintenance requests', count: 0, icon: Wrench, tone: 'error' },
          { label: 'Elections in progress', count: 0, icon: Vote, tone: 'warning' },
        ]);
      }
    };
    loadAlerts();
  }, []);

  const activeAlerts = useMemo(() => alerts.filter((a) => a.count > 0), [alerts]);

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({ ...prev, name, slug: prev.slug ? prev.slug : slugify(name) }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      await createEstate({
        name: formData.name.trim(),
        slug: slugify(formData.slug || formData.name),
        address: formData.address.trim() || undefined,
        coverUrl: formData.coverUrl.trim() || undefined,
      });
      setShowCreateModal(false);
      setFormData({ name: '', slug: '', address: '', coverUrl: '' });
      refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to create estate');
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
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-foreground">Portfolio</h1>
          <p className="text-muted-foreground mt-1">
            {user?.organizationName || 'Your organization'} · {estates.length} estate
            {estates.length === 1 ? '' : 's'}
          </p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          <span>New Estate</span>
        </button>
      </div>

      {/* Alert strip */}
      {activeAlerts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {activeAlerts.map((alert) => (
            <div
              key={alert.label}
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
                alert.tone === 'error'
                  ? 'border-destructive/30 bg-destructive/10 text-destructive'
                  : 'border-warning/30 bg-warning/10 text-warning'
              }`}
            >
              <alert.icon className="h-5 w-5 shrink-0" />
              <div className="text-sm">
                <span className="font-semibold">{alert.count}</span> {alert.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Estate grid */}
      {estates.length === 0 ? (
        <div className="card text-center py-16">
          <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <p className="text-foreground font-medium">No estates yet</p>
          <p className="text-muted-foreground text-sm mt-1">Create your first estate to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {estates.map((estate) => (
            <Link
              key={estate.id}
              to={`/e/${estate.slug}/home`}
              className="group card p-0 overflow-hidden flex flex-col hover:shadow-lg transition-shadow duration-300 ease-estate"
            >
              <div
                className="h-36 w-full bg-gradient-to-br from-secondary to-primary/20 flex items-center justify-center"
                style={
                  estate.coverUrl
                    ? { backgroundImage: `url(${estate.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                    : undefined
                }
              >
                {!estate.coverUrl && <Building2 className="h-10 w-10 text-primary/40" />}
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h2 className="font-display text-2xl text-foreground">{estate.name}</h2>
                {estate.address && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="truncate">{estate.address}</span>
                  </div>
                )}
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {unitCounts[estate.id] ?? 0} unit{unitCounts[estate.id] === 1 ? '' : 's'}
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-accent group-hover:gap-2 transition-all duration-200 ease-estate">
                    Enter <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create estate modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="New Estate" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm border border-destructive/25">
              {error}
            </div>
          )}
          <div>
            <label className="label">Estate Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              className="input"
              placeholder="Riverbend Estate"
            />
          </div>
          <div>
            <label className="label">Slug</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: slugify(e.target.value) })}
              required
              className="input"
              placeholder="riverbend"
            />
            <p className="text-xs text-muted-foreground mt-1">Used in the URL: /e/{formData.slug || 'slug'}/home</p>
          </div>
          <div>
            <label className="label">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="label">Cover Image URL (optional)</label>
            <input
              type="text"
              value={formData.coverUrl}
              onChange={(e) => setFormData({ ...formData, coverUrl: e.target.value })}
              className="input"
              placeholder="https://..."
            />
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={() => setShowCreateModal(false)} className="btn-outline px-4 py-2 rounded-lg">
              Cancel
            </button>
            <button type="submit" disabled={creating} className="btn-primary px-4 py-2 rounded-lg flex items-center space-x-2">
              {creating && <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
              <span>{creating ? 'Creating...' : 'Create Estate'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Portfolio;
