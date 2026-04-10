import { createFileRoute } from "@tanstack/react-router";
import { getRepos } from "@/lib/github";
import App from "@/App";

export const Route = createFileRoute("/")({
  loader: () => getRepos(),
  component: Home,
});

function Home() {
  const repos = Route.useLoaderData();
  return <App repos={repos} />;
}
