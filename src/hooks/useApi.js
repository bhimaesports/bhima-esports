import { useState, useCallback } from 'react';
import api from '../utils/api';

export function useApi() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (method, endpoint, body, params) => {
    try {
      setLoading(true);
      setError(null);
      let result;
      switch (method) {
        case 'GET':
          result = await api.get(endpoint, params);
          break;
        case 'POST':
          result = await api.post(endpoint, body);
          break;
        case 'PUT':
          result = await api.put(endpoint, body);
          break;
        case 'PATCH':
          result = await api.patch(endpoint, body);
          break;
        case 'DELETE':
          result = await api.delete(endpoint);
          break;
        default:
          result = await api.get(endpoint, params);
      }
      setData(result);
      return result;
    } catch (err) {
      setError(err.message || 'Something went wrong');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const get = useCallback((endpoint, params) => execute('GET', endpoint, null, params), [execute]);
  const post = useCallback((endpoint, body) => execute('POST', endpoint, body), [execute]);
  const put = useCallback((endpoint, body) => execute('PUT', endpoint, body), [execute]);
  const patch = useCallback((endpoint, body) => execute('PATCH', endpoint, body), [execute]);
  const del = useCallback((endpoint) => execute('DELETE', endpoint), [execute]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, get, post, put, patch, del, reset };
}

export default useApi;
