import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import { Exchange, ExchangeStatus } from '../types';
import Spinner from '../components/Spinner';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/Button';

interface ExchangeCardProps {
    exchange: Exchange;
    perspective: 'owner' | 'requester';
    onAccept: (exchangeId: string) => void;
    onReject: (exchangeId: string) => void;
    isUpdating: boolean;
}

const ExchangeCard: React.FC<ExchangeCardProps> = ({ exchange, perspective, onAccept, onReject, isUpdating }) => {
    const isOwner = perspective === 'owner';
    const statusColor = {
        [ExchangeStatus.Pending]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        [ExchangeStatus.Accepted]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        [ExchangeStatus.Rejected]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        [ExchangeStatus.Completed]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex-1 text-center sm:text-left">
                {isOwner ? (
                    <p><strong>{exchange.requesterName}</strong> wants your <strong>{exchange.requestedItem.title}</strong></p>
                ) : (
                    <p>You requested <strong>{exchange.requestedItem.title}</strong> from <strong>{exchange.ownerName}</strong></p>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400">in exchange for your <strong>{exchange.offeredItem.title}</strong>.</p>
            </div>
            <div className="flex flex-col items-center gap-2">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColor[exchange.status]}`}>
                    {exchange.status}
                </span>
                {isOwner && exchange.status === ExchangeStatus.Pending && (
                    <div className="flex gap-2 mt-2">
                        <Button size="sm" variant="primary" onClick={() => onAccept(exchange.id)} isLoading={isUpdating}>Accept</Button>
                        <Button size="sm" variant="danger" onClick={() => onReject(exchange.id)} isLoading={isUpdating}>Reject</Button>
                    </div>
                )}
            </div>
        </div>
    );
};

const ExchangesPage: React.FC = () => {
  const [incoming, setIncoming] = useState<Exchange[]>([]);
  const [outgoing, setOutgoing] = useState<Exchange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingExchangeId, setUpdatingExchangeId] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchExchanges = useCallback(async () => {
    if (!user) return;
    try {
      // Don't show main spinner on refresh, only on initial load
      if (loading) setLoading(true); 
      const allExchanges = await api.getExchanges();
      setIncoming(allExchanges.filter(ex => ex.ownerId === user.id));
      setOutgoing(allExchanges.filter(ex => ex.requesterId === user.id));
      setError(null);
    } catch (err) {
      setError('Failed to fetch exchanges.');
    } finally {
      setLoading(false);
    }
  }, [user, loading]);

  useEffect(() => {
    fetchExchanges();
  }, [fetchExchanges]);

  const handleUpdateStatus = async (exchangeId: string, status: ExchangeStatus) => {
    setUpdatingExchangeId(exchangeId);
    try {
        await api.updateExchangeStatus(exchangeId, status);
        await fetchExchanges();
    } catch (err) {
        setError((err as Error).message || `Failed to update exchange status.`);
    } finally {
        setUpdatingExchangeId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }
  
  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">My Exchanges</h1>

      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4 border-b pb-2 border-gray-300 dark:border-gray-600">Incoming Requests</h2>
          {incoming.length > 0 ? (
            <div className="space-y-4">
              {incoming.map(ex => (
                <ExchangeCard 
                  key={ex.id} 
                  exchange={ex} 
                  perspective="owner" 
                  onAccept={(id) => handleUpdateStatus(id, ExchangeStatus.Accepted)}
                  onReject={(id) => handleUpdateStatus(id, ExchangeStatus.Rejected)}
                  isUpdating={updatingExchangeId === ex.id}
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">You have no incoming exchange requests.</p>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4 border-b pb-2 border-gray-300 dark:border-gray-600">Outgoing Requests</h2>
          {outgoing.length > 0 ? (
            <div className="space-y-4">
              {outgoing.map(ex => (
                <ExchangeCard 
                  key={ex.id} 
                  exchange={ex} 
                  perspective="requester"
                  onAccept={() => {}} 
                  onReject={() => {}}
                  isUpdating={false} 
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">You have not made any exchange requests.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExchangesPage;
