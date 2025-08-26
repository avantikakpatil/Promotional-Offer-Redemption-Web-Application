import React, { useEffect, useState, useContext } from 'react';
import { api } from '../../../services/api';
import { AuthContext } from '../../../contexts/AuthContext';

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useContext(AuthContext);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get('/reseller/redemption-history', {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        console.log('Raw history data:', res.data); // Debug log
        setHistory(res.data || []);
      } catch (err) {
        console.error('Error fetching redemption history:', err);
        setError('Failed to fetch redemption history');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchHistory();
    }
  }, [token]);

  const parseRedeemedProducts = (products) => {
    // Handle null, undefined, or empty values
    if (!products) {
      return 'No products';
    }

    // If it's already a string and not JSON, return as is
    if (typeof products === 'string' && !products.startsWith('[') && !products.startsWith('{')) {
      return products;
    }

    try {
      // Handle case where products is already an object/array
      let parsed = products;
      
      // If it's a string, try to parse it
      if (typeof products === 'string') {
        parsed = JSON.parse(products);
      }

      // Handle array of products
      if (Array.isArray(parsed)) {
        if (parsed.length === 0) {
          return 'No products';
        }
        
        return parsed.map((product) => {
          // Handle different possible structures
          if (typeof product === 'string') {
            return product;
          }
          
          // Check for Name property (as per your data format)
          if (product.Name) {
            return product.Name;
          }
          
          // Check for other possible name properties
          if (product.name) {
            return product.name;
          }
          
          // Check for title property
          if (product.title) {
            return product.title;
          }
          
          // If it's an object but no recognizable name property
          if (typeof product === 'object') {
            return JSON.stringify(product);
          }
          
          return 'Unknown product';
        }).join(', ');
      }
      
      // Handle single product object
      if (typeof parsed === 'object' && parsed !== null) {
        if (parsed.Name) {
          return parsed.Name;
        }
        if (parsed.name) {
          return parsed.name;
        }
        if (parsed.title) {
          return parsed.title;
        }
        return JSON.stringify(parsed);
      }
      
      // Handle primitive values
      return String(parsed);
      
    } catch (e) {
      console.error('Error parsing products:', e, 'Original data:', products);
      // Return the original string if JSON parsing fails
      return String(products);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return dateString;
    }
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    // If it's a number, format as currency
    if (typeof value === 'number') {
      return `₹${value.toFixed(2)}`;
    }
    // If it's a string that looks like a number
    if (!isNaN(parseFloat(value))) {
      return `₹${parseFloat(value).toFixed(2)}`;
    }
    return String(value);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-8">
        <div className="py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Loading redemption history...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 sm:px-8">
        <div className="py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-red-600 text-lg">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-8">
      <div className="py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold leading-tight text-gray-800">
            Redemption History
          </h2>
          <p className="text-gray-600 mt-2">
            Total Records: {history.length}
          </p>
        </div>
        
        {history.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No redemption history found</div>
          </div>
        ) : (
          <div className="-mx-4 sm:-mx-8 px-4 sm:px-8 py-4 overflow-x-auto">
            <div className="inline-block min-w-full shadow-lg rounded-lg overflow-hidden">
              <table className="min-w-full leading-normal">
                <thead>
                  <tr>
                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Redeemed At
                    </th>
                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Redeemed Products
                    </th>
                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Points
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item, index) => (
                    <tr key={item.Id || item.id || index} className="hover:bg-gray-50">
                      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                        <p className="text-gray-900 whitespace-nowrap">
                          {formatDate(item.RedeemedAt || item.redeemedAt)}
                        </p>
                      </td>
                      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                        <div className="text-gray-900 max-w-xs">
                          {parseRedeemedProducts(item.RedeemedProducts || item.redeemedProducts)}
                        </div>
                      </td>
                      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                        <p className="text-gray-900 whitespace-nowrap font-medium">
                          {formatValue(item.RedemptionValue || item.redemptionValue)}
                        </p>
                      </td>
                      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {item.RedemptionType || item.redemptionType || 'N/A'}
                        </span>
                      </td>
                      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                        <p className="text-gray-900 whitespace-nowrap font-medium">
                          {item.Points || item.points || 0}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;