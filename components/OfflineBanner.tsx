import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus.tsx';

const OfflineBanner = () => {
    const isOnline = useOnlineStatus();

    if (isOnline) {
        return null;
    }

    return (
        React.createElement("div", {
            className: "w-full bg-yellow-500 text-white text-center p-2 text-sm font-semibold sticky top-0 z-50",
            role: "alert"
        },
            "No tienes conexión a internet. Algunas funcionalidades pueden no estar disponibles."
        )
    );
};

export default OfflineBanner;