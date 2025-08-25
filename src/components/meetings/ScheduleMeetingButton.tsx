import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Calendar } from 'lucide-react';
import { User } from '../../types';
import { CreateMeetingForm } from './CreateMeetingForm';

interface ScheduleMeetingButtonProps {
  user: User;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ScheduleMeetingButton: React.FC<ScheduleMeetingButtonProps> = ({
  user,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const [showModal, setShowModal] = useState(false);

  const handleSuccess = () => {
    setShowModal(false);
    // Could add a toast notification here
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        leftIcon={<Calendar size={size === 'sm' ? 14 : 16} />}
        onClick={() => setShowModal(true)}
      >
        Schedule Meeting
      </Button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Schedule Meeting with {user.name}</h2>
            <CreateMeetingForm
              onClose={() => setShowModal(false)}
              onSuccess={handleSuccess}
              preselectedUser={user}
            />
          </div>
        </div>
      )}
    </>
  );
};