
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
}

interface LocationSelectorProps {
    onChange: (data: LocationResult) => void;
    onError?: (msg: string) => void;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({ onChange, onError }) => {
    const { theme } = useColorTheme();
    const [mode, setMode] = useState<'initial' | 'auto' | 'manual'>('initial');
    const [isDetecting, setIsDetecting] = useState(false);
    const [manualValue, setManualValue] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

    // Lógica de búsqueda híbrida (Local + API)
    useEffect(() => {
        const query = manualValue.trim().toLowerCase();
        if (mode !== 'manual' || query.length < 2) {
            setSuggestions([]);
            return;
        }

        // 1. Prioridad: Búsqueda en nuestra base de datos local de España (Instantánea)
        const localMatches = FLAT_MUNICIPALITIES.filter(m => 
            m.muniName.toLowerCase().startsWith(query) || 
            m.label.toLowerCase().includes(query)
        ).map(m => ({
            id: m.id,
            name: m.muniName,
            province: m.provName,
            community: m.commName,
            lat: m.lat,
            lng: m.lng,
            isLocal: true,
            displayLabel: m.label
        }));

        // Si tenemos muchos matches locales, los mostramos ya
        if (localMatches.length > 5) {
            setSuggestions(localMatches.slice(0, 10));
            return;
        }

        // 2. Si hay pocos matches o queremos ser exhaustivos, consultamos la API
        const timer = setTimeout(async () => {
            setIsLoadingSuggestions(true);
            try {
                const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=es&addressdetails=1&format=json&limit=20&accept-language=es`;
                const res = await fetch(url);
                const data = await res.json();

                if (!Array.isArray(data)) return;

                const apiResults = data
                    .filter((item: any) => {
                        const type = item.addresstype || item.type;
                        // Filtramos para quedarnos solo con lugares poblados (ciudades, pueblos, aldeas)
                        return ['city', 'town', 'village', 'municipality', 'hamlet', 'administrative'].includes(type);
                    })
                    .map((item: any) => {
                        const addr = item.address;
                        const name = addr.city || addr.town || addr.village || addr.municipality || item.display_name.split(',')[0];
                        const province = addr.province || addr.state_district || "";
                        return {
                            id: item.place_id,
                            name,
                            province,
                            community: addr.state || "",
                            lat: parseFloat(item.lat),
                            lng: parseFloat(item.lon),
                            isLocal: false,
                            displayLabel: province ? `${name} (${province})` : name
                        };
                    });

                // Combinamos local y API evitando duplicados
                const combined = [...localMatches];
                apiResults.forEach(apiRes => {
                    const exists = combined.some(c => 
                        c.name.toLowerCase() === apiRes.name.toLowerCase() && 
                        c.province.toLowerCase() === apiRes.province.toLowerCase()
                    );
                    if (!exists) combined.push(apiRes);
                });

                // Ordenar: Primero los que EMPIEZAN por la query, luego por importancia
                combined.sort((a, b) => {
                    const startsA = a.name.toLowerCase().startsWith(query) ? 1 : 0;
                    const startsB = b.name.toLowerCase().startsWith(query) ? 1 : 0;
                    return startsB - startsA;
                });

                setSuggestions(combined.slice(0, 10));
            } catch (e) {
                console.error("Error API:", e);
                setSuggestions(localMatches); // Fallback a lo que tengamos local
            } finally {
                setIsLoadingSuggestions(false);
            }
        }, 350);

        return () => clearTimeout(timer);
    }, [manualValue, mode]);

    const handleAutoDetect = () => {
        if (!navigator.geolocation) {
            onError?.("Tu navegador no soporta geolocalización.");
            return;
        }

        setIsDetecting(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
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
                    setMode('manual');
                } finally {
                    setIsDetecting(false);
                }
            },
            () => {
                setIsDetecting(false);
                setMode('manual');
            }
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
                        placeholder="Escribe 'Ba' para Barcelona, 'Ge' para Getafe..."
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
