# DESIGN.md — Sistema de diseño de Trepola

## Atmósfera
Editorial, alto contraste, confiable. Fondo blanco limpio, texto casi negro, un único acento rojo (`#E11D3C`) reservado para: la etiqueta de categoría, botones primarios, elementos activos y énfasis en bloques interactivos. Nunca decorativo sin motivo.

> **Nota de alcance:** los tokens y fuentes de este documento aplican al **renderer de bloques de artículo** (`src/components/blocks/*`) y al cuerpo del artículo cuando `contentFormat === 'blocks'`. El chrome del sitio (navbar, footer, resto de la UI) sigue usando Cairo/Tajawal — no se toca como parte de esta funcionalidad. Un cambio de tipografía site-wide es una decisión de marca aparte, no incluida aquí.
>
> **Nota sobre el prototipo de referencia:** si en algún momento se comparte `/design-examples/articulo-ejemplo.html` (prototipo validado con el cliente), ese archivo pasa a ser la referencia de estilo por encima de este documento para el detalle visual de los componentes — los tokens de color/tipografía de más abajo se mantienen, pero la composición exacta de cada bloque debe reconciliarse contra ese archivo si difiere de las especificaciones de abajo.

## Tipografía
- Titulares: **Fraunces** (variable, óptico 9–144, pesos 100–900) — serif editorial con carácter, evita deliberadamente Inter/Roboto/Arial.
- Cuerpo de texto: **Public Sans** (pesos 400/500/700/900) — sans-serif humanista, distinta de Fraunces, con buen soporte de tildes/ñ para español.
- Pesos extremos: titulares en 800–900, cuerpo en 400. Nunca uses pesos intermedios (500–600) como única variación jerárquica.
- Saltos de tamaño grandes entre niveles jerárquicos (h1 vs h2 vs body: mínimo 1.6x, no 1.2x).
- Clases de utilidad: `font-headline` (Fraunces) y `font-body` (Public Sans), definidas como tokens de tema en `src/index.css`.

## Color
- Fondo: blanco (`#ffffff`) en el cuerpo del artículo; panel oscuro (`#1c2126`) solo en los mockups de interfaz (`ui-walkthrough`).
- Acento único: rojo `#E11D3C` — categoría, CTAs, elementos activos, bordes de énfasis. Token Tailwind: `bg-accent` / `text-accent` / `border-accent`.
- Texto: negro suave (`#101418`), texto secundario gris medio (`#5b6470`) — nunca grises intermedios sin propósito.
- Semántico:
  - Éxito: texto `#0f8a4a`, fondo `#e8f7ee` — tokens `text-success` / `bg-success-bg`.
  - Aviso: texto `#a15c00`, fondo `#fff4e0` — tokens `text-warning` / `bg-warning-bg`.
  - Info: texto `#1656c9`, fondo `#eaf3ff` — tokens `text-info` / `bg-info-bg`.

## Layout y espaciado
- Columna de lectura máxima ~760px — nunca ancho completo para texto largo.
- Espaciado generoso entre bloques (24–40px) — el espacio en blanco comunica jerarquía, no se rellena con más contenido.
- Bordes redondeados consistentes (8–12px) en todas las tarjetas/bloques.

## Qué evitar (anti-slop específico de Trepola)
- Nada de gradientes morados sobre blanco.
- Nada de layouts de "3 tarjetas idénticas en grid" salvo que el contenido lo pida genuinamente.
- Nada de Inter/Roboto/Arial/system-ui como fuente de ningún componente nuevo.
- Nada de iconos genéricos de stock sin relación con el contenido real (usar `lucide-react`, ya integrado en el repo, con el icono semánticamente correcto).

## Especificación visual por tipo de bloque

| Bloque | Composición |
|---|---|
| `stat-card` | Tarjeta con borde izquierdo `border-accent` grueso, número grande en `font-headline` 900, etiqueta pequeña debajo en `font-body` gris. |
| `comparison-table` | Tabla con cabecera oscura (`#1c2126`), celdas ✓ en verde (`text-success`) / ✗ en rojo-acento, usando iconos `Check`/`X` de lucide-react. |
| `bar-chart` | Barras horizontales con relleno degradado en tonos de `#E11D3C`, valor mostrado a la derecha de cada barra (implementado con `recharts`, ya dependencia del repo). |
| `steps` | Lista numerada; círculo numerado en `bg-accent text-white`, título en `font-headline` 800 + cuerpo en `font-body`. |
| `ui-walkthrough` | Panel oscuro (`#1c2126`) simulando una pantalla, con un "pin" circular blanco con anillo `border-accent` numerado sobre el elemento a pulsar, junto a un panel de explicación a la derecha/debajo. |
| `checklist` | Ítems con checkbox visual (cuadro con esquinas redondeadas, marca de verificación en acento al estar "completado" visualmente). |
| `timeline` | Línea vertical con marcadores circulares por evento, fecha en `font-headline` pequeño + texto en `font-body`. |
| `warning` | Caja `bg-warning-bg text-warning`, icono `AlertTriangle`. |
| `tip` | Caja `bg-info-bg text-info`, icono `Lightbulb`. |
| `verification-block` | Caja destacada `bg-success-bg`, icono `CheckCircle2`, pregunta + respuesta esperada. |
| `troubleshooting` | Acordeón nativo `<details>/<summary>` por cada problema→solución, sin JS adicional. |
| `decision-tree` | Pregunta en `font-headline`, ramas como tarjetas condicionales con su resultado. |
| `quiz` | Pregunta + opciones como botones reales (no `div` con `onClick`, por accesibilidad); al hacer clic, resalta correcto en verde / incorrecto en rojo-acento y muestra explicación. |
| `practice-block` | Tarjeta con borde `border-accent`, orientada a texto/instrucciones, visualmente emparentada con `stat-card` pero sin número protagonista. |
| `paragraph` | Texto `font-body` 400, dentro de la columna de lectura de 760px. |
| `heading` | `font-headline` 800/900, tamaño según `level` (h2/h3), respetando el salto jerárquico ≥1.6x. |

Todos los componentes deben ser responsive (mobile-first) y accesibles: foco visible en cualquier elemento interactivo, `alt`/`aria-label` donde un icono transmita significado.
