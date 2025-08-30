import React, { useState } from 'react';
import { ArrowUpCircle, DollarSign, X, AlertTriangle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select, SelectOption } from '../ui/Select';
import { Card, CardBody } from '../ui/Card';
import { useAuth } from '../../context/AuthContext';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('bank_transfer');
  const [accountDetails, setAccountDetails] = useState({
    accountNumber: '',
    routingNumber: '',
    accountHolderName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableBalance] = useState(2500.00); // Mock balance

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (parseFloat(amount) < 10) {
      setError('Minimum withdrawal amount is $10');
      return;
    }

    if (parseFloat(amount) > availableBalance) {
      setError('Insufficient balance');
      return;
    }

    if (withdrawMethod === 'bank_transfer') {
      if (!accountDetails.accountNumber || !accountDetails.routingNumber || !accountDetails.accountHolderName) {
        setError('Please fill in all bank account details');
        return;
      }
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('business_nexus_token');
      const response = await fetch('/api/payments/withdraw', {
        method: 'POST',
        headers: token ? {
          'Content-Type': 'application/json',
          'x-auth-token': token
        } : {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          withdrawMethod,
          accountDetails: withdrawMethod === 'bank_transfer' ? accountDetails : undefined,
          description: `Withdrawal of $${amount} via ${withdrawMethod}`
        })
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
        onClose();
        setAmount('');
        setAccountDetails({ accountNumber: '', routingNumber: '', accountHolderName: '' });
        setLoading(false);
      } else {
        setError(data.message || 'Withdrawal failed');
        setLoading(false);
      }
    } catch (error) {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setAmount('');
      setAccountDetails({ accountNumber: '', routingNumber: '', accountHolderName: '' });
      setError('');
      onClose();
    }
  };

  const withdrawalFee = parseFloat(amount) > 0 ? Math.max(2.50, parseFloat(amount) * 0.01) : 0;
  const netAmount = parseFloat(amount) - withdrawalFee;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full">
              <ArrowUpCircle size={20} className="text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Withdraw Funds</h2>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Withdrawal Amount
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
                min="10"
                max={availableBalance}
                step="0.01"
                className="pl-8"
                disabled={loading}
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Minimum: $10.00 • Maximum: ${availableBalance.toLocaleString()}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Withdrawal Method
            </label>
            <Select
              value={withdrawMethod}
              onChange={(value) => setWithdrawMethod(value)}
              disabled={loading}
            >
              <SelectOption value="bank_transfer">Bank Transfer</SelectOption>
              <SelectOption value="paypal">PayPal</SelectOption>
            </Select>
          </div>

          {/* Bank Account Details */}
          {withdrawMethod === 'bank_transfer' && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">Bank Account Details</h4>
              
              <Input
                type="text"
                value={accountDetails.accountHolderName}
                onChange={(e) => setAccountDetails(prev => ({ ...prev, accountHolderName: e.target.value }))}
                placeholder="Account Holder Name"
                disabled={loading}
                required
              />
              
              <Input
                type="text"
                value={accountDetails.accountNumber}
                onChange={(e) => setAccountDetails(prev => ({ ...prev, accountNumber: e.target.value }))}
                placeholder="Account Number"
                disabled={loading}
                required
              />
              
              <Input
                type="text"
                value={accountDetails.routingNumber}
                onChange={(e) => setAccountDetails(prev => ({ ...prev, routingNumber: e.target.value }))}
                placeholder="Routing Number"
                disabled={loading}
                required
              />
            </div>
          )}

          {/* Fee Breakdown */}
          {parseFloat(amount) > 0 && (
            <Card className="bg-yellow-50">
              <CardBody className="p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle size={20} className="text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-yellow-900 mb-2">Fee Breakdown</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-yellow-800">Withdrawal Amount:</span>
                        <span className="text-yellow-900 font-medium">${parseFloat(amount).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-yellow-800">Processing Fee:</span>
                        <span className="text-yellow-900 font-medium">-${withdrawalFee.toFixed(2)}</span>
                      </div>
                      <div className="border-t border-yellow-200 pt-1 mt-2">
                        <div className="flex justify-between font-semibold">
                          <span className="text-yellow-900">Net Amount:</span>
                          <span className="text-yellow-900">${netAmount.toFixed(2)}</span>
                        </div>
                      </div>
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
              disabled={loading || !amount || parseFloat(amount) <= 0}
              className="flex-1"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                `Withdraw $${amount || '0.00'}`
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};