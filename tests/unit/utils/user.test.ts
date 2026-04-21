import { describe, expect, test } from "vitest";

import type { User } from "~/types/User";

import { filterUsersWithValidIds, getUserDisplayName } from "~/utils/user";

const makeUser = (overrides: Partial<User>): User => ({
  id: "default-id",
  name: "",
  createdAt: "2024-01-01T00:00:00Z",
  ...overrides,
});

describe("filterUsersWithValidIds", () => {
  test("keeps users with valid ID and name", () => {
    const users = [makeUser({ id: "123", name: "John" })];
    const result = filterUsersWithValidIds(users);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("123");
  });

  test("keeps users with valid ID but no name", () => {
    const users = [makeUser({ id: "123", name: "" })];
    const result = filterUsersWithValidIds(users);
    expect(result).toHaveLength(1);
  });

  test("keeps users with valid ID and no optional fields", () => {
    const users = [makeUser({ id: "123", name: "", displayName: undefined, email: undefined })];
    const result = filterUsersWithValidIds(users);
    expect(result).toHaveLength(1);
  });

  test("removes users with empty ID", () => {
    const users = [makeUser({ id: "", name: "John" })];
    const result = filterUsersWithValidIds(users);
    expect(result).toHaveLength(0);
  });

  test("handles mix of valid and invalid", () => {
    const users = [
      makeUser({ id: "123", name: "John" }),
      makeUser({ id: "", name: "Jane" }),
      makeUser({ id: "456", name: "" }),
    ];
    const result = filterUsersWithValidIds(users);
    expect(result).toHaveLength(2);
    expect(result.map((u) => u.id)).toEqual(["123", "456"]);
  });

  test("returns empty for empty input", () => {
    expect(filterUsersWithValidIds([])).toHaveLength(0);
  });
});

describe("getUserDisplayName", () => {
  test("uses name when set", () => {
    const user = makeUser({ id: "123", name: "John" });
    expect(getUserDisplayName(user)).toBe("John");
  });

  test("uses displayName when name is empty", () => {
    const user = makeUser({ id: "123", name: "", displayName: "John Doe" });
    expect(getUserDisplayName(user)).toBe("John Doe");
  });

  test("uses email when name and displayName are empty", () => {
    const user = makeUser({ id: "123", name: "", displayName: "", email: "john@example.com" });
    expect(getUserDisplayName(user)).toBe("john@example.com");
  });

  test("uses id when everything else is empty", () => {
    const user = makeUser({ id: "123", name: "", displayName: "", email: "" });
    expect(getUserDisplayName(user)).toBe("123");
  });

  test("uses id when optional fields are undefined", () => {
    const user = makeUser({ id: "123", name: "", displayName: undefined, email: undefined });
    expect(getUserDisplayName(user)).toBe("123");
  });

  test("prefers name over displayName", () => {
    const user = makeUser({
      id: "123",
      name: "John",
      displayName: "John Doe",
      email: "john@example.com",
    });
    expect(getUserDisplayName(user)).toBe("John");
  });

  test("prefers displayName over email", () => {
    const user = makeUser({
      id: "123",
      name: "",
      displayName: "John Doe",
      email: "john@example.com",
    });
    expect(getUserDisplayName(user)).toBe("John Doe");
  });
});
