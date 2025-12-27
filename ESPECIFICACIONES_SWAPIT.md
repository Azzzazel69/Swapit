# Swapit - Especificaciones Técnicas y Funcionales (v1.2)

Este documento detalla el funcionamiento integral de **Swapit**, una plataforma de economía colaborativa basada en el trueque puro. Sirve como referencia para desarrolladores, analistas de producto y modelos de IA para comprender el ecosistema lógico y técnico de la aplicación.

---

## 1. Visión y Propósito
**Swapit** elimina la fricción del dinero en el intercambio de bienes. Su objetivo es maximizar la "liquidez de objetos" mediante un sistema de emparejamiento inteligente basado en la ubicación y el interés mutuo.

---

## 2. Arquitectura Lógica del Usuario

### 2.1. Ciclo de Vida del Usuario (Onboarding)
El alta de un usuario no se considera completa tras el registro inicial. Para garantizar una comunidad de alta calidad, el sistema impone un **Onboarding Guard** que bloquea el acceso a la Home hasta completar:
1.  **Registro Básico:** Email, Contraseña y Ubicación Inicial.
2.  **Verificación de Email:** Validación de identidad para prevenir bots.
3.  **Seguridad 2FA (Simulada):** Vinculación de un número de teléfono real.
4.  **Ubicación Precisa:** Selección mediante GPS o buscador oficial (OpenStreetMap) para definir el radio de intercambio.
5.  **Mapa de Intereses:** Selección de al menos 1 categoría favorita. Esto alimenta el algoritmo de recomendación.

### 2.2. Sistema de Reputación
*   **Valoración Transaccional:** Tras completar un intercambio, ambos usuarios se califican (1-10 estrellas).
*   **Badges de Confianza:** Los usuarios reciben insignias por validación de identidad (Email/Teléfono) y antigüedad.
*   **Estado de Cuenta:** El usuario puede ser "Suspendido" (Banned) por moderación, lo que oculta sus artículos y deshabilita su capacidad de enviar mensajes.

---

## 3. Lógica de la Landing Page (Home)

La Home es dinámica y jerárquica. Su orden de secciones está diseñado para maximizar la conversión (propuestas enviadas):

1.  **Matches Directos (⚡):** Artículos donde la reciprocidad es 1:1 (Tú tienes lo que busco y yo tengo lo que buscas).
2.  **Favoritos (❤️):** Ítems marcados manualmente por el usuario. Se oculta si está vacía.
3.  **Recomendados (Intereses):** Feed basado en las categorías seleccionadas en el onboarding.
4.  **Cerca de ti (📍):** Ordenación por proximidad geográfica (misma provincia/ciudad).
5.  **Tendencias (🔥):** Artículos con mayor ratio de "likes" y visualizaciones recientes.
6.  **Explorar (🌍):** Catálogo global por orden cronológico inverso.

### 3.1. Modos de Vista (Selector Superior)
El usuario puede salir del modo "Landing" para entrar en **Modos Foco**:
*   **Solo Cerca:** Aplica un filtro geográfico duro.
*   **Solo Favoritos:** Muestra un estado vacío interactivo si no hay marcados.

---

## 4. Logística de Intercambio y Match Engine

### 4.1. El Algoritmo de Match
El icono ⚡ (Match) se genera mediante una comparación de texto normalizado:
*   `Normalización:` Se eliminan acentos, se pasa a minúsculas y se calculan distancias de Levenshtein (edit distance).
*   `Criterio:` El Match Directo requiere que el `wishedItem` (artículo deseado) del Usuario A sea similar al `title` del artículo del Usuario B, **Y VICEVERSA**.

### 4.2. Flujo de Negociación
1.  **Propuesta:** El solicitante elige uno o varios artículos suyos (o una descripción de algo no listado) para ofrecer por el artículo deseado.
2.  **Chat Privado:** Se abre un canal de comunicación único para ese intercambio. Incluye mensajes de sistema automáticos (ej: "X ha propuesto un cambio").
3.  **Puntos de Encuentro:** El sistema integra un mapa para acordar el lugar físico. Permite calcular un **Punto Medio** entre las dos ubicaciones registradas.
4.  **Cierre:** Una vez aceptado y realizado, el intercambio pasa a estado `COMPLETED` y se habilita la valoración.

---

## 5. Estructura Técnica y Decisiones de Código

### 5.1. Stack Tecnológico
*   **Frontend:** React 19 (Vite) - Elegido por su rendimiento y ecosistema de hooks.
*   **Estilos:** Tailwind CSS - Permite un diseño "Mobile-First" extremadamente rápido y consistente mediante clases de utilidad.
*   **Hibridación:** Capacitor (Ionic) - Permite que la misma base de código web funcione como App Nativa (iOS/Android) accediendo a notificaciones push y GPS nativo.
*   **IA de Soporte:** Google Gemini API - Utilizada para la inicialización del cliente y preparada para futuras implementaciones de moderación de imágenes y generación de descripciones.

### 5.2. Gestión de Estado y Persistencia
*   **Simulación de API (ApiClient):** Se utiliza una arquitectura de servicios que centraliza todas las llamadas a `api.ts`. Actualmente utiliza `LocalStorage` para persistir datos entre sesiones, simulando una base de datos real.
*   **Custom Hooks:**
    *   `useAuth:` Centraliza la sesión, el token JWT y el estado global del usuario.
    *   `useColorTheme:` Sistema de tematización dinámica que cambia los colores de la app aleatoriamente por sesión para mantener la frescura visual.

### 5.3. Decisiones de Seguridad y Moderación
*   **Filtros de Contenido:** Se implementa un array de palabras prohibidas y reglas de moderación automáticas.
*   **Panel de Administración (Staff):** Existe un rol `SUPER_ADMIN` con acceso a una consola de control para resolver reportes, banear usuarios y auditar logs de acciones de moderación.

---

## 6. UX / UI Design System
*   **Tratamiento de Imágenes:** Las imágenes se redimensionan en cliente antes de la "subida" para ahorrar ancho de banda.
*   **Skeleton Loading:** Se utilizan estados de carga (Skeletons) que imitan la estructura de las tarjetas para reducir la percepción de espera.
*   **Accesibilidad:** Uso de ARIA labels y contrastes validados por el sistema de colores dinámico.

---
*Este documento es propiedad del proyecto Swapit y debe actualizarse con cada cambio mayor en el core logic.*