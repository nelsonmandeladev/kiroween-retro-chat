/**
 * Utility functions for handling custom display names with special characters
 * while preventing XSS attacks
 */

/**
 * Sanitize display name to prevent XSS while allowing special characters
 * Removes HTML tags and dangerous characters but allows Unicode and special symbols
 */
export function sanitizeDisplayName(displayName: string): string {
    if (!displayName) return "";

    // Remove HTML tags
    let sanitized = displayName.replace(/<[^>]*>/g, "");

    // Remove script-related content
    sanitized = sanitized.replace(/javascript:/gi, "");
    sanitized = sanitized.replace(/on\w+\s*=/gi, "");

    // Remove data URIs and other potentially dangerous protocols
    sanitized = sanitized.replace(/data:/gi, "");
    sanitized = sanitized.replace(/vbscript:/gi, "");

    // Trim and limit length
    sanitized = sanitized.trim().slice(0, 50);

    return sanitized;
}

/**
 * Format display name for rendering with MSN-style special characters
 * Preserves emojis, Unicode symbols, and special characters
 * Returns a safe string that can be rendered directly
 */
export function formatDisplayName(displayName: string): string {
    const sanitized = sanitizeDisplayName(displayName);

    // MSN Messenger allowed special characters and emojis
    // We preserve them after sanitization
    return sanitized;
}

/**
 * Validate display name
 * Returns error message if invalid, null if valid
 */
export function validateDisplayName(displayName: string): string | null {
    if (!displayName || displayName.trim().length === 0) {
        return "Display name cannot be empty";
    }

    if (displayName.length > 50) {
        return "Display name must be 50 characters or less";
    }

    // Check for HTML tags
    if (/<[^>]*>/g.test(displayName)) {
        return "Display name cannot contain HTML tags";
    }

    // Check for script content
    if (/javascript:/gi.test(displayName) || /on\w+\s*=/gi.test(displayName)) {
        return "Display name contains invalid characters";
    }

    return null;
}

/**
 * Allow special Unicode characters and emojis in display names
 * This is what makes MSN-style custom names fun!
 */
export function isValidDisplayNameCharacter(char: string): boolean {
    // Allow most Unicode characters except control characters
    const code = char.charCodeAt(0);

    // Disallow control characters (0-31, 127-159)
    if ((code >= 0 && code <= 31) || (code >= 127 && code <= 159)) {
        return false;
    }

    return true;
}

/**
 * Get display name preview (for profile editing)
 * Shows how the name will appear to others
 */
export function getDisplayNamePreview(displayName: string): string {
    return sanitizeDisplayName(displayName);
}
