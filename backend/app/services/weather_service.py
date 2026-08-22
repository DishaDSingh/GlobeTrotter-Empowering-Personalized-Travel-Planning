import httpx

from app.schemas.destination import WeatherOut

_WEATHER_CODE_MAP = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Freezing fog",
    51: "Light drizzle",
    53: "Drizzle",
    55: "Heavy drizzle",
    61: "Light rain",
    63: "Rain",
    65: "Heavy rain",
    71: "Light snow",
    73: "Snow",
    75: "Heavy snow",
    80: "Rain showers",
    81: "Rain showers",
    82: "Violent rain showers",
    95: "Thunderstorm",
    96: "Thunderstorm with hail",
    99: "Thunderstorm with hail",
}


async def get_current_weather(latitude: float, longitude: float) -> WeatherOut:
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": "temperature_2m,precipitation_probability,wind_speed_10m,weather_code",
        "timezone": "auto",
    }
    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()
            current = data.get("current", {})
            code = current.get("weather_code")
            return WeatherOut(
                temperature_c=current.get("temperature_2m"),
                condition=_WEATHER_CODE_MAP.get(code, "Unknown"),
                precipitation_probability=current.get("precipitation_probability"),
                wind_kph=current.get("wind_speed_10m"),
                available=True,
            )
    except (httpx.HTTPError, httpx.TimeoutException, KeyError, ValueError):
        return WeatherOut(
            available=False,
            message="Weather data is temporarily unavailable. Please try again later.",
        )
