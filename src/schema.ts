import { Schema } from "effect/index";

export const TreeItem = Schema.Struct({
	path: Schema.String,
	url: Schema.URL,
});

export type TreeItem = Schema.Schema.Type<typeof TreeItem>;

export const FilesResponse = Schema.Struct({
	tree: Schema.Array(TreeItem),
	url: Schema.URL,
	truncated: Schema.Boolean,
	sha: Schema.String,
});

export type FilesResponse = Schema.Schema.Type<typeof FilesResponse>;
