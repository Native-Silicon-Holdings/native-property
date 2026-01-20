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
import { propertyApi } from '../../services/api';

const PropertyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<any>(null);
  const [owners, setOwners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProperty = async (propertyId: string) => {
    try {
      const response = await propertyApi.getById(propertyId);
      if (response.data.success && response.data.data) {
        setProperty(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching property:', error);
    }
  };

  const fetchOwners = async (propertyId: string) => {
    try {
      const response = await propertyApi.getOwners(propertyId);
      if (response.data.success && response.data.data) {
        setOwners(response.data.data.ownerships || []);
      }
    } catch (error) {
      console.error('Error fetching owners:', error);
    }
  };

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      await Promise.all([fetchProperty(id), fetchOwners(id)]);
      setLoading(false);
    };

    load();
  }, [id]);

  const formatDate = (value?: string) => {
    if (!value) return '—';
    return new Date(value).toLocaleDateString();
  };

  const currentOwner = owners.find((o) => o.ownershipType === 'PRIMARY' && o.isActive);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="card">
        <p className="text-gray-700">Property not found.</p>
        <Link to="/properties" className="text-primary-600 font-medium mt-3 inline-flex items-center space-x-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Properties</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link to="/properties" className="text-primary-600 hover:text-primary-700 inline-flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{property.unitNumber}</h1>
        </div>
        <span className="badge badge-primary">{property.propertyType}</span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Property Type</p>
            <p className="text-xl font-semibold">{property.propertyType}</p>
          </div>
          <Building2 className="h-8 w-8 text-primary-600" />
        </div>
        <div className="card flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Size</p>
            <p className="text-xl font-semibold">{property.squareMeters || 0} m²</p>
          </div>
          <Ruler className="h-8 w-8 text-secondary-600" />
        </div>
        <div className="card flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Occupants</p>
            <p className="text-xl font-semibold">{property.occupants || 0}</p>
          </div>
          <Users className="h-8 w-8 text-green-600" />
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Updated</p>
          <p className="text-xl font-semibold">{formatDate(property.updatedAt)}</p>
          <p className="text-xs text-gray-500">Created {formatDate(property.createdAt)}</p>
        </div>
      </div>

      {/* Property information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card lg:col-span-2">
          <div className="flex items-center space-x-2 mb-4">
            <MapPin className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Property Details</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Address</p>
              <p className="font-medium">{property.address}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Unit Number</p>
              <p className="font-medium">{property.unitNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Property Type</p>
              <p className="font-medium">{property.propertyType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Square Meters</p>
              <p className="font-medium">{property.squareMeters || 0} m²</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-gray-600">Primary Owner</p>
              <p className="text-lg font-semibold">
                {currentOwner ? `${currentOwner.user?.firstName} ${currentOwner.user?.lastName}` : 'Not assigned'}
              </p>
              {currentOwner?.user?.email && (
                <p className="text-sm text-gray-500">{currentOwner.user.email}</p>
              )}
            </div>
            <Users className="h-6 w-6 text-primary-600" />
          </div>
          <div className="space-y-2">
            {owners.slice(0, 5).map((owner) => (
              <div
                key={owner.id}
                className="flex items-start justify-between border border-gray-100 rounded-lg px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium">
                    {owner.user?.firstName} {owner.user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{owner.user?.email}</p>
                  <p className="text-xs text-gray-500">
                    Role: {owner.ownershipType} • Since {formatDate(owner.startDate)}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-[10px] font-semibold ${
                    owner.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {owner.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
            {owners.length === 0 && <p className="text-sm text-gray-600">No ownership history yet.</p>}
          </div>
        </div>
      </div>

      {/* Residents */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <Users className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Residents & Linked Users</h2>
        </div>
        {property.users?.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {property.users.map((resident: any) => (
              <div key={resident.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {resident.firstName} {resident.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{resident.email}</p>
                </div>
                <span className="badge badge-gray">{resident.role}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600">No linked residents for this property.</p>
        )}
      </div>

      {/* Utility readings and payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <Wallet className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Recent Utility Readings</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Reading</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Consumption</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(property.utilityReadings || []).map((reading: any) => (
                  <tr key={reading.id}>
                    <td className="px-4 py-3 text-sm">{formatDate(reading.readingDate)}</td>
                    <td className="px-4 py-3 text-sm">{reading.utilityType}</td>
                    <td className="px-4 py-3 text-sm text-right">{reading.meterReading}</td>
                    <td className="px-4 py-3 text-sm text-right">{reading.consumption}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      R {reading.amount?.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(property.utilityReadings || []).length === 0 && (
              <p className="text-sm text-gray-600 text-center py-6">No readings available.</p>
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <Receipt className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Recent Payments</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(property.payments || []).map((payment: any) => (
                  <tr key={payment.id}>
                    <td className="px-4 py-3 text-sm">{formatDate(payment.paymentDate)}</td>
                    <td className="px-4 py-3 text-sm">{payment.paymentMethod}</td>
                    <td className="px-4 py-3 text-sm">{payment.reference}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      R {payment.amount?.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          payment.status === 'CLEARED'
                            ? 'bg-green-100 text-green-800'
                            : payment.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(property.payments || []).length === 0 && (
              <p className="text-sm text-gray-600 text-center py-6">No payments recorded.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetail;
