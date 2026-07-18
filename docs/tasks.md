# Sistema Evaluador de Portafolio de Acciones — Plan de Tareas

## Limitaciones técnicas
- Solo JavaScript del lado del cliente (navegador) — sin Node.js, sin backend, sin npm
- Solo APIs públicas y gratuitas, sin requerir API key si es posible
- Persistencia local via `localStorage` / `IndexedDB`
- Interfaz HTML + CSS + JS vanilla

---

## Fase 1: Estructura base del proyecto

- [ ] 1.1 Crear estructura de archivos del proyecto:
  ```
  portfolio-evaluator/
  ├── index.html
  ├── css/
  │   └── styles.css
  ├── js/
  │   ├── app.js              # Controlador principal
  │   ├── portfolio.js         # Gestión del portafolio (CRUD)
  │   ├── market-data.js       # Obtención de datos de mercado
  │   ├── indicators.js        # Cálculo de indicadores técnicos
  │   ├── signals.js           # Generación de señales compra/venta
  │   ├── report.js            # Generación de reportes
  │   ├── storage.js           # Persistencia local (localStorage/IndexedDB)
  │   └── utils.js             # Utilidades generales
  ├── data/
  │   ├── portfolio-sample.csv # Ejemplo de portafolio (formato sugerido)
  │   └── portfolio-sample.json
  └── docs/
      └── README.md
  ```
- [ ] 1.2 Crear `index.html` con layout básico: header, sidebar (resumen), main (vista principal)
- [ ] 1.3 Crear `css/styles.css` con diseño responsive, tema claro/oscuro opcional

## Fase 2: Carga y gestión del portafolio (archivo de instrumentos)

- [ ] 2.1 Definir formato JSON del portafolio:
  ```json
  {
    "portfolio": [
      { "ticker": "AAPL", "name": "Apple Inc.", "shares": 10, "avgPrice": 150.00 },
      { "ticker": "MSFT", "name": "Microsoft Corp.", "shares": 5, "avgPrice": 280.00 }
    ]
  }
  ```
- [ ] 2.2 Definir formato CSV equivalente:
  ```csv
  ticker,name,shares,avgPrice
  AAPL,Apple Inc.,10,150.00
  MSFT,Microsoft Corp.,5,280.00
  ```
- [ ] 2.3 Implementar carga de archivo via `<input type="file">` con soporte para `.json` y `.csv` en `portfolio.js`
- [ ] 2.4 Implementar parser CSV (sin librerías externas, split manual por comas/newlines, soportando encabezados)
- [ ] 2.5 Validar datos cargados: ticker requerido, shares > 0, avgPrice > 0
- [ ] 2.6 Mostrar tabla editable del portafolio en la UI
- [ ] 2.7 Permitir edición inline de cantidad/precio y eliminación de instrumentos

## Fase 3: Módulo de datos de mercado (APIs públicas)

- [ ] 3.1 Investigar y seleccionar API gratuita de precios (opciones):
  - **Yahoo Finance** — `https://query1.finance.yahoo.com/v8/finance/chart/AAPL` (no requiere key, CORS limitado — puede requerir proxy o `?format=json` + modo `no-cors`)
  - **Alpha Vantage** — requiere API key gratuita, límite 5 requests/minuto
  - **Finnhub** — API key gratuita, 60 requests/minuto
  - **IEX Cloud** — tier gratuito limitado
  - **Twelvedata** — API key gratuita limitada
  - **Binance API** pública para criptos (sin key para endpoints públicos, sin CORS issues)
- [ ] 3.2 Implementar `market-data.js` con fetch a la API seleccionada
- [ ] 3.3 Manejo de errores: API caída, límite de requests, ticker inválido
- [ ] 3.4 Cachear respuestas en `localStorage` con TTL configurable (evitar exceder límites)
- [ ] 3.5 Obtener precio actual, apertura, cierre anterior, high/low del día
- [ ] 3.6 Obtener datos históricos (mínimo 30-200 días para indicadores)
- [ ] 3.7 Alternativa: implementar usando múltiples APIs como fallback si una falla

## Fase 4: Cálculo de indicadores técnicos

- [ ] 4.1 Implementar **SMA** (Simple Moving Average) — períodos 10, 20, 50
- [ ] 4.2 Implementar **EMA** (Exponential Moving Average)
- [ ] 4.3 Implementar **RSI** (Relative Strength Index) — período 14
- [ ] 4.4 Implementar **MACD** (Moving Average Convergence Divergence)
- [ ] 4.5 Implementar **Bollinger Bands** (20,2)
- [ ] 4.6 Implementar **Volumen** — promedio y volumen relativo
- [ ] 4.7 Calcular rendimiento: % ganancia/pérdida desde precio de compra
- [ ] 4.8 Colocar todo en `indicators.js` usando solo arrays y matemática básica

## Fase 5: Generación de señales compra/venta

- [ ] 5.1 Definir lógica de señales en `signals.js`:
  - **COMPRA**: RSI < 30 (sobreventa), precio cruza arriba SMA(50), MACD bullish crossover, Bollinger squeeze + price touches lower band
  - **VENTA**: RSI > 70 (sobrecompra), precio cruza abajo SMA(50), MACD bearish crossover, precio toca banda superior de Bollinger
  - **MANTENER**: sin señales claras
- [ ] 5.2 Asignar peso/score a cada señal para generar recomendación: Fuerte Compra | Compra | Neutral | Venta | Fuerte Venta
- [ ] 5.3 Mostrar señal junto a cada instrumento en la tabla con colores (verde/rojo/amarillo)
- [ ] 5.4 Calcular señal general del portafolio basada en weighted sum

## Fase 6: Rastreo de transacciones (historial de compras y ventas)

- [ ] 6.1 Definir estructura de transacción:
  ```json
  {
    "id": "uuid",
    "date": "2025-01-15",
    "ticker": "AAPL",
    "type": "BUY" | "SELL",
    "shares": 10,
    "price": 150.00,
    "total": 1500.00
  }
  ```
- [ ] 6.2 Implementar registro de compra: actualiza cantidad + promedio ponderado
- [ ] 6.3 Implementar registro de venta: reduce cantidad, registra gain/loss realizado
- [ ] 6.4 Implementar forms para agregar transacciones manualmente
- [ ] 6.5 Persistir historial en `localStorage` via `storage.js`
- [ ] 6.6 Mostrar tabla de transacciones ordenada por fecha descendente
- [ ] 6.7 Calcular y mostrar realized P&L, unrealized P&L, y P&L total

## Fase 7: Evolución del patrimonio

- [ ] 7.1 Calcular patrimonio actual: `sum(ticker.shares * ticker.currentPrice) + cashBalance`
- [ ] 7.2 Obtener snapshots diarios del valor total del portafolio
- [ ] 7.3 Almacenar histórico de patrimonio en `localStorage`
- [ ] 7.4 Implementar gráfico de evolución patrimonial usando **Canvas API** (sin Chart.js, dibujo manual) o embed de TradingView Chart lightweight (aproximadamente 14KB, open source, funciona sin npm via CDN)
- [ ] 7.5 Opcional: calcular drawdown máximo, Sharpe ratio aproximado

## Fase 8: Dashboard y visualización

- [ ] 8.1 Resumen general: capital invertido, valor actual, ganancia/pérdida total, % rendimiento
- [ ] 8.2 Tabla de posiciones con:
  - Ticker | Cantidad | Precio Compra | Precio Actual | Rendimiento | Señal | Acciones
- [ ] 8.3 Mini gráfico de precio (Sparkline) para cada ticker usando Canvas
- [ ] 8.4 Dashboard de distribución sectorial/geográfica del portafolio (si datos disponibles)
- [ ] 8.5 Panel de alertas: tickers con señales fuertes, cambios de precio > 5% en el día

## Fase 9: Generación de reportes

- [ ] 9.1 Reporte resumen ejecutivo (texto plano con datos clave)
- [ ] 9.2 Reporte detallado CSV exportable con cada posición y su rendimiento
- [ ] 9.3 Reporte de transacciones (historial completo)
- [ ] 9.4 Reporte de evolución patrimonial (tabla + gráfico estático)
- [ ] 9.5 Implementar exportación:
  - Copiar al portapapeles (texto)
  - Descargar como `.txt`, `.csv`, `.json`
  - Imprimir (window.print)
- [ ] 9.6 Implementar en `report.js` generando contenido dinámico

## Fase 10: UX/UI y refinamientos

- [ ] 10.1 Implementar modo offline: detectar estado de red, usar datos cacheados
- [ ] 10.2 Añadir barra de progreso / indicador de carga al obtener datos de mercado
- [ ] 10.3 Manejo de errores amigable: toast notifications para errores de API, archivos inválidos
- [ ] 10.4 Auto-refresh opcional de precios cada 5-15 minutos
- [ ] 10.5 Persistencia automática: guardar automáticamente en `localStorage` tras cada cambio
- [ ] 10.6 Soporte para múltiples portafolios (cargar/guardar con nombre)

## Fase 11: Pruebas y documentación

- [ ] 11.1 Probar carga de archivos JSON y CSV mal formados
- [ ] 11.2 Probar cada indicador con datos conocidos (comparar contra valores calculados manualmente)
- [ ] 11.3 Probar flujo completo: cargar portafolio → obtener precios → ver señales → registrar transacción → ver reporte
- [ ] 11.4 Probar exportación de reportes
- [ ] 11.5 Probar en múltiples navegadores (Chrome, Firefox, Edge)
- [ ] 11.6 Documentar el sistema en `docs/README.md`

---

## APIs Públicas Recomendadas

| API | Ideal para | API Key | Límite | CORS |
|-----|-----------|---------|--------|------|
| Yahoo Finance (no oficial) | Precios + históricos | No | ~100 req/min | Sí (con restricciones) |
| Alpha Vantage | Precios + fundamental | Sí (gratis) | 5 req/min | Sí |
| Finnhub | Precios + noticias | Sí (gratis) | 60 req/min | Sí |
| Binance API | Criptomonedas | No (endpoints públicos) | 1200 req/min | Sí |
| IEX Cloud | Acciones USA | Sí (tier gratis) | 50,000 req/mes | Sí |
| Twelve Data | Acciones globales | Sí (gratis) | 800 req/día | Sí |

**Recomendación primaria:** Yahoo Finance (sin key, mayor disponibilidad de datos históricos). Fallback: Alpha Vantage o Finnhub.

---

## Checklist rápido de entregables

- [ ] `index.html` con estructura completa
- [ ] `css/styles.css` con diseño funcional
- [ ] `js/storage.js` — persistencia localStorage
- [ ] `js/portfolio.js` — carga CSV/JSON, CRUD posiciones
- [ ] `js/market-data.js` — fetch a APIs de mercado
- [ ] `js/indicators.js` — SMA, EMA, RSI, MACD, Bollinger Bands
- [ ] `js/signals.js` — lógica compra/venta/neutral
- [ ] `js/report.js` — reportes exportables
- [ ] `js/utils.js` — helpers
- [ ] `js/app.js` — orquestador
- [ ] `data/portfolio-sample.json` — archivo de ejemplo
- [ ] `data/portfolio-sample.csv` — archivo de ejemplo
- [ ] `docs/README.md` — documentación
