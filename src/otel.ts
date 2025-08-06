import { NodeSdk } from "@effect/opentelemetry";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { SentrySpanProcessor } from "@sentry/opentelemetry";
import pkg from "../package.json";

export const NodeSDKLive = NodeSdk.layer(() => ({
	resource: {
		serviceName: "gh-registry",
		serviceVersion: pkg.version ?? "0.0.0",
	},
	spanProcessor: process.env.SENTRY_DSN
		? new SentrySpanProcessor()
		: new BatchSpanProcessor(new OTLPTraceExporter()),
}));
