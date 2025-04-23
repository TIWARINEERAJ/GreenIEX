import React, { useState, useEffect } from 'react';
import { Transaction } from '../../types/market';
import { wsService } from '../../services/websocket';

const TransactionHistory: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterType, setFilterType] = useState<string>('');

  useEffect(() => {
    console.log('Subscribing to transaction updates...');
    const unsubscribe = wsService.subscribeToTransactions((newTransactions) => {
      console.log('Received transactions update with', newTransactions.length, 'transactions');
      setTransactions(newTransactions);
    });

    return () => {
      console.log('Cleaning up transaction subscription...');
      unsubscribe();
    };
  }, []);

  // Filter transactions based on energy type
  const filteredTransactions = filterType 
    ? transactions.filter(t => t.energyType === filterType) 
    : transactions;

  // Sort transactions by timestamp (newest first)
  const sortedTransactions = [...filteredTransactions].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="bg-white p-6 rounded shadow-sm mt-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Transaction History</h2>
        <div>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="input"
          >
            <option value="">All Types</option>
            <option value="SOLAR">Solar</option>
            <option value="WIND">Wind</option>
            <option value="HYDRO">Hydro</option>
          </select>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Energy Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity (MWh)
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price (₹/kWh)
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Value (₹)
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedTransactions.length > 0 ? (
              sortedTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(transaction.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${transaction.energyType === 'SOLAR' ? 'bg-yellow-100 text-yellow-800' : 
                      transaction.energyType === 'WIND' ? 'bg-blue-100 text-blue-800' : 
                      'bg-green-100 text-green-800'}`}>
                      {transaction.energyType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.quantity.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ₹{transaction.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ₹{(transaction.quantity * transaction.price).toFixed(2)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                  No transactions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionHistory;
