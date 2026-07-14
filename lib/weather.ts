export type HomeWeather = {
  location: string
  temperature: number
  condition: string
  high: number
  low: number
  precipitationChance: number
  windMph: number
}

type GeoResult = { latitude: number; longitude: number; name: string; admin1?: string }

const weatherLabel = (code: number): string => {
  if (code === 0) return 'Clear'
  if (code <= 3) return 'Partly cloudy'
  if (code <= 48) return 'Foggy'
  if (code <= 67) return 'Rain'
  if (code <= 77) return 'Snow'
  if (code <= 82) return 'Rain showers'
  if (code <= 86) return 'Snow showers'
  return 'Thunderstorms'
}

export async function getHomeWeather(home: { city: string | null; state: string | null; zip: string | null }): Promise<HomeWeather | null> {
  const query = [home.city, home.state, home.zip].filter(Boolean).join(', ')
  if (!query) return null
  try {
    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`, { next: { revalidate: 86_400 } })
    if (!geoRes.ok) return null
    const geo = await geoRes.json() as { results?: GeoResult[] }
    const place = geo.results?.[0]
    if (!place) return null
    const params = new URLSearchParams({
      latitude: String(place.latitude), longitude: String(place.longitude),
      current: 'temperature_2m,weather_code,wind_speed_10m',
      daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max',
      temperature_unit: 'fahrenheit', wind_speed_unit: 'mph', timezone: 'auto', forecast_days: '1',
    })
    const forecastRes = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { next: { revalidate: 1_800 } })
    if (!forecastRes.ok) return null
    const forecast = await forecastRes.json() as {
      current?: { temperature_2m?: number; weather_code?: number; wind_speed_10m?: number }
      daily?: { temperature_2m_max?: number[]; temperature_2m_min?: number[]; precipitation_probability_max?: number[] }
    }
    if (forecast.current?.temperature_2m == null) return null
    return {
      location: [place.name, place.admin1].filter(Boolean).join(', '),
      temperature: Math.round(forecast.current.temperature_2m),
      condition: weatherLabel(forecast.current.weather_code ?? 0),
      high: Math.round(forecast.daily?.temperature_2m_max?.[0] ?? forecast.current.temperature_2m),
      low: Math.round(forecast.daily?.temperature_2m_min?.[0] ?? forecast.current.temperature_2m),
      precipitationChance: Math.round(forecast.daily?.precipitation_probability_max?.[0] ?? 0),
      windMph: Math.round(forecast.current.wind_speed_10m ?? 0),
    }
  } catch {
    return null
  }
}
