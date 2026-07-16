import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { utilityApi, propertyApi } from '../../services/api';
import { Plus } from 'lucide-react';

const Utilities = () => {
  const { user } = useAuth();
  const [readings, setReadings] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [billingSummary, setBillingSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'readings' | 'payments' | 'billing'>('readings');

  const canManage = user?.role === 'DIRECTOR' || user?.role === 'MANAGER' || user?.role === 'ACCOUNTANT';

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (selectedProperty) {
      fetchData();
    }
  }, [selectedProperty, activeTab]);

  const fetchProperties = async () => {
    try {
      const response = await propertyApi.getMyProperties();
      if (!response.error && response.data) {
        const props = response.data || [];
        setProperties(props);
        if (props.length > 0) {
          setSelectedProperty(props[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      if (activeTab === 'readings') {
        const response = await utilityApi.getReadings({ property_id: selectedProperty, limit: 20 });
        if (!response.error && response.data) {
          setReadings(response.data || []);
        }
      } else if (activeTab === 'payments') {
        const response = await utilityApi.getPayments({ property_id: selectedProperty, limit: 20 });
        if (!response.error && response.data) {
          setPayments(response.data || []);
        }
      } else if (activeTab === 'billing') {
        const response = await utilityApi.getBilling(selectedProperty);
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Utility Management</h1>
        {canManage && (
          <button className="btn-primary flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add Reading</span>
          </button>
        )}
      </div>

      {/* Property Selector */}
      {properties.length > 0 && (
        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Property
          </label>
          <select
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {properties.map((prop) => (
              <option key={prop.id} value={prop.id}>
                {prop.unitNumber} - {prop.address}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-4 border-b">
        <button
          onClick={() => setActiveTab('readings')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'readings'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Readings
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'payments'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Payments
        </button>
        <button
          onClick={() => setActiveTab('billing')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'billing'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Billing Summary
        </button>
      </div>

      {/* Readings Tab */}
      {activeTab === 'readings' && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Utility Readings</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Reading</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Consumption</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {readings.map((reading) => (
                  <tr key={reading.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {new Date(reading.readingDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{reading.utilityType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{reading.meterReading}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{reading.consumption}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                      R {reading.amount?.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {readings.length === 0 && (
            <p className="text-center py-8 text-gray-600">No readings found</p>
          )}
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Payments</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {new Date(payment.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                      R {payment.amount?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{payment.paymentMethod}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{payment.reference}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        payment.status === 'CLEARED' ? 'bg-green-100 text-green-800' :
                        payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {payments.length === 0 && (
            <p className="text-center py-8 text-gray-600">No payments found</p>
          )}
        </div>
      )}

      {/* Billing Summary Tab */}
      {activeTab === 'billing' && billingSummary && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Billing Cycle</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Start Date</p>
                <p className="font-medium">
                  {new Date(billingSummary.billingCycle.startDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">End Date</p>
                <p className="font-medium">
                  {new Date(billingSummary.billingCycle.endDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card">
              <p className="text-sm text-gray-600">Total Consumption</p>
              <p className="text-2xl font-bold mt-1">{billingSummary.summary.totalConsumption}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold mt-1 text-blue-600">
                R {billingSummary.summary.totalAmount?.toFixed(2)}
              </p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-600">Total Paid</p>
              <p className="text-2xl font-bold mt-1 text-green-600">
                R {billingSummary.summary.totalPaid?.toFixed(2)}
              </p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-600">Outstanding</p>
              <p className={`text-2xl font-bold mt-1 ${
                billingSummary.summary.outstanding > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                R {billingSummary.summary.outstanding?.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Utilities;
