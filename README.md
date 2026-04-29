# PFO VVIC Quiz

[![Astro](https://img.shields.io/badge/Astro-5.x-ff5d01?logo=astro&logoColor=white)](https://astro.build/)
[![Deploy](https://github.com/LucioB16/pfo-vvic-quiz/actions/workflows/deploy.yml/badge.svg)](https://github.com/LucioB16/pfo-vvic-quiz/actions/workflows/deploy.yml)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Actions-222?logo=github)](https://pages.github.com/)
[![Storage](https://img.shields.io/badge/storage-localStorage-156f72)](#privacidad)
[![Questions](https://img.shields.io/badge/preguntas-272-315c9c)](src/data/questions.json)

Mini web estatica en Astro para practicar preguntas PFO VVIC desde un navegador. El cuestionario usa datos locales versionados en el repositorio y guarda un ranking solamente en `localStorage` cuando se completa un intento.

## Caracteristicas

- Conversor reproducible desde `PFO CORRECTAS VVIC.md` hacia `src/data/questions.json`.
- 272 preguntas convertidas con exactamente una opcion correcta por pregunta.
- 38 bloques ambiguos excluidos y preservados en `conversion-excluded-blocks.md`.
- Inicio en orden original o aleatorio.
- Correccion inmediata por pregunta, con opcion correcta visible si la respuesta es incorrecta o salteada.
- Resultado final con correctas, incorrectas, porcentaje y tiempo total.
- Ranking local del navegador sin guardar respuestas individuales.
- Deploy automatico a GitHub Pages mediante GitHub Actions.

## Estructura

```text
.
├── .github/workflows/deploy.yml
├── PFO CORRECTAS VVIC.md
├── conversion-excluded-blocks.md
├── astro.config.mjs
├── package.json
├── public/
│   └── favicon.svg
├── scripts/
│   ├── convert-questions.mjs
│   ├── conversion-utils.mjs
│   └── validate-questions.mjs
└── src/
    ├── data/questions.json
    ├── pages/index.astro
    └── styles/global.css
```

## Desarrollo

Requisitos locales:

- Bun 1.3 o superior.
- Node.js compatible con Astro.

Comandos:

```bash
bun install
bun run convert
bun run validate
bun run dev
bun run build
```

## Despliegue En GitHub Pages

El sitio esta configurado para publicarse en GitHub Pages desde GitHub Actions al hacer push a `main`.

Configuracion relevante:

- `astro.config.mjs` usa `base: "/pfo-vvic-quiz"` para servir assets bajo el nombre del repositorio.
- `.github/workflows/deploy.yml` instala dependencias, valida el JSON, compila Astro y publica `dist`.
- El origen de Pages debe quedar en GitHub Actions. Si la API de GitHub no permite activarlo automaticamente, configurarlo en `Settings > Pages > Source > GitHub Actions`.

URL esperada:

```text
https://LucioB16.github.io/pfo-vvic-quiz/
```

## Privacidad

La aplicacion no envia datos a servidores ni guarda informacion en la nube. El historial se escribe exclusivamente en `localStorage` del navegador y solo cuando se completa todo el cuestionario.

Cada registro local contiene:

- fecha y hora de finalizacion
- correctas
- incorrectas
- porcentaje
- tiempo total
- modo usado

No se guardan respuestas individuales.

## Licencia

No se declara una licencia de uso explicita para el contenido educativo incluido. El codigo de la mini web puede reutilizarse dentro de este repositorio.
