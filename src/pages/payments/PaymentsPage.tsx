import React, { useState, useEffect } from 'react';
import { CreditCard, ArrowUpCircle, ArrowDownCircle, Send, History, DollarSign } from 'lucide-react';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { API_URL } from '../../config/api';

import { useAuth } from '../../context/AuthContext';
import { DepositModal } from '../../components/payments/DepositModal';
import { WithdrawModal } from '../../components/payments/WithdrawModal';
import { TransferModal } from '../../components/payments/TransferModal';
import { TransactionHistory } from '../../components/payments/TransactionHistory';

interface Transaction {
  _id: string;
  type: 'deposit' | 'withdraw' | 'transfer';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string;
  recipientId?: {
    _id: string;
    name: string;
    email: string;
  };
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  processedAt?: string;
}

export const PaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [balance] = useState(2500.00); // Mock balance for demo

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('business_nexus_token');
      const response = await fetch(`${API_URL}/payments/transactions`, {
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {}
      });
      
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleTransactionSuccess = () => {
    fetchTransactions();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'danger';
      case 'cancelled': return 'secondary';
      default: return 'secondary';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <ArrowDownCircle size={16} className="text-green-600" />;
      case 'withdraw': return <ArrowUpCircle size={16} className="text-red-600" />;
      case 'transfer': return <Send size={16} className="text-blue-600" />;
      default: return <DollarSign size={16} />;
    }
  };

  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Payments & Transactions</h1>
        <p className="text-gray-600 mt-2">Manage your deposits, withdrawals, and transfers</p>
      </div>

      {/* Balance Card */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <Card className="lg:col-span-1">
          <CardBody className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-full mx-auto mb-4">
              <DollarSign size={24} className="text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Available Balance</h3>
            <p className="text-3xl font-bold text-primary-600">${balance.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-1">USD</p>
          </CardBody>
        </Card>

        {/* Quick Actions */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Button
                  onClick={() => setShowDepositModal(true)}
                  leftIcon={<ArrowDownCircle size={18} />}
                  variant="primary"
                  className="w-full"
                >
                  Deposit Funds
                </Button>
                <Button
                  onClick={() => setShowWithdrawModal(true)}
                  leftIcon={<ArrowUpCircle size={18} />}
                  variant="secondary"
                  className="w-full"
                >
                  Withdraw Funds
                </Button>
                <Button
                  onClick={() => setShowTransferModal(true)}
                  leftIcon={<Send size={18} />}
                  variant="outline"
                  className="w-full"
                >
                  Transfer Money
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
              <History size={20} className="text-gray-500" />
            </div>
          </CardHeader>
          <CardBody>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading transactions...</p>
              </div>
            ) : recentTransactions.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No transactions yet</p>
                <p className="text-sm text-gray-400">Your transaction history will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div key={transaction._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getTypeIcon(transaction.type)}
                      <div>
                        <p className="font-medium text-gray-900">
                          {transaction.description}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        transaction.type === 'deposit' ? 'text-green-600' : 
                        transaction.type === 'withdraw' ? 'text-red-600' : 'text-blue-600'
                      }`}>
                        {transaction.type === 'withdraw' ? '-' : '+'}
                        ${transaction.amount.toLocaleString()}
                      </p>
                      <Badge variant={getStatusColor(transaction.status) as 'secondary' | 'success' | 'warning'} size="sm">
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Transaction History Component */}
        <TransactionHistory 
          transactions={transactions}
          loading={loading}
          onRefresh={fetchTransactions}
        />
      </div>

      {/* Modals */}
      <DepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        onSuccess={handleTransactionSuccess}
      />
      
      <WithdrawModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        onSuccess={handleTransactionSuccess}
      />
      
      <TransferModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        onSuccess={handleTransactionSuccess}
      />
    </div>
  );
};