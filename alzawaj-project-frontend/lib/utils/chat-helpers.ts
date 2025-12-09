// Helper functions for chat functionality

/**
 * Constructs a full name from firstname and lastname
 * Falls back to "مستخدم" if no name is available
 */
export function getUserFullName(user: any): string {
  if (!user) return "مستخدم";

  // Try firstname + lastname
  if (user.firstname && user.lastname) {
    return `${user.firstname} ${user.lastname}`.trim();
  }

  // Try fullName field
  if (user.fullName) {
    return user.fullName;
  }

  // Try name field
  if (user.name) {
    return user.name;
  }

  // Try just firstname
  if (user.firstname) {
    return user.firstname;
  }

  // Try just lastname
  if (user.lastname) {
    return user.lastname;
  }

  return "مستخدم";
}

/**
 * Gets initials from a name for avatar display
 */
export function getInitials(name: string): string {
  if (!name) return "م";
  const words = name.trim().split(" ");
  if (words.length === 1) {
    return words[0]?.charAt(0) || "";
  }
  return (words[0]?.charAt(0) || "") + (words[1]?.charAt(0) || "");
}
