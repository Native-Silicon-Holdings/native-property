import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Phone } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="font-display text-3xl text-foreground">Profile Settings</h1>

      <div className="card">
        <h2 className="text-lg font-semibold text-foreground mb-4">Personal Information</h2>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <User className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{user?.firstName} {user?.lastName}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
          </div>
          {user?.phoneNumber && (
            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{user.phoneNumber}</p>
              </div>
            </div>
          )}
          <div className="flex items-center space-x-3">
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <p className="font-medium">
                {user?.isOrgStaff ? user?.orgRole : user?.estateRole}
                {user?.organizationName ? ` · ${user.organizationName}` : ''}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
