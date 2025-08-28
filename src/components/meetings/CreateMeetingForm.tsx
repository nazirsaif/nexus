import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { Meeting } from '../../types';

interface CreateMeetingFormProps {
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Meeting;
}

export const CreateMeetingForm: React.FC<CreateMeetingFormProps> = ({ onClose, onSuccess, initialData }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    participants: [] as string[],
    location: '',
  });

  // Populate form with initial data when editing
  useEffect(() => {
    if (initialData) {
      const startDate = new Date(initialData.startTime);
      const endDate = new Date(initialData.endTime);
      
      setFormData({
        title: initialData.title,
        description: initialData.description || '',
        date: startDate.toISOString().split('T')[0],
        startTime: startDate.toISOString().split('T')[1].slice(0, 5),
        endTime: endDate.toISOString().split('T')[1].slice(0, 5),
        participants: initialData.participants.map(p => p.userId),
        location: initialData.location || '',
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError('');
      
      // Validate form data
      if (!formData.date || !formData.startTime || !formData.endTime) {
        setError('Please fill in all required fields including date and time.');
        return;
      }

      // Format date and time for API
      const startDateTime = new Date(`${formData.date}T${formData.startTime}:00`);
      const endDateTime = new Date(`${formData.date}T${formData.endTime}:00`);
      
      // Validate that dates are valid
      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        setError('Invalid date or time format. Please check your inputs.');
        return;
      }
      
      // Validate that end time is after start time
      if (endDateTime <= startDateTime) {
        setError('End time must be after start time.');
        return;
      }
      
      const isEditing = !!initialData;
      const url = isEditing 
        ? `http://localhost:5000/api/meetings/${initialData.id}`
        : 'http://localhost:5000/api/meetings';
      
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('business_nexus_token')}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          location: formData.location,
          participants: formData.participants,
          ...(isEditing ? {} : { organizerId: user?.id }),
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle conflict errors specifically
        if (response.status === 409) {
          const conflictMessage = errorData.conflicts 
            ? `${errorData.message}\n\nConflicting meetings:\n${errorData.conflicts.map((c: any) => `• ${c.title} (${new Date(c.startTime).toLocaleString()} - ${new Date(c.endTime).toLocaleString()})`).join('\n')}`
            : errorData.message;
          setError(conflictMessage);
          return;
        }
        
        throw new Error(errorData.message || 'Failed to create meeting');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating meeting:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (!errorMessage.includes('conflict')) {
        setError('Failed to create meeting. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-h-[80vh] overflow-y-auto">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Meeting Title
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            required
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Time
            </label>
            <input
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Time
            </label>
            <input
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              required
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Office, Zoom, Google Meet, etc."
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            isLoading={isLoading}
          >
            {initialData ? 'Update Meeting' : 'Create Meeting'}
          </Button>
        </div>
      </form>
    </div>
  );
};