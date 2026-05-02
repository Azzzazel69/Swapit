import React, { useState, useEffect } from 'react';
import Button from './Button.tsx';
import { ICONS } from '../constants.tsx';

const AVATAR_OPTIONS = {
    top: ['hat','hijab','turban','winterHat1','winterHat02','winterHat03','winterHat04','bob','bun','curly','curvy','dreads','frida','fro','froBand','longButNotTooLong','miaWallace','shavedSides','straight02','straight01','straightAndStrand','dreads01','dreads02','frizzle','shaggy','shaggyMullet','shortCurly','shortFlat','shortRound','shortWaved','sides','theCaesar','theCaesarAndSidePart','bigHair'],
    hairColor: ['a55728','2c1b18','b58143','d6b370','724133','4a312c','f59797','ecdcbf','c93305','e8e1e1'],
    accessories: ['kurt','prescription01','prescription02','round','sunglasses','wayfarers','eyepatch'],
    facialHair: ['beardLight','beardMajestic','beardMedium','moustacheFancy','moustacheMagnum'],
    clothing: ['blazerAndShirt','blazerAndSweater','collarAndSweater','graphicShirt','hoodie','overall','shirtCrewNeck','shirtScoopNeck','shirtVNeck'],
    eyes: ['closed','cry','default','eyeRoll','happy','hearts','side','squint','surprised','winkWacky','wink','xDizzy'],
    mouth: ['concerned','default','disbelief','eating','grimace','sad','screamOpen','serious','smile','tongue','twinkle','vomit'],
    skinColor: ['614335','d08b5b','ae5d29','edb98a','ffdbb4','fd9841','f8d25c']
};

const AvatarEditorModal = ({ isOpen, onClose, initialUrl, onSave }) => {
    const [options, setOptions] = useState({
        top: 'shortFlat',
        hairColor: '2c1b18',
        accessories: '',
        facialHair: '',
        clothing: 'hoodie',
        eyes: 'default',
        mouth: 'smile',
        skinColor: 'ffdbb4'
    });

    useEffect(() => {
        if (!initialUrl) return;
        try {
            const urlObj = new URL(initialUrl);
            if (urlObj.hostname === 'api.dicebear.com') {
                const params = urlObj.searchParams;
                setOptions({
                    top: params.get('top') || 'shortFlat',
                    hairColor: params.get('hairColor') || '2c1b18',
                    accessories: params.get('accessories') || '',
                    facialHair: params.get('facialHair') || '',
                    clothing: params.get('clothing') || 'hoodie',
                    eyes: params.get('eyes') || 'default',
                    mouth: params.get('mouth') || 'smile',
                    skinColor: params.get('skinColor') || 'ffdbb4'
                });
            }
        } catch (e) {
            // keep defaults
        }
    }, [initialUrl]);

    if (!isOpen) return null;

    const generateUrl = () => {
        const baseUrl = 'https://api.dicebear.com/7.x/avataaars/svg?';
        const params = new URLSearchParams();
        params.append('seed', 'SWAPIT');
        Object.entries(options).forEach(([k, v]) => {
            if (v) params.append(k, v);
        });
        return baseUrl + params.toString();
    };

    const handleSave = () => {
        onSave(generateUrl());
        onClose();
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setOptions(prev => ({ ...prev, [name]: value }));
    };

    const OptionSelect = ({ label, name, optionsArray }) => (
        <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-500 mb-1 capitalize">{label}</label>
            <select name={name} value={options[name]} onChange={handleChange} className="border border-gray-300 dark:border-gray-600 rounded p-1 bg-white dark:bg-gray-700 text-sm">
                <option value="">(Ninguno)</option>
                {optionsArray.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
            </select>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                    <h3 className="font-black text-lg">Editor de Avatar</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-white">
                        {ICONS.close}
                    </button>
                </div>
                <div className="p-6 overflow-y-auto max-h-[70vh]">
                    <div className="flex justify-center mb-6">
                        <img src={generateUrl()} className="w-40 h-40 rounded-full border-4 border-gray-100 shadow-md bg-white" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <OptionSelect label="Peinado" name="top" optionsArray={AVATAR_OPTIONS.top} />
                        <OptionSelect label="Color Pelo" name="hairColor" optionsArray={AVATAR_OPTIONS.hairColor} />
                        <OptionSelect label="Ojos" name="eyes" optionsArray={AVATAR_OPTIONS.eyes} />
                        <OptionSelect label="Boca" name="mouth" optionsArray={AVATAR_OPTIONS.mouth} />
                        <OptionSelect label="Ropa" name="clothing" optionsArray={AVATAR_OPTIONS.clothing} />
                        <OptionSelect label="Piel" name="skinColor" optionsArray={AVATAR_OPTIONS.skinColor} />
                        <OptionSelect label="Gafas/Acc..." name="accessories" optionsArray={AVATAR_OPTIONS.accessories} />
                        <OptionSelect label="Barba/Bigote" name="facialHair" optionsArray={AVATAR_OPTIONS.facialHair} />
                    </div>
                    <div className="mt-4 flex justify-center">
                        <button 
                            className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-bold hover:bg-blue-200"
                            onClick={() => {
                                const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
                                setOptions({
                                    top: randomItem(AVATAR_OPTIONS.top),
                                    hairColor: randomItem(AVATAR_OPTIONS.hairColor),
                                    accessories: Math.random() > 0.5 ? randomItem(AVATAR_OPTIONS.accessories) : '',
                                    facialHair: Math.random() > 0.7 ? randomItem(AVATAR_OPTIONS.facialHair) : '',
                                    clothing: randomItem(AVATAR_OPTIONS.clothing),
                                    eyes: randomItem(AVATAR_OPTIONS.eyes),
                                    mouth: randomItem(AVATAR_OPTIONS.mouth),
                                    skinColor: randomItem(AVATAR_OPTIONS.skinColor)
                                });
                            }}
                        >
                            🎲 Aleatorio
                        </button>
                    </div>
                </div>
                <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-end gap-2">
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave}>Guardar Avatar</Button>
                </div>
            </div>
        </div>
    );
};

export default AvatarEditorModal;
