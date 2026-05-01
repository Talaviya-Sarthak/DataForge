import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataset } from '@/contexts/DatasetContext';
import { useToast } from '@/components/ui/toast/Toast';

interface DatasetProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * DatasetProtectedRoute - Blocks access to pages that require a dataset
 * 
 * Rules:
 * - User MUST have uploaded a dataset to access protected pages
 * - Shows toast notification and redirects immediately
 * - Persists state across page refreshes using localStorage
 * - Prevents any bypass attempts
 */
export const DatasetProtectedRoute = ({ children }: DatasetProtectedRouteProps) => {
  const { datasetExists } = useDataset();
  const navigate = useNavigate();
  const { show } = useToast();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Only run once
    if (hasRedirected.current) return;

    // Check if dataset exists
    if (!datasetExists) {
      hasRedirected.current = true;
      
      // Show toast notification
      show({
        type: 'error',
        message: 'Please upload dataset first',
      });

      // Redirect immediately
      navigate('/DataSet', { replace: true });
    }
  }, [datasetExists, navigate, show]);

  // Don't render children if no dataset
  if (!datasetExists) {
    return null;
  }

  return <>{children}</>;
};
