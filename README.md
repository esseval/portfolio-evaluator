# Evaluador de Portafolio de Acciones

Aplicación web 100% del lado del cliente para evaluar y dar seguimiento a un portafolio de CEDEARs. Sin backend, sin dependencias externas, solo HTML + CSS + JavaScript vanilla.

## Características

- **Carga de portafolio** desde archivos JSON, CSV o formato TXT (con Posiciones y Transacciones)
- **Datos de mercado en tiempo real** via Yahoo Finance (sufijo `.BA` para CEDEARs cotizados en ARS)
- **Indicadores técnicos**: SMA, EMA, RSI, MACD, Bollinger Bands
- **Señales de compra/venta**: scoring ponderado basado en múltiples indicadores
- **Registro de transacciones**: compra/venta con actualización de precio promedio y efectivo disponible
- **Capital inicial**: permite definir el capital aportado para calcular ganancia/pérdida real
- **Gráfico de evolución patrimonial** con Canvas API
- **Reportes exportables**: TXT, CSV, JSON, copia al portapapeles, impresión
- **Persistencia local** via localStorage
- **Tema claro/oscuro**
- **Diseño responsive**

## Estructura del proyecto

```
portfolio-evaluator/
├── index.html              # Interfaz principal
├── css/styles.css          # Estilos responsive, tema claro/oscuro
├── js/
│   ├── app.js              # Controlador principal
│   ├── portfolio.js        # Gestión de portafolio (CRUD, parsing)
│   ├── market-data.js      # Obtención de datos de Yahoo Finance
│   ├── indicators.js       # Cálculo de indicadores técnicos
│   ├── signals.js          # Generación de señales compra/venta
│   ├── report.js           # Generación y exportación de reportes
│   ├── storage.js          # Persistencia en localStorage
│   └── utils.js            # Utilidades generales
└── data/
    ├── portfolio-sample.json
    ├── portfolio-sample.txt
    └── portfolio-sample.csv
```

## Cómo usar

1. Abrir `index.html` en el navegador (o servir via Apache/Nginx)
2. Cargar un archivo con las posiciones del portafolio:
   - **CSV/JSON**: formato estándar con ticker, nombre, cantidad y precio promedio
   - **acciones.txt**: formato nativo con transacciones históricas
3. Los precios se obtienen automáticamente de Yahoo Finance (tickers `.BA`)
4. La tabla muestra precio actual, rendimiento y señales para cada posición
5. Se pueden registrar transacciones de compra/venta manualmente
6. El gráfico de evolución patrimonial se actualiza diariamente
7. Reportes exportables desde el panel lateral

### Formato CSV

```csv
ticker,name,shares,avgPrice
AAPL,Apple Inc.,10,150.00
MSFT,Microsoft Corp.,5,280.00
```

### Formato JSON

```json
{
  "portfolio": [
    { "ticker": "AAPL", "name": "Apple Inc.", "shares": 10, "avgPrice": 150.00 }
  ]
}
```

### Formato TXT

```
AAPL	52600	14109
+	2	19250

CVX	128940	5970
+	3	16900	08/05/2026
+	2	18770	20/03/2026
```

Cada bloque separado por línea vacía. Primera línea: `TICKER\tcapitalActual\tganancia`. Líneas siguientes: `+\tCANTIDAD\tPRECIO\tFECHA` (compra) o `-\tCANTIDAD\tPRECIO\tFECHA` (venta).

## API de datos

Los datos de mercado se obtienen de **Yahoo Finance** a través de proxies CORS públicos (`corsproxy.io`, `api.allorigins.win`). Los tickers se consultan con sufijo `.BA` (BYMA) para obtener precios en pesos argentinos.

## Limitaciones

- Los proxies CORS públicos pueden tener límites de uso o estar caídos temporalmente
- Los datos son referenciales, no aptos para trading en vivo
- La aplicación no guarda datos en servidor, solo en localStorage del navegador

## Licencia

MIT
