import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import io, { Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface Participant {
  id: string;
  name: string;
  stream?: MediaStream;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
}

interface VideoCallContextType {
  socket: Socket | null;
  localStream: MediaStream | null;
  participants: Map<string, Participant>;
  isInCall: boolean;
  roomId: string | null;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: () => void;
  toggleAudio: () => void;
  toggleVideo: () => void;
  startLocalStream: () => Promise<void>;
  stopLocalStream: () => void;
}

const VideoCallContext = createContext<VideoCallContextType | undefined>(undefined);

interface VideoCallProviderProps {
  children: ReactNode;
}

export const VideoCallProvider: React.FC<VideoCallProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [participants, setParticipants] = useState<Map<string, Participant>>(new Map());
  const [isInCall, setIsInCall] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (user) {
      const newSocket = io('http://localhost:5000', {
        auth: {
          token: localStorage.getItem('business_nexus_token')
        }
      });
      
      setSocket(newSocket);
      
      // Socket event listeners
      newSocket.on('user-connected', handleUserConnected);
      newSocket.on('user-disconnected', handleUserDisconnected);
      newSocket.on('offer', handleOffer);
      newSocket.on('answer', handleAnswer);
      newSocket.on('ice-candidate', handleIceCandidate);
      newSocket.on('user-audio-toggled', handleUserAudioToggled);
      newSocket.on('user-video-toggled', handleUserVideoToggled);
      
      return () => {
        newSocket.disconnect();
      };
    }
  }, [user]);

  const createPeerConnection = (userId: string): RTCPeerConnection => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    // Add local stream to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      setParticipants(prev => {
        const updated = new Map(prev);
        const participant = updated.get(userId);
        if (participant) {
          participant.stream = remoteStream;
          updated.set(userId, participant);
        }
        return updated;
      });
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socket && roomId) {
        socket.emit('ice-candidate', roomId, event.candidate, userId);
      }
    };

    peerConnections.current.set(userId, peerConnection);
    return peerConnection;
  };

  const handleUserConnected = async (userId: string) => {
    console.log('User connected:', userId);
    
    setParticipants(prev => {
      const updated = new Map(prev);
      updated.set(userId, {
        id: userId,
        name: `User ${userId.slice(0, 8)}`,
        isAudioEnabled: true,
        isVideoEnabled: true
      });
      return updated;
    });

    // Create offer for new user
    if (localStreamRef.current) {
      const peerConnection = createPeerConnection(userId);
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      if (socket && roomId) {
        socket.emit('offer', roomId, offer, userId);
      }
    }
  };

  const handleUserDisconnected = (userId: string) => {
    console.log('User disconnected:', userId);
    
    setParticipants(prev => {
      const updated = new Map(prev);
      updated.delete(userId);
      return updated;
    });
    
    const peerConnection = peerConnections.current.get(userId);
    if (peerConnection) {
      peerConnection.close();
      peerConnections.current.delete(userId);
    }
  };

  const handleOffer = async (offer: RTCSessionDescriptionInit, fromUserId: string) => {
    console.log('Received offer from:', fromUserId);
    
    const peerConnection = createPeerConnection(fromUserId);
    await peerConnection.setRemoteDescription(offer);
    
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    
    if (socket && roomId) {
      socket.emit('answer', roomId, answer, fromUserId);
    }
  };

  const handleAnswer = async (answer: RTCSessionDescriptionInit, fromUserId: string) => {
    console.log('Received answer from:', fromUserId);
    
    const peerConnection = peerConnections.current.get(fromUserId);
    if (peerConnection) {
      await peerConnection.setRemoteDescription(answer);
    }
  };

  const handleIceCandidate = async (candidate: RTCIceCandidateInit, fromUserId: string) => {
    const peerConnection = peerConnections.current.get(fromUserId);
    if (peerConnection) {
      await peerConnection.addIceCandidate(candidate);
    }
  };

  const handleUserAudioToggled = (userId: string, isEnabled: boolean) => {
    setParticipants(prev => {
      const updated = new Map(prev);
      const participant = updated.get(userId);
      if (participant) {
        participant.isAudioEnabled = isEnabled;
        updated.set(userId, participant);
      }
      return updated;
    });
  };

  const handleUserVideoToggled = (userId: string, isEnabled: boolean) => {
    setParticipants(prev => {
      const updated = new Map(prev);
      const participant = updated.get(userId);
      if (participant) {
        participant.isVideoEnabled = isEnabled;
        updated.set(userId, participant);
      }
      return updated;
    });
  };

  const startLocalStream = async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      setLocalStream(stream);
      localStreamRef.current = stream;
      
      // Update track enabled states
      stream.getAudioTracks().forEach(track => {
        track.enabled = isAudioEnabled;
      });
      stream.getVideoTracks().forEach(track => {
        track.enabled = isVideoEnabled;
      });
      
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  };

  const stopLocalStream = (): void => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      setLocalStream(null);
      localStreamRef.current = null;
    }
  };

  const joinRoom = async (newRoomId: string): Promise<void> => {
    try {
      await startLocalStream();
      
      if (socket && user) {
        socket.emit('join-room', newRoomId, user.id);
        setRoomId(newRoomId);
        setIsInCall(true);
      }
    } catch (error) {
      console.error('Error joining room:', error);
      throw error;
    }
  };

  const leaveRoom = (): void => {
    if (socket && roomId && user) {
      socket.emit('leave-room', roomId, user.id);
    }
    
    // Close all peer connections
    peerConnections.current.forEach(pc => pc.close());
    peerConnections.current.clear();
    
    // Stop local stream
    stopLocalStream();
    
    // Reset state
    setParticipants(new Map());
    setIsInCall(false);
    setRoomId(null);
  };

  const toggleAudio = (): void => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      const newState = !isAudioEnabled;
      
      audioTracks.forEach(track => {
        track.enabled = newState;
      });
      
      setIsAudioEnabled(newState);
      
      if (socket && roomId && user) {
        socket.emit('toggle-audio', roomId, user.id, newState);
      }
    }
  };

  const toggleVideo = (): void => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      const newState = !isVideoEnabled;
      
      videoTracks.forEach(track => {
        track.enabled = newState;
      });
      
      setIsVideoEnabled(newState);
      
      if (socket && roomId && user) {
        socket.emit('toggle-video', roomId, user.id, newState);
      }
    }
  };

  const value: VideoCallContextType = {
    socket,
    localStream,
    participants,
    isInCall,
    roomId,
    isAudioEnabled,
    isVideoEnabled,
    joinRoom,
    leaveRoom,
    toggleAudio,
    toggleVideo,
    startLocalStream,
    stopLocalStream
  };

  return (
    <VideoCallContext.Provider value={value}>
      {children}
    </VideoCallContext.Provider>
  );
};

export const useVideoCall = (): VideoCallContextType => {
  const context = useContext(VideoCallContext);
  if (!context) {
    throw new Error('useVideoCall must be used within a VideoCallProvider');
  }
  return context;
};