import React from 'react';
import UserCard from './UserCard';
import { UserData } from '../types';

// Sample data for demonstration
const sampleUsers: UserData[] = [
  {
    fullName: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    slackUsername: 'sarah.j',
    profileImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    jobTitle: 'Senior Product Manager',
    organizationUnit: 'Product Team',
    manager: 'Alex Thompson',
    office: 'San Francisco, CA',
    startDate: '2022-03-15'
  },
  {
    fullName: 'Michael Chen',
    email: 'michael.chen@company.com',
    slackUsername: 'mchen',
    profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    jobTitle: 'Engineering Director',
    organizationUnit: 'Engineering',
    manager: 'Alex Thompson',
    office: 'Seattle, WA',
    startDate: '2021-08-01'
  },
  {
    fullName: 'Emily Rodriguez',
    email: 'emily.rodriguez@company.com',
    slackUsername: 'emily.r',
    profileImage: '',
    jobTitle: 'UX Designer',
    organizationUnit: 'Design Team',
    manager: 'Sarah Johnson',
    office: 'New York, NY',
    startDate: '2023-01-10'
  },
  {
    fullName: 'David Kim',
    email: 'david.kim@company.com',
    slackUsername: 'davidk',
    profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    jobTitle: 'Data Scientist',
    organizationUnit: 'Analytics',
    manager: 'Michael Chen',
    office: 'Austin, TX',
    startDate: '2022-11-20'
  }
];

const UserCardDemo: React.FC = () => {
  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Modern User Cards</h2>
          <p className="text-muted-foreground">Gradient header, overlapping avatar, and subtle micro-interactions.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sampleUsers.map((user, index) => (
            <UserCard key={index} user={user} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserCardDemo;
