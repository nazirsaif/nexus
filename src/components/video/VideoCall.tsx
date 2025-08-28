import React, { useEffect, useRef, useState } from 'react';
import { useVideoCall } from '../../context/VideoCallContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { VideoCallControls } from './VideoCallControls';
import { ParticipantGrid } from './ParticipantGrid';

interface VideoCallProps {
  roomId: string;
  onLeave: () => void;
}

export const VideoCall: React.FC<VideoCallProps> = ({ roomId, onLeave }) => {
  const { user } = useAuth();
  const {
    localStream,
    participants,
    isInCall,
    joinRoom,
    leaveRoom,
    isAudioEnabled,
    isVideoEnabled,
    toggleAudio,
    toggleVideo
  } = useVideoCall();
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string>('');

  // Set up local video stream
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Auto-join room when component mounts
  useEffect(() => {
    if (roomId && !isInCall && !isJoining) {
      handleJoinRoom();
    }
  }, [roomId]);

  const handleJoinRoom = async () => {
    try {
      setIsJoining(true);
      setError('');
      await joinRoom(roomId);
    } catch (error) {
      console.error('Failed to join room:', error);
      setError('Failed to join video call. Please check your camera and microphone permissions.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveRoom = () => {
    leaveRoom();
    onLeave();
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-gray-100 rounded-lg">
        <div className="text-red-600 mb-4 text-center">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-lg font-semibold">Connection Error</p>
          <p className="text-sm">{error}</p>
        </div>
        <div className="space-x-2">
          <Button onClick={handleJoinRoom} disabled={isJoining}>
            {isJoining ? 'Retrying...' : 'Try Again'}
          </Button>
          <Button variant="outline" onClick={onLeave}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (isJoining) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-gray-100 rounded-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Joining video call...</p>
        <p className="text-sm text-gray-500 mt-2">Please allow camera and microphone access</p>
      </div>
    );
  }

  if (!isInCall) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-gray-100 rounded-lg">
        <div className="text-center mb-6">
          <svg className="w-16 h-16 mx-auto mb-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Ready to Join Video Call</h3>
          <p className="text-gray-600">Room ID: {roomId}</p>
        </div>
        <div className="space-x-2">
          <Button onClick={handleJoinRoom} disabled={isJoining}>
            {isJoining ? 'Joining...' : 'Join Call'}
          </Button>
          <Button variant="outline" onClick={onLeave}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-white font-medium">Video Call - Room {roomId}</span>
          <span className="text-gray-300 text-sm">({participants.size + 1} participants)</span>
        </div>
        <Button 
          variant="outline" 
          onClick={handleLeaveRoom}
          className="text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
        >
          Leave Call
        </Button>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-4">
        <div className="h-full grid gap-4" style={{
          gridTemplateColumns: participants.size === 0 ? '1fr' : 
                              participants.size === 1 ? '1fr 1fr' :
                              participants.size <= 4 ? 'repeat(2, 1fr)' :
                              'repeat(3, 1fr)',
          gridTemplateRows: participants.size <= 2 ? '1fr' :
                           participants.size <= 4 ? 'repeat(2, 1fr)' :
                           'repeat(3, 1fr)'
        }}>
          {/* Local Video */}
          <div className="relative bg-gray-800 rounded-lg overflow-hidden">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
              You {!isVideoEnabled && '(Video Off)'}
            </div>
            {!isVideoEnabled && (
              <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white text-xl font-semibold">
                      {user?.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <p className="text-white text-sm">Camera Off</p>
                </div>
              </div>
            )}
            {!isAudioEnabled && (
              <div className="absolute top-2 right-2 bg-red-500 rounded-full p-1">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>

          {/* Remote Participants */}
          <ParticipantGrid participants={Array.from(participants.values())} />
        </div>
      </div>

      {/* Controls */}
      <VideoCallControls
        isAudioEnabled={isAudioEnabled}
        isVideoEnabled={isVideoEnabled}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onLeaveCall={handleLeaveRoom}
      />
    </div>
  );
};