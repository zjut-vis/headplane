import type { User } from "~/types/User";

// Filter users with valid IDs (OIDC users may not have a name)
export function filterUsersWithValidIds(users: User[]): User[] {
  return users.filter((user) => user.id?.length > 0);
}

// Get display name with fallback: name -> displayName -> email -> id
export function getUserDisplayName(user: User): string {
  return user.name || user.displayName || user.email || user.id;
}
