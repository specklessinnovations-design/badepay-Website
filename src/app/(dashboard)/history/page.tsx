

import { useEffect } from 'react';
import { useLocation } from 'wouter';

export default function HistoryRedirect() {
  const [, navigate] = useLocation();
  useEffect(() => {
    navigate('/activity');
  }, [navigate]);
  return null;
}
