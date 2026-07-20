import { useAuth } from '../../contexts/AuthContext';
import { useEstate } from '../../contexts/EstateContext';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  FileText,
  Megaphone,
  Calendar,
  Wrench,
  TrendingUp,
  DollarSign,
  Building2,
  MapPin,
} from 'lucide-react';
import { announcementApi, meetingApi, maintenanceApi } from '../../services/api';

const EstateHome = () => {
  const { user } = useAuth();
  const { activeEstate } = useEstate();
  const { estateSlug } = useParams<{ estateSlug: string }>();
  const [stats, setStats] = useState({
    announcements: 0,
    upcomingMeetings: 0,
    maintenanceRequests: 0,
    outstandingBalance: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEstateData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEstate?.id]);

  const fetchEstateData = async () => {
    try {
      const estateId = activeEstate?.id;
      const [announcementsRes, meetingsRes, maintenanceRes] = await Promise.all([
        announcementApi.getAll({ estateId, limit: 5 }),
        meetingApi.getAll({ estateId, status: 'SCHEDULED', limit: 5 }),
        maintenanceApi.getAll({ estateId, limit: 5 }),
      ]);

      setStats({
        announcements: announcementsRes.data?.length || 0,
        upcomingMeetings: meetingsRes.data?.length || 0,
        maintenanceRequests: maintenanceRes.data?.length || 0,
        outstandingBalance: 0, // Calculate from payments
      });
    } catch (error) {
      console.error('Error fetching estate home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, link }: any) => (
    <Link to={link} className="card hover:shadow-lg transition-shadow duration-300 ease-estate">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold text-foreground mt-1">{value}</p>
        </div>
        <div className="p-3 rounded-full bg-accent/15">
          <Icon className="h-6 w-6 text-accent" />
        </div>
      </div>
    </Link>
  );

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div className="card">
        <p className="text-sm text-muted-foreground uppercase tracking-wide">Welcome back</p>
        <h1 className="font-display text-4xl text-foreground mt-1">
          {user?.firstName}, here's {activeEstate?.name || 'your estate'} today
        </h1>
        {activeEstate?.address && (
          <div className="mt-4 flex items-center space-x-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{activeEstate.address}</span>
          </div>
        )}
      </div>

      {/* Statistics grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Announcements"
          value={loading ? '...' : stats.announcements}
          icon={Megaphone}
          link={`/e/${estateSlug}/announcements`}
        />
        <StatCard
          title="Upcoming Meetings"
          value={loading ? '...' : stats.upcomingMeetings}
          icon={Calendar}
          link={`/e/${estateSlug}/meetings`}
        />
        <StatCard
          title="Maintenance Requests"
          value={loading ? '...' : stats.maintenanceRequests}
          icon={Wrench}
          link={`/e/${estateSlug}/maintenance`}
        />
        <StatCard
          title="Outstanding Balance"
          value={loading ? '...' : `R ${stats.outstandingBalance.toFixed(2)}`}
          icon={DollarSign}
          link={`/e/${estateSlug}/utilities`}
        />
      </div>

      {/* Quick actions */}
      <div className="card">
        <h2 className="font-display text-xl text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to={`/e/${estateSlug}/documents`}
            className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:bg-accent/5 transition-colors"
          >
            <FileText className="h-6 w-6 text-accent" />
            <div>
              <p className="font-medium text-foreground">View Documents</p>
              <p className="text-sm text-muted-foreground">Access meeting minutes & reports</p>
            </div>
          </Link>

          <Link
            to={`/e/${estateSlug}/utilities`}
            className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:bg-accent/5 transition-colors"
          >
            <TrendingUp className="h-6 w-6 text-accent" />
            <div>
              <p className="font-medium text-foreground">Utility Usage</p>
              <p className="text-sm text-muted-foreground">Check your consumption</p>
            </div>
          </Link>

          <Link
            to={`/e/${estateSlug}/maintenance`}
            className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:bg-accent/5 transition-colors"
          >
            <Wrench className="h-6 w-6 text-accent" />
            <div>
              <p className="font-medium text-foreground">Report Issue</p>
              <p className="text-sm text-muted-foreground">Submit maintenance request</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Estate overview (staff / director only) */}
      {(user?.isOrgStaff || user?.estateRole === 'DIRECTOR') && (
        <div className="card">
          <h2 className="font-display text-xl text-foreground mb-4">Estate Overview</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Total Units
              </span>
              <Link to={`/e/${estateSlug}/units`} className="text-sm font-medium text-accent hover:opacity-80">
                View All →
              </Link>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Registered Users</span>
              <Link to={`/e/${estateSlug}/users`} className="text-sm font-medium text-accent hover:opacity-80">
                Manage Users →
              </Link>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">Active Announcements</span>
              <Link to={`/e/${estateSlug}/announcements`} className="text-sm font-medium text-accent hover:opacity-80">
                View All →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EstateHome;
