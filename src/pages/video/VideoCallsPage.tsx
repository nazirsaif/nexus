import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VideoCallsList } from '../../components/video/VideoCallsList';
import { CreateVideoCallModal } from '../../components/video/CreateVideoCallModal';

export const VideoCallsPage: React.FC = () => {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleCallCreated = (roomId: string) => {
    // Navigate to the newly created call
    navigate(`/video-call/${roomId}`);
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <VideoCallsList onCreateCall={() => setIsCreateModalOpen(true)} />
        
        <CreateVideoCallModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCallCreated={handleCallCreated}
        />
      </div>
    </div>
  );
};