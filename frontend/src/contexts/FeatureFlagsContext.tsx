import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import api from '../services/api';

export interface FeatureFlags {
  authEnabled: boolean;
  multiplayerEnabled: boolean;
  socialFeaturesEnabled: boolean;
  reviewsEnabled: boolean;
  backlogEnabled: boolean;
  statisticsEnabled: boolean;
  translationEnabled: boolean;
  advancedRatingEnabled: boolean;
}

const defaults: FeatureFlags = {
  authEnabled: true,
  multiplayerEnabled: true,
  socialFeaturesEnabled: false,
  reviewsEnabled: true,
  backlogEnabled: true,
  statisticsEnabled: false,
  translationEnabled: true,
  advancedRatingEnabled: false,
};

const FeatureFlagsContext = createContext<FeatureFlags>(defaults);

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<FeatureFlags>(defaults);

  useEffect(() => {
    api.get<FeatureFlags>('/api/featureflags')
      .then(r => setFlags(r.data))
      .catch(() => {/* use defaults on error */});
  }, []);

  return (
    <FeatureFlagsContext.Provider value={flags}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export const useFeatureFlags = () => useContext(FeatureFlagsContext);
