import {
	FetchHttpClient,
	HttpClient,
	HttpClientRequest,
} from "@effect/platform";

import { Array as Arr, Effect, Option, Schema } from "effect";
import { FilesResponse, type TreeItem } from "./schema";

export default class Github extends Effect.Service<Github>()(
	"registry-service",
	{
		dependencies: [FetchHttpClient.layer],
		effect: Effect.gen(function* () {
			const client = yield* HttpClient.HttpClient;

			const getRepositoryTree = Effect.fn("getRepositoryTree")(function* ({
				owner,
				repo,
				branch,
			}: {
				owner: string;
				repo: string;
				branch: string;
			}) {
				const httpClient = Option.fromNullable(process.env.GH_TOKEN).pipe(
					Option.map((token) =>
						client.pipe(
							HttpClient.mapRequest(
								HttpClientRequest.setHeader("Authorization", `Bearer ${token}`),
							),
						),
					),
					Option.getOrElse(() => client),
				);

				const { tree } = yield* httpClient
					.get(
						`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
					)
					.pipe(
						Effect.andThen((res) => res.json),
						Effect.andThen(Schema.decodeUnknown(FilesResponse)),
					);

				return tree;
			});

			const findFile = Effect.fn("findFile")(function* (
				tree: readonly TreeItem[],
				filepath: string,
			) {
				// const tree = yield* fetchRepositoryTree(owner, repo);
				const element = yield* Arr.findFirst(
					tree,
					(item) => item.path === `public/r/${filepath}`,
				);

				return element;
			});

			const getFileContent = Effect.fn("getFileContent")(function* (
				owner: string,
				repo: string,
				item: TreeItem,
			) {
				const response = yield* client
					.get(
						`https://raw.githubusercontent.com/${owner}/${repo}/refs/heads/main/${item.path}`,
					)
					.pipe(Effect.andThen((res) => res.json));

				return response;
			});

			const fetchFile = Effect.fn("fetchFile")(function* ({
				owner,
				repo,
				filepath,
				branch = "main",
			}: {
				owner: string;
				repo: string;
				filepath: string;
				branch?: string;
			}) {
				const tree = yield* getRepositoryTree({ owner, repo, branch });
				const file = yield* findFile(tree, filepath);
				const content = yield* getFileContent(owner, repo, file);

				return content;
			});

			return {
				fetchFile,
				getRepositoryTree,
			};
		}),
	},
) { }
