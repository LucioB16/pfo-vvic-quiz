# PFO VVIC Quiz

**Practicá preguntas PFO VVIC en el navegador, con corrección inmediata y resultados al finalizar.**

Cuestionario estático hecho con Astro a partir de un banco versionado de **272 preguntas**. Podés practicar en orden o aleatoriamente; el ranking queda en el navegador y no requiere una cuenta.

**[Abrir el cuestionario](https://luciob16.github.io/pfo-vvic-quiz/)** · [Ver origen de las preguntas](PFO%20CORRECTAS%20VVIC.md)

| Respondé | Revisá | Medí tu avance |
| :-- | :-- | :-- |
| Elegí el orden y resolvé preguntas. | Conocé la opción correcta cuando respondés o salteás. | Consultá aciertos, errores, tiempo y ranking local. |

[![Astro](https://img.shields.io/badge/Astro-5-ff5d01?logo=astro&logoColor=white)](https://astro.build/)

## Cómo funciona

- Conversor reproducible desde `PFO CORRECTAS VVIC.md` hacia `src/data/questions.json`.
- 272 preguntas convertidas con exactamente una opcion correcta por pregunta.
- 38 bloques ambiguos excluidos y preservados en `conversion-excluded-blocks.md`.
- Inicio en orden original o aleatorio.
- Correccion inmediata por pregunta, con opcion correcta visible si la respuesta es incorrecta o salteada.
- Resultado final con correctas, incorrectas, porcentaje y tiempo total.
- Ranking local del navegador sin guardar respuestas individuales.
- Deploy automatico a GitHub Pages mediante GitHub Actions.

## Desarrollo local

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

## Estructura del repositorio

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

## Publicación

El sitio esta configurado para publicarse en GitHub Pages desde GitHub Actions al hacer push a `main`.

Configuracion relevante:

- `astro.config.mjs` usa `base: "/pfo-vvic-quiz"` para servir assets bajo el nombre del repositorio.
- `.github/workflows/deploy.yml` instala dependencias, valida el JSON, compila Astro y publica `dist`.
- El origen de Pages debe quedar en GitHub Actions. Si la API de GitHub no permite activarlo automaticamente, configurarlo en `Settings > Pages > Source > GitHub Actions`.

URL publicada:

```text
https://luciob16.github.io/pfo-vvic-quiz/
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
