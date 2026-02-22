/**
 * Reviews Module - Entry Point
 * 
 * This module provides review collection and display functionality
 * for the MasterPlan platform.
 */

// Export components
export { default as ReviewList } from './components/ReviewList';
export { default as ReviewCard } from './components/ReviewCard';
export { default as ReviewForm } from './components/ReviewForm';
export { default as ReviewStats } from './components/ReviewStats';
export { default as ReviewWidget } from './components/ReviewWidget';

// Export hook components
export { default as ClientReviewsTab } from './hooks/ClientReviewsTab';
export { default as PublicReviewsSection } from './hooks/PublicReviewsSection';
export { default as SidebarMenuItem } from './hooks/SidebarMenuItem';

// Export types
export type { Review, ReviewStats as ReviewStatsType, ReviewFormData } from './types';
