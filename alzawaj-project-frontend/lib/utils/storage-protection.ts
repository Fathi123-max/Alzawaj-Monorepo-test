// Storage Protection Utilities
// Prevents localStorage from being cleared during error recovery

class StorageProtection {
  private static isProtected = false;
  private static protectedData: { [key: string]: string } = {};

  /**
   * Enable storage protection - prevents localStorage clearing
   */
  static enable() {
    this.isProtected = true;
    this.backupStorage();
    console.log("🔒 Storage protection enabled");
  }

  /**
   * Disable storage protection
   */
  static disable() {
    this.isProtected = false;
    this.protectedData = {};
    console.log("🔓 Storage protection disabled");
  }

  /**
   * Check if storage is currently protected
   */
  static isEnabled(): boolean {
    return this.isProtected;
  }

  /**
   * Backup current localStorage data
   */
  private static backupStorage() {
    try {
      this.protectedData = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          this.protectedData[key] = localStorage.getItem(key) || "";
        }
      }
    } catch (error) {
      console.error("Failed to backup localStorage:", error);
    }
  }

  /**
   * Restore localStorage from backup
   */
  static restore() {
    if (!this.isProtected) return;

    try {
      Object.entries(this.protectedData).forEach(([key, value]) => {
        if (value && !localStorage.getItem(key)) {
          localStorage.setItem(key, value);
        }
      });
      console.log("✅ Storage restored from protection backup");
    } catch (error) {
      console.error("Failed to restore localStorage:", error);
    }
  }

  /**
   * Wrapper for localStorage.removeItem that respects protection
   */
  static safeRemoveItem(key: string) {
    if (this.isProtected) {
      console.log(`🔒 Prevented removal of localStorage key: ${key}`);
      return;
    }
    localStorage.removeItem(key);
  }

  /**
   * Wrapper for localStorage.clear that respects protection
   */
  static safeClear() {
    if (this.isProtected) {
      console.log("🔒 Prevented localStorage.clear() during protection");
      return;
    }
    localStorage.clear();
  }
}

export { StorageProtection };
