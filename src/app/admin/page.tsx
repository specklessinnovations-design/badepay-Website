import { useEffect } from 'react';
import { useLocation } from 'wouter';

export default function AdminIndexPage() {
  const [, navigate] = useLocation();
  useEffect(() => {
    navigate('/admin/dashboard');
  }, [navigate]);
  return null;
}
