import * as Sentry from "@sentry/bun";
import type { Resource } from "@effect/opentelemetry";
import { FetchHttpClient, type HttpClient, Path } from "@effect/platform";
import { BunRuntime } from "@effect/platform-bun/index";
import { Effect, Layer, Runtime, Schedule } from "effect";
import { Hono } from "hono";
import CacheWithTTL from "./cache";
import Github from "./github";
import { NodeSDKLive } from "./otel";

if (process.env.SENTRY_DSN) {
	Sentry.init({
		dsn: process.env.SENTRY_DSN,
	});
}

class Server extends Effect.Service<Server>()("shadcn-github-proxy", {
	dependencies: [
		NodeSDKLive,
		FetchHttpClient.layer,
		Path.layer,
		Github.Default,
	],
	scoped: Effect.gen(function* () {
		const github = yield* Github;
		const runtime = yield* Effect.runtime<
			Github | Path.Path | HttpClient.HttpClient | Resource.Resource
		>();

		const cache = new CacheWithTTL<any /* because it's the file content */>(
			60_000 * 60 /* 1 hour */,
		);

		const app = new Hono();

		yield* Effect.sync(cache.clearExpired).pipe(
			Effect.repeat(Schedule.spaced("1 minute")),
			Effect.forkDaemon,
		);

		app.all("/", (c) =>
			c.redirect("https://github.com/rawnly/shadcn-github-proxy"),
		);

		app.all("/healthz", (c) => {
			return c.body(null, 204);
		});

		app.get("/:owner/:repo/:filepath{.*\\.json}", (c) =>
			Runtime.runPromise(
				runtime,
				Effect.gen(function* () {
					const forceRefresh =
						c.req.query("force") === "true" || c.req.query("force") === "1";

					const owner = c.req.param("owner");
					const repo = c.req.param("repo");
					const filepath = c.req.param("filepath");

					yield* Effect.annotateCurrentSpan("http.method", c.req.method);
					yield* Effect.annotateCurrentSpan("http.path", c.req.path);
					yield* Effect.annotateCurrentSpan("registry-item", {
						owner,
						repo,
						filepath,
					});

					if (!forceRefresh && cache.has(`${owner}/${repo}/${filepath}`)) {
						yield* Effect.annotateCurrentSpan("cache.hit", true);
						yield* Effect.annotateCurrentSpan("http.status", 200);

						c.header("Cache-Control", "public, max-age=3600");
						c.header("X-Cache", "HIT");

						return c.json(cache.get(`${owner}/${repo}/${filepath}`), 200);
					}

					const fileContent = yield* github.fetchFile({
						owner,
						repo,
						filepath,
					});

					cache.set(`${owner}/${repo}/${filepath}`, fileContent);

					yield* Effect.annotateCurrentSpan("cache.hit", false);
					yield* Effect.annotateCurrentSpan("http.status", 200);

					return c.json(fileContent as any, 200);
				}).pipe(
					Effect.withSpan(`${c.req.method} ${c.req.path}`),
					Effect.tapErrorTag("NoSuchElementException", () =>
						Effect.annotateCurrentSpan("http.status", 404),
					),
					Effect.catchTag("NoSuchElementException", () => {
						return Effect.succeed(
							c.json(
								{
									error: "file not found",
								},
								404,
							),
						);
					}),
					Effect.tapError(Effect.logError),
				),
			),
		);

		const PORT = process.env.PORT || 8000;
		yield* Effect.log(`Server is running on port ${PORT}`);

		if (process.env.SENTRY_DSN) {
			yield* Effect.log("Sentry is enabled");
		}

		if (process.env.GH_TOKEN) {
			yield* Effect.log("Running with GitHub token authentication");
		} else {
			yield* Effect.log(
				"Running without GitHub token authentication, rate limits may apply",
			);
		}

		return Bun.serve({
			fetch: app.fetch,
			port: PORT,
		});
	}),
}) { }

BunRuntime.runMain(Layer.launch(Server.Default));
