# ggterm Demo Datasets

Sample datasets for learning and testing ggterm visualizations.

## Datasets

### iris.csv
Classic Fisher's Iris dataset - measurements of iris flowers from three species.

| Column | Type | Description |
|--------|------|-------------|
| sepal_length | numeric | Sepal length in cm |
| sepal_width | numeric | Sepal width in cm |
| petal_length | numeric | Petal length in cm |
| petal_width | numeric | Petal width in cm |
| species | categorical | setosa, versicolor, virginica |

**Best for**: Scatter plots, faceting, color by category, pair plots
```typescript
gg(iris)
  .aes({ x: 'sepal_length', y: 'petal_length', color: 'species' })
  .geom(geom_point())
```

---

### stocks.csv
Daily stock prices for three tech companies over January 2024.

| Column | Type | Description |
|--------|------|-------------|
| date | date | Trading date |
| symbol | categorical | AAPL, GOOGL, MSFT |
| price | numeric | Closing price |
| volume | numeric | Trading volume |

**Best for**: Time series, line charts, faceting by symbol
```typescript
gg(stocks)
  .aes({ x: 'date', y: 'price', color: 'symbol' })
  .geom(geom_line())
```

---

### weather.csv
Weekly weather data for four US cities.

| Column | Type | Description |
|--------|------|-------------|
| date | date | Date |
| city | categorical | Seattle, Austin, Boston, Denver |
| temp_high | numeric | High temperature (F) |
| temp_low | numeric | Low temperature (F) |
| precipitation | numeric | Precipitation (inches) |
| humidity | numeric | Humidity (%) |
| wind_speed | numeric | Wind speed (mph) |

**Best for**: Multi-variable comparisons, facet_grid, boxplots by city
```typescript
gg(weather)
  .aes({ x: 'city', y: 'temp_high' })
  .geom(geom_boxplot())
```

---

### experiment.csv
A/B test results from a hypothetical UX study.

| Column | Type | Description |
|--------|------|-------------|
| subject_id | numeric | Participant ID |
| treatment | categorical | control, treatment_a, treatment_b |
| response_time | numeric | Response time (ms) |
| accuracy | numeric | Accuracy score (0-1) |
| age_group | categorical | young, middle, senior |
| session | numeric | Session number (1 or 2) |

**Best for**: Boxplots, bar charts, grouped comparisons
```typescript
gg(experiment)
  .aes({ x: 'treatment', y: 'response_time', fill: 'treatment' })
  .geom(geom_boxplot())
```

---

### sensors.csv
IoT sensor readings over one hour from three sensors.

| Column | Type | Description |
|--------|------|-------------|
| timestamp | datetime | Reading timestamp |
| sensor_id | categorical | sensor_01, sensor_02, sensor_03 |
| temperature | numeric | Temperature (C) |
| pressure | numeric | Pressure (hPa) |
| humidity | numeric | Humidity (%) |
| status | categorical | normal, warning, alert, critical |

**Best for**: Time series, multi-panel plots, status coloring
```typescript
gg(sensors)
  .aes({ x: 'timestamp', y: 'temperature', color: 'status' })
  .geom(geom_line())
  .geom(geom_point())
  .facet(facet_wrap({ vars: 'sensor_id', ncol: 1 }))
```

## Loading Data

```typescript
import { readFileSync } from 'fs'

// Simple CSV parser (or use csv-parse, d3-dsv)
function loadCSV(path: string) {
  const text = readFileSync(path, 'utf-8')
  const lines = text.trim().split('\n')
  const headers = lines[0].split(',')
  return lines.slice(1).map(line => {
    const values = line.split(',')
    return Object.fromEntries(headers.map((h, i) => [h, values[i]]))
  })
}

const iris = loadCSV('examples/data/iris.csv')
```

## Type Coercion

Remember to convert numeric columns:

```typescript
const typed = data.map(row => ({
  ...row,
  sepal_length: Number(row.sepal_length),
  sepal_width: Number(row.sepal_width),
  // ...
}))
```
