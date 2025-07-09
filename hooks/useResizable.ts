'use client';

import { useState, useEffect, useCallback } from 'react';

interface PanelWidths {
  [key: string]: number;
}

const DEFAULT_WIDTHS: PanelWidths = {
  chat: 400,
  promptConfig: 320,
  reportManager: 288,
  reportForm: 384,
  contentPreview: 600
};

const MIN_WIDTHS: PanelWidths = {
  chat: 300,
  promptConfig: 250,
  reportManager: 200,
  reportForm: 300,
  contentPreview: 400
};

const MAX_WIDTHS: PanelWidths = {
  chat: 800,
  promptConfig: 600,
  reportManager: 500,
  reportForm: 600,
  contentPreview: 1200
};

export function useResizable() {
  const [panelWidths, setPanelWidths] = useState<PanelWidths>(DEFAULT_WIDTHS);
  const [isResizing, setIsResizing] = useState<string | null>(null);

  // Load widths from cookies on mount
  useEffect(() => {
    const savedWidths = document.cookie
      .split('; ')
      .find(row => row.startsWith('panelWidths='))
      ?.split('=')[1];

    if (savedWidths) {
      try {
        const parsed = JSON.parse(decodeURIComponent(savedWidths));
        setPanelWidths({ ...DEFAULT_WIDTHS, ...parsed });
      } catch (error) {
        console.error('Failed to parse saved panel widths:', error);
      }
    }
  }, []);

  // Save widths to cookies when they change
  const saveWidthsToCookies = useCallback((widths: PanelWidths) => {
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1); // 1 year expiry
    document.cookie = `panelWidths=${encodeURIComponent(JSON.stringify(widths))}; expires=${expires.toUTCString()}; path=/`;
  }, []);

  const updatePanelWidth = useCallback((panelId: string, width: number) => {
    const minWidth = MIN_WIDTHS[panelId] || 200;
    const maxWidth = MAX_WIDTHS[panelId] || 800;
    const clampedWidth = Math.max(minWidth, Math.min(maxWidth, width));

    setPanelWidths(prev => {
      const newWidths = { ...prev, [panelId]: clampedWidth };
      // Debounce cookie saving for performance during dragging
      if (!isResizing) {
        saveWidthsToCookies(newWidths);
      }
      return newWidths;
    });
  }, [saveWidthsToCookies, isResizing]);

  const startResize = useCallback((panelId: string) => {
    setIsResizing(panelId);
  }, []);

  const stopResize = useCallback(() => {
    setIsResizing(null);
    // Save to cookies when resizing stops
    setTimeout(() => {
      saveWidthsToCookies(panelWidths);
    }, 100);
  }, [saveWidthsToCookies, panelWidths]);

  const handleMouseMove = useCallback((e: MouseEvent, panelId: string, startX: number, startWidth: number) => {
    if (isResizing !== panelId) return;

    const deltaX = e.clientX - startX;
    const newWidth = startWidth + deltaX;
    updatePanelWidth(panelId, newWidth);
  }, [isResizing, updatePanelWidth]);

  const resetPanelWidth = useCallback((panelId: string) => {
    updatePanelWidth(panelId, DEFAULT_WIDTHS[panelId] || 300);
  }, [updatePanelWidth]);

  const resetAllWidths = useCallback(() => {
    setPanelWidths(DEFAULT_WIDTHS);
    saveWidthsToCookies(DEFAULT_WIDTHS);
  }, [saveWidthsToCookies]);

  return {
    panelWidths,
    isResizing,
    updatePanelWidth,
    startResize,
    stopResize,
    handleMouseMove,
    resetPanelWidth,
    resetAllWidths,
    minWidths: MIN_WIDTHS,
    maxWidths: MAX_WIDTHS
  };
}
