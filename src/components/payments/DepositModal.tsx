import React, { useState } from 'react';
import { CreditCard, DollarSign, X } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select, SelectOption } from '../ui/Select';
import { Card, CardBody } from '../ui/Card';
import { useAuth } from '../../context/AuthContext';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (parseFloat(amount) < 1) {
      setError('Minimum deposit amount is $1');
      return;
    }

    if (parseFloat(amount) > 10000) {
      setError('Maximum deposit amount is $10,000');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('business_nexus_token');
      const response = await fetch('/api/payments/deposit', {
        method: 'POST',
        headers: token ? {
          'Content-Type': 'application/json',
          'x-auth-token': token
        } : {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          paymentMethod,
          description: `Deposit of $${amount} via ${paymentMethod}`
        })
      });

      const data = await response.json();

      if (response.ok) {
        if (paymentMethod === 'stripe' && data.clientSecret) {
          // In a real implementation, you would redirect to Stripe checkout
          // For demo purposes, we'll simulate success
          setTimeout(() => {
            onSuccess();
            onClose();
            setAmount('');
            setLoading(false);
          }, 2000);
        } else {
          onSuccess();
          onClose();
          setAmount('');
          setLoading(false);
        }
      } else {
        setError(data.message || 'Deposit failed');
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
      setError('');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full">
              <DollarSign size={20} className="text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Deposit Funds</h2>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deposit Amount
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
                max="10000"
                step="0.01"
                className="pl-8"
                disabled={loading}
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Minimum: $1.00 • Maximum: $10,000.00
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <Select
              value={paymentMethod}
              onChange={(value) => setPaymentMethod(value)}
              disabled={loading}
            >
              <SelectOption value="stripe">Credit/Debit Card (Stripe)</SelectOption>
              <SelectOption value="paypal">PayPal</SelectOption>
            </Select>
          </div>

          {/* Payment Method Info */}
          <Card className="bg-gray-50">
            <CardBody className="p-4">
              <div className="flex items-start space-x-3">
                <CreditCard size={20} className="text-gray-500 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">
                    {paymentMethod === 'stripe' ? 'Secure Card Payment' : 'PayPal Payment'}
                  </h4>
                  <p className="text-xs text-gray-600">
                    {paymentMethod === 'stripe' 
                      ? 'Your payment will be processed securely through Stripe. You will be redirected to complete the payment.'
                      : 'You will be redirected to PayPal to complete your payment securely.'
                    }
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

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
              disabled={loading || !amount}
              className="flex-1"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                `Deposit $${amount || '0.00'}`
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};