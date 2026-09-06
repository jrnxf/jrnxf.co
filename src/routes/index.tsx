import { createFileRoute } from "@tanstack/react-router";
import { getRepos } from "@/lib/github";
import { getWeather } from "@/lib/weather";
import App from "@/App";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [repos, weather] = await Promise.all([getRepos(), getWeather()]);
    return { repos, weather };
  },
  component: Home,
});

function Home() {
  const { repos, weather } = Route.useLoaderData();
  return <App repos={repos} weather={weather} />;
}
