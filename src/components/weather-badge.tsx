import type { Weather } from "@/lib/weather";
import {
  CloudAngledRainZapIcon,
  CloudAngledZapIcon,
  CloudBigRainIcon,
  CloudIcon,
  CloudLittleRainIcon,
  CloudMidRainIcon,
  CloudSlowWindIcon,
  CloudSnowIcon,
  Moon02Icon,
  MoonCloudIcon,
  Sun03Icon,
  SunCloud01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

// WMO weather interpretation codes, as reported by Open-Meteo.
function weatherIcon(code: number, isDay: boolean) {
  if (code <= 1) return isDay ? Sun03Icon : Moon02Icon;
  if (code === 2) return isDay ? SunCloud01Icon : MoonCloudIcon;
  if (code === 3) return CloudIcon;
  if (code === 45 || code === 48) return CloudSlowWindIcon;
  if (code <= 57) return CloudLittleRainIcon;
  if (code <= 63 || code === 80 || code === 81) return CloudMidRainIcon;
  if (code <= 67 || code === 82) return CloudBigRainIcon;
  if (code <= 77 || code === 85 || code === 86) return CloudSnowIcon;
  if (code === 95) return CloudAngledZapIcon;
  return CloudAngledRainZapIcon;
}

export function WeatherBadge({ weather }: { weather: Weather }) {
  return (
    <span className="flex items-center gap-1.5">
      {weather.temp}°
      <HugeiconsIcon icon={weatherIcon(weather.code, weather.isDay)} size={14} strokeWidth={1.5} />
    </span>
  );
}
