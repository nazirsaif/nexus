import React, { useState, useEffect } from 'react';
import { Send, DollarSign, X, Search, User as UserIcon, AlertTriangle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardBody } from '../ui/Card';
import { API_URL } from '../../config/api';

import { useAuth } from '../../context/AuthContext';
import { User } from '../../types';

interface SearchUser {
  id: string;
  name: string;
  email: string;
  userType: 'entrepreneur' | 'investor';
  avatarUrl?: string;
}

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<SearchUser | null>(null);
  const [description, setDescription] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableBalance] = useState(2500.00); // Mock balance

  const searchUsers = async (email: string) => {
    if (!email || email.length < 3) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const token = localStorage.getItem('business_nexus_token');
      const response = await fetch(`${API_URL}/users/search?email=${encodeURIComponent(email)}`, {
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {}
      });
      
      if (response.ok) {
        const data = await response.json();
        // Filter out current user - data is the users array directly
        const filteredUsers = data.filter((u: SearchUser) => u.id !== user?.id);

        setSearchResults(filteredUsers);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(recipientEmail);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [recipientEmail]);

  const handleRecipientSelect = (recipient: SearchUser) => {
    setSelectedRecipient(recipient);
    setRecipientEmail(recipient.email);
    setSearchResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (parseFloat(amount) < 1) {
      setError('Minimum transfer amount is $1');
      return;
    }

    if (parseFloat(amount) > availableBalance) {
      setError('Insufficient balance');
      return;
    }

    if (!selectedRecipient) {
      setError('Please select a valid recipient');
      return;
    }

    if (selectedRecipient.id === user?.id) {
      setError('You cannot transfer money to yourself');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('business_nexus_token');
      console.log('🔍 [TransferModal] Starting transfer request...');
      console.log('🔍 [TransferModal] Token exists:', !!token);
      console.log('🔍 [TransferModal] Request URL:', `${API_URL}/payments/transfer`);
      
      const response = await fetch(`${API_URL}/payments/transfer`, {
        method: 'POST',
        headers: token ? {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        } : {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          recipientId: selectedRecipient.id,
          description: description || `Transfer to ${selectedRecipient.name}`
        })
      });
      
      console.log('🔍 [TransferModal] Response status:', response.status);
      console.log('🔍 [TransferModal] Response ok:', response.ok);

      const data = await response.json();
      console.log('🔍 [TransferModal] Response data:', data);

      if (response.ok) {
        onSuccess();
        onClose();
        resetForm();
        setLoading(false);
      } else {
        setError(data.message || 'Transfer failed');
        setLoading(false);
      }
    } catch (error) {
      console.error('❌ [TransferModal] Network error:', error);
      console.error('❌ [TransferModal] Error details:', {
        name: error instanceof Error ? error.name : 'Unknown Error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        stack: error instanceof Error ? error.stack : undefined
      });
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setRecipientEmail('');
    setSelectedRecipient(null);
    setDescription('');
    setSearchResults([]);
    setError('');
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  const transferFee = parseFloat(amount) > 0 ? Math.max(1.00, parseFloat(amount) * 0.005) : 0;
  const totalAmount = parseFloat(amount) + transferFee;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
              <Send size={20} className="text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Transfer Money</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={loading}
          >
            <X size={20} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Available Balance */}
          <Card className="bg-blue-50">
            <CardBody className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">Available Balance</span>
                <span className="text-lg font-bold text-blue-600">${availableBalance.toLocaleString()}</span>
              </div>
            </CardBody>
          </Card>

          {/* Recipient Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipient Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <Input
                type="email"
                value={recipientEmail}
                onChange={(e) => {
                  setRecipientEmail(e.target.value);
                  if (selectedRecipient && e.target.value !== selectedRecipient.email) {
                    setSelectedRecipient(null);
                  }
                }}
                placeholder="Enter recipient's email"
                className="pl-10"
                disabled={loading}
                required
              />
              {searching && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleRecipientSelect(user)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full">
                      <UserIcon size={16} className="text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <p className="text-xs text-gray-400 capitalize">{user.userType}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Selected Recipient */}
            {selectedRecipient && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-green-200 rounded-full">
                    <UserIcon size={16} className="text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-green-900">{selectedRecipient.name}</p>
                    <p className="text-sm text-green-700">{selectedRecipient.email}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Transfer Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transfer Amount
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="1"
                max={availableBalance}
                step="0.01"
                className="pl-8"
                disabled={loading}
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Minimum: $1.00 • Maximum: ${availableBalance.toLocaleString()}
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <Input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this transfer for?"
              disabled={loading}
              maxLength={100}
            />
          </div>

          {/* Fee Breakdown */}
          {parseFloat(amount) > 0 && (
            <Card className="bg-gray-50">
              <CardBody className="p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Transfer Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transfer Amount:</span>
                    <span className="text-gray-900 font-medium">${parseFloat(amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transfer Fee (0.5%):</span>
                    <span className="text-gray-900 font-medium">${transferFee.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-1 mt-2">
                    <div className="flex justify-between font-semibold">
                      <span className="text-gray-900">Total Deducted:</span>
                      <span className="text-gray-900">${totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading || !amount || !selectedRecipient || parseFloat(amount) <= 0}
              className="flex-1"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                `Transfer $${amount || '0.00'}`
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};