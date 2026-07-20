import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Ruler,
  Users,
  Wallet,
  Receipt,
} from 'lucide-react';
import { unitApi } from '../../services/api';

const UnitDetail = () => {
  const { id, estateSlug } = useParams<{ id: string; estateSlug: string }>();
  const [unit, setUnit] = useState<any>(null);
  const [owners, setOwners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUnit = async (unitId: string) => {
    try {
      const { data, error } = await unitApi.getById(unitId);
      if (!error && data) {
        setUnit(data);
      }
    } catch (error) {
      console.error('Error fetching unit:', error);
    }
  };

  const fetchOwners = async (unitId: string) => {
    try {
      const { data, error } = await unitApi.getOwners(unitId);
      if (!error && data) {
        setOwners(data);
      }
    } catch (error) {
      console.error('Error fetching owners:', error);
    }
  };

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      await Promise.all([fetchUnit(id), fetchOwners(id)]);
      setLoading(false);
    };

    load();
  }, [id]);

  const formatDate = (value?: string) => {
    if (!value) return '—';
    return new Date(value).toLocaleDateString();
  };

  const currentOwner = owners.find((o) => o.ownership_type === 'PRIMARY' && o.is_active);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="card">
        <p className="text-foreground">Unit not found.</p>
        <Link to={`/e/${estateSlug}/units`} className="text-accent font-medium mt-3 inline-flex items-center space-x-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Units</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link
            to={`/e/${estateSlug}/units`}
            className="text-accent hover:opacity-80 inline-flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Link>
          <h1 className="font-display text-3xl text-foreground">{unit.unit_number}</h1>
        </div>
        <span className="badge badge-primary">{unit.unit_type}</span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Unit Type</p>
            <p className="text-xl font-semibold">{unit.unit_type}</p>
          </div>
          <Building2 className="h-8 w-8 text-accent" />
        </div>
        <div className="card flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Size</p>
            <p className="text-xl font-semibold">{unit.square_meters || 0} m²</p>
          </div>
          <Ruler className="h-8 w-8 text-accent" />
        </div>
        <div className="card flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Occupants</p>
            <p className="text-xl font-semibold">{unit.occupants || 0}</p>
          </div>
          <Users className="h-8 w-8 text-accent" />
        </div>
        <div className="card">
          <p className="text-sm text-muted-foreground">Updated</p>
          <p className="text-xl font-semibold">{formatDate(unit.updated_at)}</p>
          <p className="text-xs text-muted-foreground">Created {formatDate(unit.created_at)}</p>
        </div>
      </div>

      {/* Unit information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card lg:col-span-2">
          <div className="flex items-center space-x-2 mb-4">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Unit Details</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="font-medium">{unit.address}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Unit Number</p>
              <p className="font-medium">{unit.unit_number}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Unit Type</p>
              <p className="font-medium">{unit.unit_type}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Square Meters</p>
              <p className="font-medium">{unit.square_meters || 0} m²</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-muted-foreground">Primary Owner</p>
              <p className="text-lg font-semibold">
                {currentOwner?.user
                  ? `${currentOwner.user.first_name} ${currentOwner.user.last_name}`
                  : 'Not assigned'}
              </p>
              {currentOwner?.user?.email && (
                <p className="text-sm text-muted-foreground">{currentOwner.user.email}</p>
              )}
            </div>
            <Users className="h-6 w-6 text-accent" />
          </div>
          <div className="space-y-2">
            {owners.slice(0, 5).map((owner) => (
              <div key={owner.id} className="flex items-start justify-between border border-border rounded-lg px-3 py-2">
                <div>
                  <p className="text-sm font-medium">
                    {owner.user?.first_name} {owner.user?.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">{owner.user?.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Role: {owner.ownership_type} • Since {formatDate(owner.start_date)}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-[10px] font-semibold ${
                    owner.is_active ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {owner.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
            {owners.length === 0 && <p className="text-sm text-muted-foreground">No ownership history yet.</p>}
          </div>
        </div>
      </div>

      {/* Utility readings and payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <Wallet className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Recent Utility Readings</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-secondary">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Type</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Reading</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Consumption</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(unit.utility_readings || []).map((reading: any) => (
                  <tr key={reading.id}>
                    <td className="px-4 py-3 text-sm">{formatDate(reading.reading_date)}</td>
                    <td className="px-4 py-3 text-sm">{reading.utility_type}</td>
                    <td className="px-4 py-3 text-sm text-right">{reading.meter_reading}</td>
                    <td className="px-4 py-3 text-sm text-right">{reading.consumption}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium">R {reading.amount?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(unit.utility_readings || []).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No readings available.</p>
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <Receipt className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Recent Payments</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-secondary">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Method</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Reference</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(unit.payments || []).map((payment: any) => (
                  <tr key={payment.id}>
                    <td className="px-4 py-3 text-sm">{formatDate(payment.payment_date)}</td>
                    <td className="px-4 py-3 text-sm">{payment.payment_method}</td>
                    <td className="px-4 py-3 text-sm">{payment.reference}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium">R {payment.amount?.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          payment.status === 'CLEARED'
                            ? 'bg-success/15 text-success'
                            : payment.status === 'PENDING'
                            ? 'bg-warning/15 text-warning'
                            : 'bg-destructive/15 text-destructive'
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(unit.payments || []).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No payments recorded.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnitDetail;
