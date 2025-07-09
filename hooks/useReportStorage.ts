import { useState, useCallback } from 'react';
import { ReportData, SavedReport } from '@/types';

export const useReportStorage = () => {
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all saved reports
  const fetchReports = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/reports');
      const data = await response.json();
      
      if (data.success) {
        setSavedReports(data.reports);
      } else {
        console.error('Failed to fetch reports:', data.error);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save a new report or update existing one based on slug
  const saveReport = useCallback(async (reportData: ReportData): Promise<string | null> => {
    try {
      setIsSaving(true);
      
      // Check if a report with this slug already exists in savedReports (from index.json)
      const existingReport = savedReports.find(report => report.slug === reportData.slug);
      
      let method: string;
      let url: string;
      let finalReportData = { ...reportData };
      
      if (existingReport) {
        // Update existing report using slug-based endpoint
        method = 'PUT';
        url = `/api/reports/${reportData.slug}`;
        finalReportData = {
          ...reportData,
          id: existingReport.id, // Use existing ID from index.json
        };
        console.log(`Updating existing report with slug: ${reportData.slug}, ID: ${existingReport.id}`);
      } else {
        // Create new report
        method = 'POST';
        url = '/api/reports';
        finalReportData = { ...reportData, id: undefined };
        console.log(`Creating new report with slug: ${reportData.slug}`);
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalReportData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCurrentReportId(data.report.slug); // Store slug as current report identifier
        await fetchReports(); // Refresh the list
        return data.report.slug;
      } else {
        console.error('Failed to save report:', data.error);
        return null;
      }
    } catch (error) {
      console.error('Error saving report:', error);
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [fetchReports, savedReports]);

  // Load a specific report by slug
  const loadReport = useCallback(async (slug: string): Promise<ReportData | null> => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/reports/${slug}`);
      const data = await response.json();
      
      // Handle both direct data response and wrapped response
      if (data.error) {
        console.error('Failed to load report:', data.error);
        return null;
      }
      
      let reportData;
      if (data.success) {
        // Wrapped response format
        reportData = data.report;
      } else if (data.id || data.title) {
        // Direct data response format
        reportData = data;
      } else {
        console.error('Invalid response format:', data);
        return null;
      }
      
      setCurrentReportId(slug); // Store slug as current report identifier
      return reportData;
    } catch (error) {
      console.error('Error loading report:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Delete a report by slug
  const deleteReport = useCallback(async (slug: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Use slug for deletion
      const response = await fetch(`/api/reports/${slug}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (currentReportId === slug) {
          setCurrentReportId(null);
        }
        await fetchReports(); // Refresh the list
        return true;
      } else {
        console.error('Failed to delete report:', data.error);
        return false;
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentReportId, fetchReports]);

  // Create a new report (reset current state)
  const createNewReport = useCallback(() => {
    setCurrentReportId(null);
  }, []);

  return {
    savedReports,
    currentReportId,
    isSaving,
    isLoading,
    fetchReports,
    saveReport,
    loadReport,
    deleteReport,
    createNewReport,
  };
};
