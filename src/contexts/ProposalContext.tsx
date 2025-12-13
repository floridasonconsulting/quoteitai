import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ProposalData, ProposalSection, ProposalItem } from '@/types/proposal';

// Default empty proposal for initialization
const DEFAULT_PROPOSAL: ProposalData = {
  id: 'new_proposal',
  status: 'draft',
  settings: {
    theme: 'corporate_sidebar',
    mode: 'light',
    primaryColor: '#0f766e',
    currency: '$'
  },
  client: { name: '', email: '' },
  sections: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

interface ProposalContextType {
  proposal: ProposalData;
  setProposal: React.Dispatch<React.SetStateAction<ProposalData>>;
  updateSection: (sectionId: string, updates: Partial<ProposalSection>) => void;
  addSection: (section: ProposalSection) => void;
  removeSection: (sectionId: string) => void;
  reorderSections: (startIndex: number, endIndex: number) => void;
  updateSettings: (updates: Partial<ProposalData['settings']>) => void;
  updateClient: (updates: Partial<ProposalData['client']>) => void;
}

const ProposalContext = createContext<ProposalContextType | undefined>(undefined);

export const ProposalProvider = ({ children, initialData }: { children: ReactNode; initialData?: ProposalData }) => {
  const [proposal, setProposal] = useState<ProposalData>(initialData || DEFAULT_PROPOSAL);

  const updateSection = useCallback((sectionId: string, updates: Partial<ProposalSection>) => {
    setProposal(prev => ({
      ...prev,
      sections: prev.sections.map(sec => 
        sec.id === sectionId ? { ...sec, ...updates } : sec
      ),
      updatedAt: new Date().toISOString()
    }));
  }, []);

  const addSection = useCallback((section: ProposalSection) => {
    setProposal(prev => ({
      ...prev,
      sections: [...prev.sections, section],
      updatedAt: new Date().toISOString()
    }));
  }, []);

  const removeSection = useCallback((sectionId: string) => {
    setProposal(prev => ({
      ...prev,
      sections: prev.sections.filter(sec => sec.id !== sectionId),
      updatedAt: new Date().toISOString()
    }));
  }, []);

  const reorderSections = useCallback((startIndex: number, endIndex: number) => {
    setProposal(prev => {
      const newSections = [...prev.sections];
      const [removed] = newSections.splice(startIndex, 1);
      newSections.splice(endIndex, 0, removed);
      return {
        ...prev,
        sections: newSections,
        updatedAt: new Date().toISOString()
      };
    });
  }, []);

  const updateSettings = useCallback((updates: Partial<ProposalData['settings']>) => {
    setProposal(prev => ({
      ...prev,
      settings: { ...prev.settings, ...updates },
      updatedAt: new Date().toISOString()
    }));
  }, []);

  const updateClient = useCallback((updates: Partial<ProposalData['client']>) => {
    setProposal(prev => ({
      ...prev,
      client: { ...prev.client, ...updates },
      updatedAt: new Date().toISOString()
    }));
  }, []);

  return (
    <ProposalContext.Provider value={{
      proposal,
      setProposal,
      updateSection,
      addSection,
      removeSection,
      reorderSections,
      updateSettings,
      updateClient
    }}>
      {children}
    </ProposalContext.Provider>
  );
};

export const useProposal = () => {
  const context = useContext(ProposalContext);
  if (context === undefined) {
    throw new Error('useProposal must be used within a ProposalProvider');
  }
  return context;
};
