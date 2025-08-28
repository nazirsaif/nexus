import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';

interface CreateVideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCallCreated: (roomId: string) => void;
}

export const CreateVideoCallModal: React.FC<CreateVideoCallModalProps> = ({
  isOpen,
  onClose,
  onCallCreated
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduledTime: '',
    maxParticipants: 10,
    isPublic: false,
    allowChat: true,
    allowScreenShare: true,
    muteOnJoin: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('business_nexus_token');
      const response = await fetch('http://localhost:5000/api/video-calls', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          scheduledTime: formData.scheduledTime || undefined,
          settings: {
            allowChat: formData.allowChat,
            allowScreenShare: formData.allowScreenShare,
            muteOnJoin: formData.muteOnJoin
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create video call');
      }

      const data = await response.json();
      onCallCreated(data.videoCall.roomId);
      onClose();
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        scheduledTime: '',
        maxParticipants: 10,
        isPublic: false,
        allowChat: true,
        allowScreenShare: true,
        muteOnJoin: false
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create video call');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Create Video Call</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Call Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter call title"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional description"
            />
          </div>

          {/* Scheduled Time */}
          <div>
            <label htmlFor="scheduledTime" className="block text-sm font-medium text-gray-700 mb-1">
              Scheduled Time (Optional)
            </label>
            <input
              type="datetime-local"
              id="scheduledTime"
              name="scheduledTime"
              value={formData.scheduledTime}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Max Participants */}
          <div>
            <label htmlFor="maxParticipants" className="block text-sm font-medium text-gray-700 mb-1">
              Max Participants
            </label>
            <select
              id="maxParticipants"
              name="maxParticipants"
              value={formData.maxParticipants}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={2}>2 participants</option>
              <option value={4}>4 participants</option>
              <option value={6}>6 participants</option>
              <option value={8}>8 participants</option>
              <option value={10}>10 participants</option>
              <option value={15}>15 participants</option>
              <option value={20}>20 participants</option>
            </select>
          </div>

          {/* Settings */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Call Settings</h3>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPublic"
                name="isPublic"
                checked={formData.isPublic}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700">
                Public call (anyone with link can join)
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="allowChat"
                name="allowChat"
                checked={formData.allowChat}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="allowChat" className="ml-2 block text-sm text-gray-700">
                Allow chat during call
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="allowScreenShare"
                name="allowScreenShare"
                checked={formData.allowScreenShare}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="allowScreenShare" className="ml-2 block text-sm text-gray-700">
                Allow screen sharing
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="muteOnJoin"
                name="muteOnJoin"
                checked={formData.muteOnJoin}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="muteOnJoin" className="ml-2 block text-sm text-gray-700">
                Mute participants on join
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Call'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};