import React from 'react';
import { Button } from '../ui/Button';
import { User, Meeting } from '../../types';
import { Calendar, Clock, MapPin, Users, X } from 'lucide-react';

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
  participants,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-bold text-gray-900">{meeting.title}</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>

      <div className="space-y-4 mb-6">
        {meeting.description && (
          <p className="text-gray-700">{meeting.description}</p>
        )}

        <div className="flex items-start">
          <Calendar size={18} className="text-gray-500 mt-0.5 mr-2" />
          <div>
            <p className="text-gray-900 font-medium">{formatDate(meeting.startTime)}</p>
          </div>
        </div>

        <div className="flex items-start">
          <Clock size={18} className="text-gray-500 mt-0.5 mr-2" />
          <div>
            <p className="text-gray-900">
              {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
            </p>
          </div>
        </div>

        {meeting.location && (
          <div className="flex items-start">
            <MapPin size={18} className="text-gray-500 mt-0.5 mr-2" />
            <p className="text-gray-900">{meeting.location}</p>
          </div>
        )}

        <div className="flex items-start">
          <Users size={18} className="text-gray-500 mt-0.5 mr-2" />
          <div>
            <p className="text-gray-900 font-medium mb-1">Participants</p>
            <div className="space-y-2">
              {participants.length > 0 ? (
                participants.map((participant) => (
                  <div key={participant.id} className="flex items-center">
                    <div
                      className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-2"
                    >
                      {participant.avatarUrl ? (
                        <img
                          src={participant.avatarUrl}
                          alt={participant.name}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <span className="text-xs font-medium text-gray-600">
                          {participant.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <span className="text-gray-900">{participant.name}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">Loading participants...</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4 space-y-3">
        <div className="flex justify-between">
          <Button variant="outline" onClick={onEdit}>
            Edit
          </Button>
          <Button variant="outline" onClick={onDelete}>
            Delete
          </Button>
        </div>

        <div className="flex justify-between">
          <Button
            variant="success"
            onClick={() => onStatusUpdate('accepted')}
          >
            Accept
          </Button>
          <Button
            variant="outline"
            onClick={() => onStatusUpdate('rejected')}
          >
            Decline
          </Button>
        </div>
      </div>
    </div>
  );
};