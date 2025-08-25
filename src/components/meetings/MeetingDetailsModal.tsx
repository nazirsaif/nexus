import React, { useState } from 'react';
import { Meeting, User } from '../../types';
import { Button } from '../ui/Button';
import { Calendar, Clock, MapPin, Video, Edit, Trash2, Check, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import moment from 'moment';

interface MeetingDetailsModalProps {
  meeting: Meeting;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusUpdate: (status: 'accepted' | 'rejected' | 'cancelled') => void;
  participants: User[];
}

export const MeetingDetailsModal: React.FC<MeetingDetailsModalProps> = ({
  meeting,
  onClose,
  onEdit,
  onDelete,
  onStatusUpdate,
  participants
}) => {
  const { user } = useAuth();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const isCreator = user?.id === meeting.createdBy;
  const isPending = meeting.status === 'pending';
  const isParticipant = !isCreator && meeting.participants.some(p => p.userId === user?.id);

  const formatDate = (dateString: string) => {
    return moment(dateString).format('dddd, MMMM D, YYYY');
  };

  const formatTime = (dateString: string) => {
    return moment(dateString).format('h:mm A');
  };

  const getStatusBadgeClass = () => {
    switch (meeting.status) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const handleDelete = async () => {
    if (isConfirmingDelete) {
      onDelete();
    } else {
      setIsConfirmingDelete(true);
    }
  };

  const handleStatusUpdate = async (status: 'accepted' | 'rejected' | 'cancelled') => {
    setIsUpdatingStatus(true);
    await onStatusUpdate(status);
    setIsUpdatingStatus(false);
  };

  return (
    <div className="bg-white rounded-lg p-6 w-full max-w-md">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-bold">{meeting.title}</h2>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass()}`}>
          {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
        </span>
      </div>

      {meeting.description && (
        <p className="text-gray-600 mb-4">{meeting.description}</p>
      )}

      <div className="space-y-3 mb-6">
        <div className="flex items-center">
          <Calendar size={16} className="text-gray-500 mr-2" />
          <span className="text-sm">{formatDate(meeting.startTime)}</span>
        </div>
        
        <div className="flex items-center">
          <Clock size={16} className="text-gray-500 mr-2" />
          <span className="text-sm">
            {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
          </span>
        </div>
        
        {meeting.location && (
          <div className="flex items-center">
            <MapPin size={16} className="text-gray-500 mr-2" />
            <span className="text-sm">{meeting.location}</span>
          </div>
        )}
        
        {meeting.meetingLink && (
          <div className="flex items-center">
            <Video size={16} className="text-gray-500 mr-2" />
            <a 
              href={meeting.meetingLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-primary-600 hover:underline"
            >
              Join Meeting
            </a>
          </div>
        )}
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Participants</h3>
        <div className="space-y-2">
          {participants.map((participant) => (
            <div key={participant.id} className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                {participant.avatarUrl ? (
                  <img 
                    src={participant.avatarUrl} 
                    alt={participant.name} 
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <span className="text-xs font-medium">
                    {participant.name.charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm font-medium">{participant.name}</p>
                <p className="text-xs text-gray-500 capitalize">{participant.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
        {isCreator ? (
          <div className="flex justify-between">
            <div>
              <Button 
                variant="outline" 
                leftIcon={<Edit size={16} />}
                onClick={onEdit}
                className="mr-2"
              >
                Edit
              </Button>
              <Button 
                variant="outline" 
                leftIcon={<Trash2 size={16} />}
                onClick={handleDelete}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                {isConfirmingDelete ? 'Confirm' : 'Cancel'}
              </Button>
            </div>
            <Button onClick={onClose}>Close</Button>
          </div>
        ) : isParticipant && isPending ? (
          <div className="flex justify-between">
            <div>
              <Button 
                variant="outline" 
                leftIcon={<Check size={16} />}
                onClick={() => handleStatusUpdate('accepted')}
                className="mr-2 text-green-600 border-green-200 hover:bg-green-50"
                disabled={isUpdatingStatus}
              >
                Accept
              </Button>
              <Button 
                variant="outline" 
                leftIcon={<X size={16} />}
                onClick={() => handleStatusUpdate('rejected')}
                className="text-red-600 border-red-200 hover:bg-red-50"
                disabled={isUpdatingStatus}
              >
                Decline
              </Button>
            </div>
            <Button onClick={onClose}>Close</Button>
          </div>
        ) : (
          <div className="flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </div>
        )}
      </div>
    </div>
  );
};