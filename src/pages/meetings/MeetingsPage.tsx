import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useAuth } from '../../context/AuthContext';
import { Meeting, User } from '../../types';
import { Button } from '../../components/ui/Button';
import { Plus, Calendar as CalendarIcon, AlertCircle } from 'lucide-react';
import { CreateMeetingForm } from '../../components/meetings/CreateMeetingForm';
import { MeetingDetailsModal } from '../../components/meetings/MeetingDetailsModal';

// Setup the localizer for the calendar
const localizer = momentLocalizer(moment);

export const MeetingsPage: React.FC = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [participants, setParticipants] = useState<User[]>([]);
  const [error, setError] = useState('');

  const fetchMeetings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:5000/api/meetings', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('business_nexus_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch meetings');
      }

      const data = await response.json();
      setMeetings(data);
    } catch (error) {
      console.error('Error fetching meetings:', error);
      setError('Failed to load meetings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  // Transform meetings data for the calendar
  const calendarEvents = meetings.map(meeting => ({
    id: meeting.id,
    title: meeting.title,
    start: new Date(meeting.startTime),
    end: new Date(meeting.endTime),
    resource: meeting,
  }));

  // Handle event selection
  const handleSelectEvent = async (event: any) => {
    const meeting = event.resource;
    setSelectedMeeting(meeting);
    
    try {
      // Fetch participant details
      const participantIds = meeting.participants.map((p: any) => p.userId);
      const participantPromises = participantIds.map((id: string) => 
        fetch(`http://localhost:5000/api/users/${id}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('business_nexus_token')}`,
          },
        }).then(res => res.json())
      );
      
      const participantData = await Promise.all(participantPromises);
      setParticipants(participantData);
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  };

  const handleCreateMeetingSuccess = () => {
    fetchMeetings();
  };

  const handleDeleteMeeting = async () => {
    if (!selectedMeeting) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/meetings/${selectedMeeting.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('business_nexus_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete meeting');
      }

      setSelectedMeeting(null);
      fetchMeetings();
    } catch (error) {
      console.error('Error deleting meeting:', error);
      setError('Failed to delete meeting. Please try again.');
    }
  };

  const handleUpdateMeetingStatus = async (status: 'accepted' | 'rejected' | 'cancelled') => {
    if (!selectedMeeting) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/meetings/${selectedMeeting.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('business_nexus_token')}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update meeting status');
      }

      setSelectedMeeting(null);
      fetchMeetings();
    } catch (error) {
      console.error('Error updating meeting status:', error);
      setError('Failed to update meeting status. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
          <p className="text-gray-600 mt-1">Schedule and manage your meetings</p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          leftIcon={<Plus size={16} />}
        >
          Schedule Meeting
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start">
          <AlertCircle size={16} className="mr-2 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="h-[600px]">
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              onSelectEvent={handleSelectEvent}
              views={['month', 'week', 'day', 'agenda']}
              defaultView="month"
              defaultDate={new Date()}
              className="rounded-md"
            />
          </div>
        </div>
      )}

      {/* Create Meeting Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Schedule New Meeting</h2>
            <CreateMeetingForm 
              onClose={() => setShowCreateModal(false)}
              onSuccess={handleCreateMeetingSuccess}
            />
          </div>
        </div>
      )}

      {/* Meeting Details Modal */}
      {selectedMeeting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="max-h-[80vh] overflow-y-auto">
            <MeetingDetailsModal 
              meeting={selectedMeeting}
              onClose={() => setSelectedMeeting(null)}
              onEdit={() => console.log('Edit meeting')} // To be implemented
              onDelete={handleDeleteMeeting}
              onStatusUpdate={handleUpdateMeetingStatus}
              participants={participants}
            />
          </div>
        </div>
      )}
    </div>
  );
};