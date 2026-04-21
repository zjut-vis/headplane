import { dump } from "js-yaml";
import { beforeAll, beforeEach, describe, expect, test } from "vitest";

import { loadConfig, loadConfigEnv, loadConfigFile } from "~/server/config/load";

import { clearFakeFiles, createFakeFile } from "../setup/overlay-fs";

const writeYaml = (filePath: string, content: unknown) => {
  const yamlContent = dump(content);
  createFakeFile(filePath, yamlContent);
};

const baseConfig = {
  headscale: {
    url: "http://localhost:8080",
  },
  server: {
    cookie_secret: "thirtytwo-character-cookiesecret",
  },
};

const fullOidcConfig = {
  enabled: true,
  issuer: "https://accounts.google.com",
  client_id: "my-client-id",
  client_secret: "my-client-secret",
  headscale_api_key: "my-api-key",
};

describe("OIDC enabled configuration", () => {
  beforeAll(() => {
    clearFakeFiles();
  });

  test("oidc.enabled defaults to true when oidc section is present", async () => {
    const filePath = "/config/oidc-default-enabled.yaml";
    writeYaml(filePath, {
      ...baseConfig,
      oidc: {
        issuer: "https://accounts.google.com",
        client_id: "my-client-id",
        client_secret: "my-client-secret",
        headscale_api_key: "my-api-key",
      },
    });

    const config = await loadConfig(filePath);
    expect(config.oidc).toBeDefined();
    expect(config.oidc?.enabled).toBe(true);
  });

  test("oidc.enabled can be explicitly set to true", async () => {
    const filePath = "/config/oidc-explicit-true.yaml";
    writeYaml(filePath, {
      ...baseConfig,
      oidc: fullOidcConfig,
    });

    const config = await loadConfig(filePath);
    expect(config.oidc).toBeDefined();
    expect(config.oidc?.enabled).toBe(true);
  });

  test("oidc.enabled can be set to false to disable OIDC", async () => {
    const filePath = "/config/oidc-disabled.yaml";
    writeYaml(filePath, {
      ...baseConfig,
      oidc: {
        ...fullOidcConfig,
        enabled: false,
      },
    });

    const config = await loadConfig(filePath);
    expect(config.oidc).toBeDefined();
    expect(config.oidc?.enabled).toBe(false);
  });

  test("oidc section can be defined with enabled: false for templating purposes", async () => {
    const filePath = "/config/oidc-templating.yaml";
    writeYaml(filePath, {
      ...baseConfig,
      oidc: {
        enabled: false,
        issuer: "https://example.com",
        client_id: "placeholder-client-id",
        client_secret: "placeholder-client-secret",
        headscale_api_key: "placeholder-api-key",
      },
    });

    const config = await loadConfig(filePath);
    expect(config.oidc).toBeDefined();
    expect(config.oidc?.enabled).toBe(false);
    expect(config.oidc?.issuer).toBe("https://example.com");
    expect(config.oidc?.client_id).toBe("placeholder-client-id");
  });

  test("partial oidc config with enabled field can be parsed", async () => {
    const filePath = "/config/oidc-partial.yaml";
    writeYaml(filePath, {
      ...baseConfig,
      oidc: {
        enabled: false,
      },
    });

    // This should parse without error at the partial config level
    const partialConfig = await loadConfigFile(filePath);
    expect(partialConfig?.oidc?.enabled).toBe(false);
  });

  test("config without oidc section has undefined oidc", async () => {
    const filePath = "/config/no-oidc.yaml";
    writeYaml(filePath, baseConfig);

    const config = await loadConfig(filePath);
    expect(config.oidc).toBeUndefined();
  });
});

// Environment variable tests for oidc.enabled
const envVarSnapshot = { ...process.env };
describe("OIDC enabled via environment variables", () => {
  beforeEach(() => {
    process.env = { ...envVarSnapshot };
  });

  test("oidc.enabled can be set via HEADPLANE_OIDC__ENABLED env var", async () => {
    process.env.HEADPLANE_OIDC__ENABLED = "true";
    process.env.HEADPLANE_OIDC__ISSUER = "https://accounts.google.com";
    process.env.HEADPLANE_OIDC__CLIENT_ID = "my-client-id";

    const config = await loadConfigEnv();
    expect(config?.oidc?.enabled).toBe(true);
    expect(config?.oidc?.issuer).toBe("https://accounts.google.com");
  });

  test("oidc.enabled=false can be set via env var", async () => {
    process.env.HEADPLANE_OIDC__ENABLED = "false";
    process.env.HEADPLANE_OIDC__ISSUER = "https://accounts.google.com";
    process.env.HEADPLANE_OIDC__CLIENT_ID = "my-client-id";

    const config = await loadConfigEnv();
    expect(config?.oidc?.enabled).toBe(false);
    expect(config?.oidc?.issuer).toBe("https://accounts.google.com");
  });

  test("oidc.enabled can be set via env var to disable full OIDC config", async () => {
    process.env.HEADPLANE_HEADSCALE__URL = "http://localhost:8080";
    process.env.HEADPLANE_SERVER__COOKIE_SECRET = "thirtytwo-character-cookiesecret";
    process.env.HEADPLANE_OIDC__ENABLED = "false";
    process.env.HEADPLANE_OIDC__ISSUER = "https://accounts.google.com";
    process.env.HEADPLANE_OIDC__CLIENT_ID = "my-client-id";
    process.env.HEADPLANE_OIDC__CLIENT_SECRET = "my-client-secret";
    process.env.HEADPLANE_OIDC__HEADSCALE_API_KEY = "my-api-key";

    const config = await loadConfig("./non-existent-path.yaml");
    expect(config.oidc).toBeDefined();
    expect(config.oidc?.enabled).toBe(false);
    // All other OIDC fields should still be present
    expect(config.oidc?.issuer).toBe("https://accounts.google.com");
    expect(config.oidc?.client_id).toBe("my-client-id");
  });
});
