import { describe, expect, test } from "bun:test";
import { createCaller } from "../server/root";

describe("example router", () => {
  test("example.hello returns the documented response shape", async () => {
    const trpc = createCaller({ session: null });

    const response = await trpc.example.hello({ name: "Template" });

    expect(response).toEqual({
      greeting: "Hello, Template!",
    });
    expect(typeof response.greeting).toBe("string");
  });

  test("example.hello applies default name when omitted", async () => {
    const trpc = createCaller({ session: null });
    const response = await trpc.example.hello({});

    expect(response).toEqual({
      greeting: "Hello, World!",
    });
  });

  test("example.billingReadiness requires authentication", async () => {
    const trpc = createCaller({ session: null });
    await expect(trpc.example.billingReadiness()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  test("example.adminSummary enforces role checks", async () => {
    const trpc = createCaller({
      session: {
        user: {
          id: "u_1",
          role: "user",
        },
      },
    } as never);

    await expect(trpc.example.adminSummary()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  test("example.billingReadiness allows roles with billing read permission", async () => {
    const trpc = createCaller({
      session: {
        user: {
          id: "u_2",
          role: "billing",
        },
      },
    } as never);

    const response = await trpc.example.billingReadiness();
    expect(response).toEqual({
      role: "billing",
      canViewBilling: true,
    });
  });
});
