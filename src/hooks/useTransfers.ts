import { useState } from 'react';
import transfersService from '../services/transfersService';

export function useTransfers() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadHistory() {
    setLoading(true);
    try {
      const resp: any = await transfersService.history();
      setHistory(resp?.data ?? resp ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function initiate(payload: any) {
    setLoading(true);
    try {
      return await transfersService.initiate(payload);
    } finally {
      setLoading(false);
    }
  }

  async function confirm(payload: any) {
    setLoading(true);
    try {
      return await transfersService.confirm(payload);
    } finally {
      setLoading(false);
    }
  }

  return { history, loading, loadHistory, initiate, confirm };
}

export default useTransfers;
