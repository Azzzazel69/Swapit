
import React, { useState, useMemo, useEffect } from 'react';
import { useColorTheme } from '../hooks/useColorTheme.tsx';
import { SPAIN_LOCATIONS, Community, Province, Municipality } from '../data/spainLocations.ts';

interface HierarchicalLocationSelectorProps {
  initialData?: {
    communityId?: string;
    provinceId?: string;
    municipalityId?: string;
  };
  onChange: (data: {
    community: string;
    province: string;
    city: string;
    communityId: string;
    provinceId: string;
    cityId: string;
  }) => void;
  required?: boolean;
}

const HierarchicalLocationSelector: React.FC<HierarchicalLocationSelectorProps> = ({ 
  initialData, 
  onChange, 
  required = false 
}) => {
  const { theme } = useColorTheme();
  
  const [commId, setCommId] = useState(initialData?.communityId || '');
  const [provId, setProvId] = useState(initialData?.provinceId || '');
  const [muniId, setMuniId] = useState(initialData?.municipalityId || '');

  const selectedCommunity = useMemo(() => 
    SPAIN_LOCATIONS.find(c => c.id === commId), [commId]);
  
  const provinces = useMemo(() => 
    selectedCommunity?.provinces || [], [selectedCommunity]);
  
  const selectedProvince = useMemo(() => 
    provinces.find(p => p.id === provId), [provinces, provId]);
  
  const municipalities = useMemo(() => 
    selectedProvince?.municipalities || [], [selectedProvince]);

  useEffect(() => {
    if (commId && provId && muniId) {
      const muni = municipalities.find(m => m.id === muniId);
      if (muni && selectedCommunity && selectedProvince) {
        onChange({
          community: selectedCommunity.name,
          province: selectedProvince.name,
          city: muni.name,
          communityId: commId,
          provinceId: provId,
          cityId: muniId
        });
      }
    }
  }, [commId, provId, muniId, municipalities, selectedCommunity, selectedProvince, onChange]);

  const selectClasses = `mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 ${theme.focus} focus:${theme.border} sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all`;
  const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div>
        <label className={labelClasses}>Comunidad Autónoma</label>
        <select 
          value={commId} 
          onChange={(e) => { setCommId(e.target.value); setProvId(''); setMuniId(''); }}
          required={required}
          className={selectClasses}
        >
          <option value="">-- Selecciona Comunidad --</option>
          {SPAIN_LOCATIONS.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClasses}>Provincia</label>
        <select 
          value={provId} 
          onChange={(e) => { setProvId(e.target.value); setMuniId(''); }}
          disabled={!commId}
          required={required}
          className={selectClasses}
        >
          <option value="">-- Selecciona Provincia --</option>
          {provinces.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClasses}>Municipio</label>
        <select 
          value={muniId} 
          onChange={(e) => setMuniId(e.target.value)}
          disabled={!provId}
          required={required}
          className={selectClasses}
        >
          <option value="">-- Selecciona Municipio --</option>
          {municipalities.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default HierarchicalLocationSelector;
