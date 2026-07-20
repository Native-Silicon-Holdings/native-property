import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useEstate } from '../../contexts/EstateContext';
import { utilityApi, unitApi } from '../../services/api';
import { Plus } from 'lucide-react';
import clsx from 'clsx';

const Utilities = () => {
  const { user } = useAuth();
  const { activeEstate } = useEstate();
  const [readings, setReadings] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [billingSummary, setBillingSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'readings' | 'payments' | 'billing'>('readings');

  const canManage = user?.isOrgStaff || user?.estateRole === 'DIRECTOR' || user?.estateRole === 'ACCOUNTANT';

  useEffect(() => {
    fetchUnits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEstate?.id]);

  useEffect(() => {
    if (selectedUnit) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUnit, activeTab]);

  const fetchUnits = async () => {
    try {
      const response = await unitApi.getMyUnits(activeEstate?.id);
      if (!response.error && response.data) {
        const list = response.data || [];
        setUnits(list);
        if (list.length > 0) {
          setSelectedUnit(list[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching units:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      if (activeTab === 'readings') {
        const response = await utilityApi.getReadings({ unit_id: selectedUnit, limit: 20 });
        if (!response.error && response.data) {
          setReadings(response.data || []);
        }
      } else if (activeTab === 'payments') {
        const response = await utilityApi.getPayments({ unit_id: selectedUnit, limit: 20 });
        if (!response.error && response.data) {
          setPayments(response.data || []);
        }
      } else if (activeTab === 'billing') {
        const response = await utilityApi.getBilling(selectedUnit, activeEstate?.id);
        if (!response.error && response.data) {
          setBillingSummary(response.data);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
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
      <div className="flex justify-between items-center">
        <h1 className="font-display text-3xl text-foreground">Utility Management</h1>
        {canManage && (
          <button className="btn-primary flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add Reading</span>
          </button>
        )}
      </div>

      {/* Unit Selector */}
      {units.length > 0 && (
        <div className="card">
          <label className="label">Select Unit</label>
          <select value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)} className="input">
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.unit_number} - {unit.address}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-border">
        {(['readings', 'payments', 'billing'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              'px-4 py-2 font-medium border-b-2 -mb-px transition-colors',
              activeTab === tab ? 'border-accent text-accent' : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab === 'readings' ? 'Readings' : tab === 'payments' ? 'Payments' : 'Billing Summary'}
          </button>
        ))}
      </div>

      {/* Readings Tab */}
      {activeTab === 'readings' && (
        <div className="card">
          <h2 className="text-lg font-semibold text-foreground mb-4">Utility Readings</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-secondary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Type</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Reading</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Consumption</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {readings.map((reading) => (
                  <tr key={reading.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {new Date(reading.reading_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{reading.utility_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{reading.meter_reading}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{reading.consumption}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                      R {reading.amount?.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {readings.length === 0 && <p className="text-center py-8 text-muted-foreground">No readings found</p>}
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div className="card">
          <h2 className="text-lg font-semibold text-foreground mb-4">Payments</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-secondary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Reference</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                      R {payment.amount?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{payment.payment_method}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{payment.reference}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
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
          </div>
          {payments.length === 0 && <p className="text-center py-8 text-muted-foreground">No payments found</p>}
        </div>
      )}

      {/* Billing Summary Tab */}
      {activeTab === 'billing' && billingSummary && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-foreground mb-4">Billing Cycle</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="font-medium">{new Date(billingSummary.start_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">End Date</p>
                <p className="font-medium">{new Date(billingSummary.end_date).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Utilities;

