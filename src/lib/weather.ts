import { createServerFn } from "@tanstack/react-start";

export interface Weather {
  tempF: number;
  tempC: number;
  code: number;
  isDay: boolean;
}

// vila chã, portugal
const LAT = 41.295;
const LON = -8.737;

const URL =
  `https://api.open-meteo.com/v1/forecast` +
  `?latitude=${LAT}&longitude=${LON}&current=temperature_2m,weather_code,is_day`;

export const getWeather = createServerFn({ method: "GET" }).handler(
  async (): Promise<Weather | null> => {
    try {
      // Open-Meteo is free and keyless; cache at the edge to stay polite.
      const res = await fetch(URL, {
        cf: { cacheTtl: 600, cacheEverything: true },
      } as RequestInit);
      if (!res.ok) return null;
      const data = (await res.json()) as {
        current?: { temperature_2m?: number; weather_code?: number; is_day?: number };
      };
      const current = data.current;
      if (current?.temperature_2m == null || current.weather_code == null) return null;
      return {
        tempF: Math.round(current.temperature_2m * 1.8 + 32),
        tempC: Math.round(current.temperature_2m),
        code: current.weather_code,
        isDay: current.is_day === 1,
      };
    } catch {
      return null;
    }
  },
);
