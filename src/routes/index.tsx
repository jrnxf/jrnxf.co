import { createFileRoute } from "@tanstack/react-router";
import { getRepos } from "@/lib/github";
import { getWeather } from "@/lib/weather";
import App from "@/App";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [repos, weather] = await Promise.all([getRepos(), getWeather()]);
    return { repos, weather };
  },
  head: () => ({
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300&family=Geist:wght@400;500;600&display=swap",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { repos, weather } = Route.useLoaderData();
  return <App repos={repos} weather={weather} />;
}
