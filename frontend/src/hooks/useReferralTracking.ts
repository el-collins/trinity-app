'use client';

import { useEffect, useState, useCallback } from 'react';

export interface ReferralData {
  // Core referral params
  referralCode: string | null;      // ref param - ISO partner code
  agentId: string | null;           // agent param - sales rep identifier
  affiliateId: string | null;       // am_id param - GHL Affiliate Manager ID

  // UTM marketing params
  utmSource: string | null;         // utm_source - traffic source
  utmMedium: string | null;         // utm_medium - marketing medium
  utmCampaign: string | null;       // utm_campaign - campaign name
  utmTerm: string | null;           // utm_term - paid keywords
  utmContent: string | null;        // utm_content - ad variation

  // Metadata
  landingUrl: string | null;        // Full URL when user landed
  capturedAt: string | null;        // ISO timestamp when captured
}

const STORAGE_KEY = 'trinityiq_referral_data';

/**
 * Hook to capture and persist referral tracking data from URL parameters.
 *
 * Captures on initial page load:
 * - ref: ISO partner referral code
 * - agent: Sales representative ID
 * - am_id: GHL Affiliate Manager ID (for native GHL affiliate tracking)
 * - UTM parameters for marketing attribution
 *
 * Data persists in localStorage throughout the form journey.
 */
export function useReferralTracking() {
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load existing referral data from storage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ReferralData;
        setReferralData(parsed);
      }
    } catch (error) {
      console.error('[ReferralTracking] Error loading stored data:', error);
    }

    setIsLoaded(true);
  }, []);

  // Capture referral params from URL on initial load
  useEffect(() => {
    if (typeof window === 'undefined' || !isLoaded) return;

    const urlParams = new URLSearchParams(window.location.search);

    // Check if URL has any referral params
    const hasReferralParams =
      urlParams.has('ref') ||
      urlParams.has('agent') ||
      urlParams.has('am_id') ||
      urlParams.has('utm_source') ||
      urlParams.has('utm_medium') ||
      urlParams.has('utm_campaign') ||
      urlParams.has('utm_term') ||
      urlParams.has('utm_content');

    if (!hasReferralParams) {
      console.log('[ReferralTracking] No referral params in URL');
      return;
    }

    // Capture new referral data (overwrites existing if new params present)
    const newReferralData: ReferralData = {
      referralCode: urlParams.get('ref'),
      agentId: urlParams.get('agent'),
      affiliateId: urlParams.get('am_id'),
      utmSource: urlParams.get('utm_source'),
      utmMedium: urlParams.get('utm_medium'),
      utmCampaign: urlParams.get('utm_campaign'),
      utmTerm: urlParams.get('utm_term'),
      utmContent: urlParams.get('utm_content'),
      landingUrl: window.location.href,
      capturedAt: new Date().toISOString(),
    };

    // Store in localStorage for persistence
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newReferralData));
      setReferralData(newReferralData);
      console.log('[ReferralTracking] Captured referral data:', newReferralData);
    } catch (error) {
      console.error('[ReferralTracking] Error storing referral data:', error);
    }
  }, [isLoaded]);

  // Clear referral data (e.g., after successful submission)
  const clearReferralData = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(STORAGE_KEY);
      setReferralData(null);
      console.log('[ReferralTracking] Cleared referral data');
    } catch (error) {
      console.error('[ReferralTracking] Error clearing referral data:', error);
    }
  }, []);

  // Get referral data for API submission
  const getReferralDataForSubmission = useCallback((): Record<string, string> | null => {
    if (!referralData) return null;

    const data: Record<string, string> = {};

    if (referralData.referralCode) data.referral_code = referralData.referralCode;
    if (referralData.agentId) data.agent_id = referralData.agentId;
    if (referralData.affiliateId) data.affiliate_id = referralData.affiliateId;
    if (referralData.utmSource) data.utm_source = referralData.utmSource;
    if (referralData.utmMedium) data.utm_medium = referralData.utmMedium;
    if (referralData.utmCampaign) data.utm_campaign = referralData.utmCampaign;
    if (referralData.utmTerm) data.utm_term = referralData.utmTerm;
    if (referralData.utmContent) data.utm_content = referralData.utmContent;
    if (referralData.landingUrl) data.landing_url = referralData.landingUrl;
    if (referralData.capturedAt) data.captured_at = referralData.capturedAt;

    return Object.keys(data).length > 0 ? data : null;
  }, [referralData]);

  // Check if there's active referral tracking
  const hasReferral = Boolean(referralData?.referralCode || referralData?.agentId || referralData?.affiliateId);
  const hasAffiliateTracking = Boolean(referralData?.affiliateId);
  const hasUtmTracking = Boolean(
    referralData?.utmSource ||
    referralData?.utmMedium ||
    referralData?.utmCampaign
  );

  return {
    referralData,
    isLoaded,
    hasReferral,
    hasAffiliateTracking,
    hasUtmTracking,
    clearReferralData,
    getReferralDataForSubmission,
  };
}

// Utility to get referral data without hook (for server components or one-time reads)
export function getReferralDataFromStorage(): ReferralData | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}
