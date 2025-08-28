import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';

interface VideoCall {
  _id: string;
  roomId: string;
  title: string;
  description?: string;
  organizer: {
    _id: string;
    name: string;
    email: string;
  };
  participants: Array<{
    _id: string;
    name: string;
    email: string;
    joinedAt?: Date;
  }>;
  scheduledTime?: Date;
  startTime?: Date;
  endTime?: Date;
  status: 'scheduled' | 'active' | 'ended';
  maxParticipants: number;
  isPublic: boolean;
  settings: {
    allowChat: boolean;
    allowScreenShare: boolean;
    muteOnJoin: boolean;
  };
  createdAt: Date;
}

interface VideoCallsListProps {
  onCreateCall: () => void;
}

export const VideoCallsList: React.FC<VideoCallsListProps> = ({ onCreateCall }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [calls, setCalls] = useState<VideoCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCalls();
  }, []);

  const fetchCalls = async () => {
    try {
      const token = localStorage.getItem('business_nexus_token');
      const response = await fetch('http://localhost:5000/api/video-calls', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch video calls');
      }

      const data = await response.json();
      setCalls(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load video calls');
    } finally {
      setLoading(false);
    }
  };

  const joinCall = (roomId: string) => {
    navigate(`/video-call/${roomId}`);
  };

  const copyCallLink = (roomId: string) => {
    const link = `${window.location.origin}/video-call/${roomId}`;
    navigator.clipboard.writeText(link).then(() => {
      // You could add a toast notification here
      alert('Call link copied to clipboard!');
    });
  };

  const deleteCall = async (roomId: string) => {
    if (!confirm('Are you sure you want to delete this call?')) return;

    try {
      const token = localStorage.getItem('business_nexus_token');
      const response = await fetch(`http://localhost:5000/api/video-calls/${roomId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete call');
      }

      setCalls(prev => prev.filter(call => call.roomId !== roomId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete call');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'ended': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Video Calls</h2>
        <Button onClick={onCreateCall} variant="primary">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Call
        </Button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Calls List */}
      {calls.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No video calls yet</h3>
          <p className="text-gray-600 mb-4">Create your first video call to get started</p>
          <Button onClick={onCreateCall} variant="primary">
            Create Your First Call
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {calls.map((call) => (
            <div key={call._id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{call.title}</h3>
                  {call.description && (
                    <p className="text-gray-600 text-sm mb-2">{call.description}</p>
                  )}
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Organizer: {call.organizer.name}</span>
                    <span>•</span>
                    <span>{call.participants.length}/{call.maxParticipants} participants</span>
                    {call.scheduledTime && (
                      <>
                        <span>•</span>
                        <span>Scheduled: {new Date(call.scheduledTime).toLocaleString()}</span>
                      </>
                    )}
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(call.status)}`}>
                  {call.status.charAt(0).toUpperCase() + call.status.slice(1)}
                </span>
              </div>

              {/* Call Settings */}
              <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                <div className="flex items-center space-x-1">
                  <span>Chat:</span>
                  <span className={call.settings.allowChat ? 'text-green-600' : 'text-red-600'}>
                    {call.settings.allowChat ? 'On' : 'Off'}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>Screen Share:</span>
                  <span className={call.settings.allowScreenShare ? 'text-green-600' : 'text-red-600'}>
                    {call.settings.allowScreenShare ? 'On' : 'Off'}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>Public:</span>
                  <span className={call.isPublic ? 'text-green-600' : 'text-red-600'}>
                    {call.isPublic ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                {call.status !== 'ended' && (
                  <Button
                    onClick={() => joinCall(call.roomId)}
                    variant="primary"
                    size="sm"
                  >
                    Join Call
                  </Button>
                )}
                
                <Button
                  onClick={() => copyCallLink(call.roomId)}
                  variant="secondary"
                  size="sm"
                >
                  Copy Link
                </Button>

                {call.organizer._id === user?.id && (
                  <Button
                    onClick={() => deleteCall(call.roomId)}
                    variant="secondary"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};