import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { VideoCall } from './VideoCall';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';

interface VideoCallData {
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
}

export const VideoCallRoom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [callData, setCallData] = useState<VideoCallData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasJoined, setHasJoined] = useState(false);

  useEffect(() => {
    if (!roomId) {
      setError('Invalid room ID');
      setLoading(false);
      return;
    }

    fetchCallData();
  }, [roomId]);

  const fetchCallData = async () => {
    try {
      const token = localStorage.getItem('business_nexus_token');
      const response = await fetch(`http://localhost:5000/api/video-calls/${roomId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch call data');
      }

      const data = await response.json();
      setCallData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load call data');
    } finally {
      setLoading(false);
    }
  };

  const joinCall = async () => {
    if (!callData || !user) return;

    try {
      const token = localStorage.getItem('business_nexus_token');
      const response = await fetch(`http://localhost:5000/api/video-calls/${roomId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to join call');
      }

      setHasJoined(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join call');
    }
  };

  const leaveCall = async () => {
    if (!callData || !user) return;

    try {
      const token = localStorage.getItem('business_nexus_token');
      await fetch(`http://localhost:5000/api/video-calls/${roomId}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setHasJoined(false);
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to leave call:', err);
      // Still navigate away even if the API call fails
      navigate('/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Loading call...</p>
        </div>
      </div>
    );
  }

  if (error || !callData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <h3 className="font-bold">Error</h3>
            <p>{error || 'Call not found'}</p>
          </div>
          <Button onClick={() => navigate('/dashboard')} variant="primary">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!hasJoined) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{callData.title}</h1>
            {callData.description && (
              <p className="text-gray-600 mb-4">{callData.description}</p>
            )}
            <div className="text-sm text-gray-500 space-y-1">
              <p><strong>Organizer:</strong> {callData.organizer.name}</p>
              <p><strong>Participants:</strong> {callData.participants.length}/{callData.maxParticipants}</p>
              {callData.scheduledTime && (
                <p><strong>Scheduled:</strong> {new Date(callData.scheduledTime).toLocaleString()}</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {callData.status === 'ended' ? (
              <div className="text-center">
                <p className="text-red-600 mb-4">This call has ended.</p>
                <Button onClick={() => navigate('/dashboard')} variant="secondary" className="w-full">
                  Back to Dashboard
                </Button>
              </div>
            ) : callData.participants.length >= callData.maxParticipants ? (
              <div className="text-center">
                <p className="text-yellow-600 mb-4">This call is full.</p>
                <Button onClick={() => navigate('/dashboard')} variant="secondary" className="w-full">
                  Back to Dashboard
                </Button>
              </div>
            ) : (
              <>
                <Button onClick={joinCall} variant="primary" className="w-full">
                  Join Call
                </Button>
                <Button onClick={() => navigate('/dashboard')} variant="secondary" className="w-full">
                  Cancel
                </Button>
              </>
            )}
          </div>

          {/* Call Settings Info */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Call Settings</h3>
            <div className="text-xs text-gray-600 space-y-1">
              <div className="flex justify-between">
                <span>Chat:</span>
                <span>{callData.settings.allowChat ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div className="flex justify-between">
                <span>Screen Share:</span>
                <span>{callData.settings.allowScreenShare ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div className="flex justify-between">
                <span>Mute on Join:</span>
                <span>{callData.settings.muteOnJoin ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900">
      <VideoCall roomId={roomId!} onLeave={leaveCall} />
    </div>
  );
};