# CLAUDE.md — Trepola

Guía para trabajar en este repo (Vite + React + Express/SSR, desplegado en Vercel).

## Estética frontend — evitar el "AI slop"

Por defecto tiendes a converger hacia resultados genéricos y "on distribution". Evita esto: crea interfaces distintivas que sorprendan, dentro del sistema de diseño de Trepola definido en `DESIGN.md`.

- Tipografía: usa las fuentes definidas en `DESIGN.md`. Nunca uses Inter, Roboto, Open Sans, Lato, Arial ni fuentes por defecto del sistema (`system-ui`) para componentes o contenido nuevo.
- Color y tema: compromete con una estética cohesiva definida en `DESIGN.md`; usa las variables de tema de Tailwind (`@theme` en `src/index.css`), no colores sueltos inventados sobre la marcha. Colores dominantes con acentos marcados superan a paletas tímidas y uniformemente distribuidas.
- Evita específicamente: gradientes morados sobre fondo blanco, layouts predecibles de "tres tarjetas iguales", y cualquier composición que parezca plantilla genérica de IA.
- Usa extremos tipográficos: pesos 100/200 vs 800/900 (no 400 vs 600), saltos de tamaño de 3x o más entre niveles jerárquicos donde aplique (no 1.5x).
- Una idea por bloque/sección. El espacio en blanco generoso es una elección de diseño, no un vacío que rellenar.
- Antes de construir o modificar cualquier componente visual nuevo (tarjetas, tablas, mockups de interfaz, gráficos), lee `DESIGN.md` primero. Esto es especialmente crítico para el renderer de bloques de artículo (`src/components/blocks/`), que es el punto donde este repo es más propenso a caer en un aspecto de plantilla si no se sigue el sistema de diseño.

Esta guía aplica a todo el repo, pero es de cumplimiento obligatorio para cualquier trabajo sobre el renderer de artículos interactivos.
