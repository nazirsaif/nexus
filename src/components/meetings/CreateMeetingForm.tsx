import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { User, UserRole } from '../../types';

interface CreateMeetingFormProps {
  onClose: () => void;
  onSuccess: () => void;
  preselectedUser?: User;
}

export const CreateMeetingForm: React.FC<CreateMeetingFormProps> = ({
  onClose,
  onSuccess,
  preselectedUser
}) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [isVirtual, setIsVirtual] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<User[]>(preselectedUser ? [preselectedUser] : []);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch users that the current user can schedule meetings with
    const fetchUsers = async () => {
      try {
        // Determine which type of users to fetch based on current user's role
        const userType = user?.role === 'entrepreneur' ? 'investors' : 'entrepreneurs';
        const response = await fetch(`/api/${userType}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch ${userType}`);
        }

        const data = await response.json();
        setAvailableUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Failed to load users. Please try again.');
      }
    };

    if (!preselectedUser) {
      fetchUsers();
    }
  }, [user, preselectedUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !startDate || !startTime || !endDate || !endTime || selectedUsers.length === 0) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      // Format dates for API
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${endDate}T${endTime}`);

      // Create participants array
      const participants = [
        {
          userId: user?.id,
          userType: user?.role as UserRole
        },
        ...selectedUsers.map(selectedUser => ({
          userId: selectedUser.id,
          userType: selectedUser.role as UserRole
        }))
      ];

      const meetingData = {
        title,
        description,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        participants,
        location: isVirtual ? undefined : location,
        meetingLink: isVirtual ? meetingLink : undefined,
        createdBy: user?.id,
        status: 'pending'
      };

      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(meetingData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create meeting');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creating meeting:', error);
      setError(error.message || 'Failed to create meeting. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedUserId = e.target.value;
    if (selectedUserId === '') return;
    
    const selectedUser = availableUsers.find(user => user.id === selectedUserId);
    if (selectedUser && !selectedUsers.some(user => user.id === selectedUserId)) {
      setSelectedUsers([...selectedUsers, selectedUser]);
    }
  };

  const removeSelectedUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(user => user.id !== userId));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Meeting Title *
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          required
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
            Start Date *
          </label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>
        <div>
          <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
            Start Time *
          </label>
          <input
            type="time"
            id="startTime"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
            End Date *
          </label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>
        <div>
          <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
            End Time *
          </label>
          <input
            type="time"
            id="endTime"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>
      </div>

      <div>
        <div className="flex items-center mb-2">
          <input
            type="checkbox"
            id="isVirtual"
            checked={isVirtual}
            onChange={(e) => setIsVirtual(e.target.checked)}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor="isVirtual" className="ml-2 block text-sm text-gray-700">
            Virtual Meeting
          </label>
        </div>

        {isVirtual ? (
          <div>
            <label htmlFor="meetingLink" className="block text-sm font-medium text-gray-700 mb-1">
              Meeting Link *
            </label>
            <input
              type="text"
              id="meetingLink"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              required={isVirtual}
            />
          </div>
        ) : (
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Location *
            </label>
            <input
              type="text"
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              required={!isVirtual}
            />
          </div>
        )}
      </div>

      {!preselectedUser && (
        <div>
          <label htmlFor="participants" className="block text-sm font-medium text-gray-700 mb-1">
            Add Participants *
          </label>
          <select
            id="participants"
            onChange={handleUserSelect}
            value=""
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select a participant</option>
            {availableUsers.map((availableUser) => (
              <option key={availableUser.id} value={availableUser.id}>
                {availableUser.name} ({availableUser.role})
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedUsers.length > 0 && (
        <div className="mt-2">
          <p className="text-sm font-medium text-gray-700 mb-1">Selected Participants:</p>
          <div className="flex flex-wrap gap-2">
            {selectedUsers.map((selectedUser) => (
              <div 
                key={selectedUser.id} 
                className="bg-gray-100 px-3 py-1 rounded-full flex items-center text-sm"
              >
                <span>{selectedUser.name}</span>
                <button 
                  type="button" 
                  onClick={() => removeSelectedUser(selectedUser.id)}
                  className="ml-2 text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Schedule Meeting'}
        </Button>
      </div>
    </form>
  );
};