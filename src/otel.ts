import { NodeSdk } from "@effect/opentelemetry";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";

export const NodeSDKLive = NodeSdk.layer(() => ({
	resource: {
		serviceName: "shadcn-github-proxy",
	},
	spanProcessor: new BatchSpanProcessor(new OTLPTraceExporter()),
}));
