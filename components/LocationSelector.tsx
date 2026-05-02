
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Button from './Button.tsx';
import AutocompleteInput from './AutocompleteInput.tsx';
import { useColorTheme } from '../hooks/useColorTheme.tsx';
import { FLAT_MUNICIPALITIES } from '../data/spainLocations.ts';

interface LocationResult {
    community: string;
    province: string;
    city: string;
    lat: number;
    lng: number;
    cityId?: string;
    country?: string;
    postalCode?: string;
    address?: string;
}

interface LocationSelectorProps {
    onChange: (data: LocationResult) => void;
    onError?: (msg: string) => void;
}

// Helper para normalizar texto (quitar acentos y diacríticos)
const normalizeText = (text: string) => {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

const LocationSelector: React.FC<LocationSelectorProps> = ({ onChange, onError }) => {
    const { theme } = useColorTheme();
    const [mode, setMode] = useState<'initial' | 'auto' | 'manual'>('initial');
    const [isDetecting, setIsDetecting] = useState(false);
    const [manualValue, setManualValue] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

    // Lógica de búsqueda híbrida (Local + API)
    useEffect(() => {
        const rawQuery = manualValue.trim();
        const query = normalizeText(rawQuery);
        
        if (mode !== 'manual' || query.length < 2) {
            setSuggestions([]);
            return;
        }

        // 1. Prioridad: Búsqueda en nuestra base de datos local de España
        const localMatches = FLAT_MUNICIPALITIES.filter(m => {
            const muniNormalized = normalizeText(m.muniName);
            const labelNormalized = normalizeText(m.label);
            return muniNormalized.startsWith(query) || labelNormalized.includes(query);
        }).map(m => ({
            id: m.id,
            name: m.muniName,
            province: m.provName,
            community: m.commName,
            lat: m.lat,
            lng: m.lng,
            isLocal: true,
            displayLabel: m.label,
            priority: 1
        }));

        // Check for exact match in local matches to auto-select
        const exactMatch = localMatches.find(m => normalizeText(m.name) === query);
        if (exactMatch && rawQuery.length === exactMatch.name.length) {
            // If it's an exact match, we notify the parent and close suggestions
            onChange({
                community: exactMatch.community,
                province: exactMatch.province,
                city: exactMatch.name,
                lat: exactMatch.lat,
                lng: exactMatch.lng,
                cityId: String(exactMatch.id)
            });
            setSuggestions([]);
            return; // Stop here if we have an exact local match
        }

        // 2. Si hay pocos matches o queremos ser exhaustivos, consultamos la API
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            setIsLoadingSuggestions(true);
            try {
                const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(rawQuery)}&countrycodes=es&addressdetails=1&format=json&limit=30&featuretype=settlement&accept-language=es`;
                const res = await fetch(url, { signal: controller.signal });
                const data = await res.json();

                if (!Array.isArray(data)) return;

                const apiResults = data
                    .filter((item: any) => {
                        const type = item.addresstype || item.type;
                        const displayName = normalizeText(item.display_name || '');
                        const forbiddenKeywords = ['calle', 'avenida', 'plaza', 'carretera', 'piso', 'numero'];
                        if (forbiddenKeywords.some(key => displayName.includes(key))) return false;
                        return ['city', 'town', 'village', 'municipality', 'hamlet', 'administrative'].includes(type);
                    })
                    .map((item: any) => {
                        const addr = item.address;
                        const name = addr.city || addr.town || addr.village || addr.municipality || item.display_name.split(',')[0];
                        const province = addr.province || addr.state_district || "";
                        const itemMuniNormalized = normalizeText(name);
                        
                        return {
                            id: item.place_id,
                            name,
                            province,
                            community: addr.state || "",
                            lat: parseFloat(item.lat),
                            lng: parseFloat(item.lon),
                            isLocal: false,
                            displayLabel: province ? `${name} (${province})` : name,
                            priority: itemMuniNormalized.startsWith(query) ? 2 : 3
                        };
                    });

                const combined = [...localMatches];
                apiResults.forEach(apiRes => {
                    const exists = combined.some(c => 
                        normalizeText(c.name) === normalizeText(apiRes.name) && 
                        normalizeText(c.province) === normalizeText(apiRes.province)
                    );
                    if (!exists) combined.push(apiRes);
                });

                combined.sort((a, b) => {
                    if (a.priority !== b.priority) return a.priority - b.priority;
                    return b.name.length - a.name.length;
                });

                const finalSuggestions = combined.slice(0, 10);
                setSuggestions(finalSuggestions);

                // If we didn't find an exact match in local, check in API results
                if (!exactMatch) {
                    const apiExactMatch = finalSuggestions.find(s => normalizeText(s.name) === query);
                    if (apiExactMatch) {
                        onChange({
                            community: apiExactMatch.community,
                            province: apiExactMatch.province,
                            city: apiExactMatch.name,
                            lat: apiExactMatch.lat,
                            lng: apiExactMatch.lng,
                            cityId: String(apiExactMatch.id)
                        });
                        setSuggestions([]);
                    }
                }
            } catch (e: any) {
                if (e.name !== 'AbortError') {
                    console.error("Error API:", e);
                    setSuggestions(localMatches.slice(0, 10));
                }
            } finally {
                setIsLoadingSuggestions(false);
            }
        }, 300);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [manualValue, mode]);

    const handleAutoDetect = () => {
        if (!navigator.geolocation) {
            onError?.("Tu navegador no soporta geolocalización.");
            return;
        }

        setIsDetecting(true);
        
        // Timeout de 10 segundos para la geolocalización
        const timeoutId = setTimeout(() => {
            setIsDetecting(false);
            onError?.("La geolocalización ha tardado demasiado. Por favor, introduce tu ubicación manualmente.");
            setMode('manual');
        }, 10000);

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                clearTimeout(timeoutId);
                const lat = parseFloat(pos.coords.latitude.toFixed(4));
                const lng = parseFloat(pos.coords.longitude.toFixed(4));

                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1&accept-language=es`);
                    const data = await res.json();
                    
                    const addr = data.address || {};
                    const city = addr.city || addr.town || addr.village || addr.municipality || "Desconocido";
                    const province = addr.province || addr.state_district || "Desconocida";
                    const community = addr.state || "España";

                    onChange({ community, province, city, lat, lng });
                    setMode('auto');
                } catch (e) {
                    onError?.("Error al obtener el nombre de la ciudad. Por favor, búscalo manualmente.");
                    setMode('manual');
                } finally {
                    setIsDetecting(false);
                }
            },
            (err) => {
                clearTimeout(timeoutId);
                setIsDetecting(false);
                let msg = "No se pudo obtener tu ubicación.";
                if (err.code === 1) msg = "Permiso de ubicación denegado. Por favor, búscalo manualmente.";
                else if (err.code === 2) msg = "Ubicación no disponible.";
                else if (err.code === 3) msg = "Tiempo de espera agotado.";
                
                onError?.(msg);
                setMode('manual');
            },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
        );
    };

    const handleSelectSuggestion = (displayLabel: string) => {
        const match = suggestions.find(s => s.displayLabel === displayLabel);
        if (match) {
            setManualValue(match.name);
            onChange({
                community: match.community,
                province: match.province,
                city: match.name,
                lat: match.lat,
                lng: match.lng,
                cityId: String(match.id)
            });
            setSuggestions([]);
        }
    };

    return (
        <div className="space-y-4">
            {mode === 'initial' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button 
                        type="button" 
                        onClick={handleAutoDetect} 
                        isLoading={isDetecting}
                        className="flex items-center gap-2 text-sm shadow-sm"
                        children={<><span className="text-lg">📍</span> Usar mi ubicación</>}
                    />
                    <Button 
                        type="button" 
                        variant="secondary" 
                        onClick={() => setMode('manual')}
                        className="flex items-center gap-2 text-sm shadow-sm"
                        children={<><span className="text-lg">🔍</span> Buscar por nombre</>}
                    />
                </div>
            )}

            {mode === 'auto' && (
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl animate-fade-in-up">
                    <div className="flex items-center gap-3">
                        <span className="text-xl">✅</span>
                        <div>
                            <p className="font-bold text-green-800 dark:text-green-300">Ubicación detectada</p>
                            <p className="text-xs text-green-600 dark:text-green-400">Pulsa cambiar si no es correcta.</p>
                        </div>
                    </div>
                    <button 
                        type="button" 
                        onClick={() => setMode('manual')}
                        className={`text-xs font-bold ${theme.textColor} underline p-2`}
                    >
                        Cambiar
                    </button>
                </div>
            )}

            {mode === 'manual' && (
                <div className="animate-fade-in-up relative z-[100]">
                    <AutocompleteInput 
                        id="location-search"
                        label="Ciudad o Municipio de España"
                        placeholder="Ej: Mérida, Alcantarilla, Madrid..."
                        value={manualValue}
                        onChange={setManualValue}
                        isLoading={isLoadingSuggestions}
                        suggestions={suggestions.map(s => s.displayLabel)}
                        onSelectSuggestion={handleSelectSuggestion}
                    />
                    <button 
                        type="button" 
                        onClick={() => { setMode('initial'); setManualValue(''); setSuggestions([]); }}
                        className="mt-3 text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 font-medium transition-colors"
                    >
                        ← Volver
                    </button>
                </div>
            )}
        </div>
    );
};

export default LocationSelector;
