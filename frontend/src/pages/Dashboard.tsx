import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Megaphone,
  Calendar,
  Wrench,
  TrendingUp,
  DollarSign,
  Building,
} from 'lucide-react';
import { announcementApi, meetingApi, maintenanceApi } from '../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    announcements: 0,
    upcomingMeetings: 0,
    maintenanceRequests: 0,
    outstandingBalance: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [announcementsRes, meetingsRes, maintenanceRes] = await Promise.all([
        announcementApi.getAll({ limit: 5 }),
        meetingApi.getAll({ status: 'SCHEDULED', limit: 5 }),
        maintenanceApi.getAll({ limit: 5 }),
      ]);

      setStats({
        announcements: announcementsRes.data?.length || 0,
        upcomingMeetings: meetingsRes.data?.length || 0,
        maintenanceRequests: maintenanceRes.data?.length || 0,
        outstandingBalance: 0, // Calculate from payments
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, link }: any) => (
    <Link to={link} className="card hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </Link>
  );

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="card">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="mt-1 text-gray-600">
          Here's what's happening in your estate today.
        </p>
        {user?.property && (
          <div className="mt-4 flex items-center space-x-2 text-sm text-gray-600">
            <Building className="h-4 w-4" />
            <span>
              Property: {user.property.unit_number || user.property.unitNumber} -{' '}
              {user.property.address}
            </span>
          </div>
        )}
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Announcements"
          value={loading ? '...' : stats.announcements}
          icon={Megaphone}
          color="bg-blue-500"
          link="/announcements"
        />
        <StatCard
          title="Upcoming Meetings"
          value={loading ? '...' : stats.upcomingMeetings}
          icon={Calendar}
          color="bg-green-500"
          link="/meetings"
        />
        <StatCard
          title="Maintenance Requests"
          value={loading ? '...' : stats.maintenanceRequests}
          icon={Wrench}
          color="bg-yellow-500"
          link="/maintenance"
        />
        <StatCard
          title="Outstanding Balance"
          value={loading ? '...' : `R ${stats.outstandingBalance.toFixed(2)}`}
          icon={DollarSign}
          color="bg-red-500"
          link="/utilities"
        />
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/documents"
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FileText className="h-6 w-6 text-primary-600" />
            <div>
              <p className="font-medium text-gray-900">View Documents</p>
              <p className="text-sm text-gray-500">Access meeting minutes & reports</p>
            </div>
          </Link>

          <Link
            to="/utilities"
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <TrendingUp className="h-6 w-6 text-primary-600" />
            <div>
              <p className="font-medium text-gray-900">Utility Usage</p>
              <p className="text-sm text-gray-500">Check your consumption</p>
            </div>
          </Link>

          <Link
            to="/maintenance"
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Wrench className="h-6 w-6 text-primary-600" />
            <div>
              <p className="font-medium text-gray-900">Report Issue</p>
              <p className="text-sm text-gray-500">Submit maintenance request</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity (if admin/director) */}
      {(user?.role === 'DIRECTOR' || user?.role === 'MANAGER') && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Estate Overview
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-sm text-gray-600">Total Properties</span>
              <Link to="/properties" className="text-sm font-medium text-primary-600 hover:text-primary-700">
                View All →
              </Link>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-sm text-gray-600">Registered Users</span>
              <Link to="/users" className="text-sm font-medium text-primary-600 hover:text-primary-700">
                Manage Users →
              </Link>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Active Announcements</span>
              <Link to="/announcements" className="text-sm font-medium text-primary-600 hover:text-primary-700">
                View All →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
