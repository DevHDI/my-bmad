import { describe, it, expect, afterEach, vi } from "vitest";
import { APIError } from "better-auth/api";
import {
  assertRegistrationAllowed,
  isRegistrationAllowed,
} from "@/lib/auth/registration";

vi.mock("@/lib/db/client", () => ({ prisma: {} }));

const newUser = {
  id: "u1",
  email: "stranger@example.com",
  name: "Stranger",
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("isRegistrationAllowed", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns true only when ALLOW_REGISTRATION is exactly \"true\"", () => {
    vi.stubEnv("ALLOW_REGISTRATION", "true");
    expect(isRegistrationAllowed({ email: "a@example.com" })).toBe(true);
  });

  it.each(["", "false", "TRUE", "1", "yes"])(
    "returns false when ALLOW_REGISTRATION is %j",
    (value) => {
      vi.stubEnv("ALLOW_REGISTRATION", value);
      expect(isRegistrationAllowed({ email: "a@example.com" })).toBe(false);
    }
  );
});

describe("assertRegistrationAllowed", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("throws a FORBIDDEN APIError when registration is closed", () => {
    vi.stubEnv("ALLOW_REGISTRATION", "false");
    expect(() => assertRegistrationAllowed({ email: "a@example.com" })).toThrow(APIError);
    try {
      assertRegistrationAllowed({ email: "a@example.com" });
    } catch (error) {
      expect((error as APIError).status).toBe("FORBIDDEN");
      expect((error as APIError).message).toBe("Registration is disabled");
    }
  });

  it("does not throw when registration is open", () => {
    vi.stubEnv("ALLOW_REGISTRATION", "true");
    expect(() => assertRegistrationAllowed({ email: "a@example.com" })).not.toThrow();
  });
});

describe("auth user.create database hook", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  async function getUserCreateHook() {
    const { auth } = await import("@/lib/auth/auth");
    const before = auth.options.databaseHooks?.user?.create?.before;
    expect(before).toBeTypeOf("function");
    return before!;
  }

  it("blocks new users (e.g. GitHub OAuth) when registration is closed", async () => {
    vi.stubEnv("ALLOW_REGISTRATION", "false");
    const before = await getUserCreateHook();
    await expect(before(newUser, null)).rejects.toBeInstanceOf(APIError);
  });

  it("lets new users through when registration is open", async () => {
    vi.stubEnv("ALLOW_REGISTRATION", "true");
    const before = await getUserCreateHook();
    await expect(before(newUser, null)).resolves.toBeUndefined();
  });
});
