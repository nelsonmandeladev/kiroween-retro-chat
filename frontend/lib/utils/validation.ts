/**
 * Validation utilities for user inputs
 */

export interface ValidationResult {
    isValid: boolean;
    error?: string;
}

/**
 * Validate group name
 * - Required
 * - Max 50 characters
 * - No leading/trailing whitespace
 */
export function validateGroupName(name: string): ValidationResult {
    if (!name || name.trim().length === 0) {
        return {
            isValid: false,
            error: "Group name is required",
        };
    }

    if (name !== name.trim()) {
        return {
            isValid: false,
            error: "Group name cannot have leading or trailing spaces",
        };
    }

    if (name.length > 50) {
        return {
            isValid: false,
            error: "Group name must be 50 characters or less",
        };
    }

    return { isValid: true };
}

/**
 * Validate group description
 * - Optional
 * - Max 200 characters if provided
 */
export function validateGroupDescription(description: string | null | undefined): ValidationResult {
    if (!description) {
        return { isValid: true };
    }

    if (description.length > 200) {
        return {
            isValid: false,
            error: "Description must be 200 characters or less",
        };
    }

    return { isValid: true };
}

/**
 * Validate group member count
 * - Minimum 3 members (including creator)
 */
export function validateGroupMemberCount(memberIds: string[]): ValidationResult {
    // Note: memberIds doesn't include the creator, so we need at least 2 additional members
    if (memberIds.length < 2) {
        return {
            isValid: false,
            error: "Groups must have at least 3 members (including you)",
        };
    }

    return { isValid: true };
}

/**
 * Validate message content
 * - Required
 * - Max 2000 characters
 * - Sanitize to prevent XSS
 */
export function validateMessageContent(content: string): ValidationResult {
    if (!content || content.trim().length === 0) {
        return {
            isValid: false,
            error: "Message cannot be empty",
        };
    }

    if (content.length > 2000) {
        return {
            isValid: false,
            error: "Message must be 2000 characters or less",
        };
    }

    return { isValid: true };
}

/**
 * Sanitize message content to prevent XSS
 * - Remove script tags
 * - Escape HTML entities
 * - Remove dangerous attributes
 */
export function sanitizeMessageContent(content: string): string {
    // Remove script tags
    let sanitized = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

    // Remove event handlers
    sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, "");
    sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, "");

    // Remove javascript: protocol
    sanitized = sanitized.replace(/javascript:/gi, "");

    // Escape HTML entities for display
    sanitized = sanitized
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;")
        .replace(/\//g, "&#x2F;");

    return sanitized;
}

/**
 * Validate display name
 * - Required
 * - Max 50 characters
 * - Allow special characters but sanitize for XSS
 */
export function validateDisplayName(displayName: string): ValidationResult {
    if (!displayName || displayName.trim().length === 0) {
        return {
            isValid: false,
            error: "Display name is required",
        };
    }

    if (displayName.length > 50) {
        return {
            isValid: false,
            error: "Display name must be 50 characters or less",
        };
    }

    return { isValid: true };
}

/**
 * Sanitize display name
 * - Allow special characters and formatting
 * - Remove dangerous HTML/JS
 */
export function sanitizeDisplayName(displayName: string): string {
    // Remove script tags
    let sanitized = displayName.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

    // Remove event handlers
    sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, "");
    sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, "");

    // Remove javascript: protocol
    sanitized = sanitized.replace(/javascript:/gi, "");

    return sanitized;
}

/**
 * Validate status message
 * - Optional
 * - Max 100 characters if provided
 */
export function validateStatusMessage(statusMessage: string | null | undefined): ValidationResult {
    if (!statusMessage) {
        return { isValid: true };
    }

    if (statusMessage.length > 100) {
        return {
            isValid: false,
            error: "Status message must be 100 characters or less",
        };
    }

    return { isValid: true };
}

/**
 * Validate email
 * - Required
 * - Valid email format
 */
export function validateEmail(email: string): ValidationResult {
    if (!email || email.trim().length === 0) {
        return {
            isValid: false,
            error: "Email is required",
        };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return {
            isValid: false,
            error: "Please enter a valid email address",
        };
    }

    return { isValid: true };
}

/**
 * Validate username
 * - Required
 * - 3-20 characters
 * - Alphanumeric and underscores only
 */
export function validateUsername(username: string): ValidationResult {
    if (!username || username.trim().length === 0) {
        return {
            isValid: false,
            error: "Username is required",
        };
    }

    if (username.length < 3) {
        return {
            isValid: false,
            error: "Username must be at least 3 characters",
        };
    }

    if (username.length > 20) {
        return {
            isValid: false,
            error: "Username must be 20 characters or less",
        };
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
        return {
            isValid: false,
            error: "Username can only contain letters, numbers, and underscores",
        };
    }

    return { isValid: true };
}

/**
 * Validate password
 * - Required
 * - Min 8 characters
 * - At least one uppercase, one lowercase, one number
 */
export function validatePassword(password: string): ValidationResult {
    if (!password || password.length === 0) {
        return {
            isValid: false,
            error: "Password is required",
        };
    }

    if (password.length < 8) {
        return {
            isValid: false,
            error: "Password must be at least 8 characters",
        };
    }

    if (!/[A-Z]/.test(password)) {
        return {
            isValid: false,
            error: "Password must contain at least one uppercase letter",
        };
    }

    if (!/[a-z]/.test(password)) {
        return {
            isValid: false,
            error: "Password must contain at least one lowercase letter",
        };
    }

    if (!/[0-9]/.test(password)) {
        return {
            isValid: false,
            error: "Password must contain at least one number",
        };
    }

    return { isValid: true };
}

/**
 * Validate file upload
 * - Check file size (max 5MB for profile pictures)
 * - Check file type (images only)
 */
export function validateFileUpload(
    file: File,
    options: {
        maxSizeMB?: number;
        allowedTypes?: string[];
    } = {}
): ValidationResult {
    const { maxSizeMB = 5, allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"] } = options;

    if (!file) {
        return {
            isValid: false,
            error: "No file selected",
        };
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
        return {
            isValid: false,
            error: `File size must be less than ${maxSizeMB}MB`,
        };
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
        return {
            isValid: false,
            error: `File type must be one of: ${allowedTypes.join(", ")}`,
        };
    }

    return { isValid: true };
}

/**
 * Validate search query
 * - Optional (can be empty for showing all results)
 * - Max 100 characters
 * - Sanitize for SQL injection prevention
 */
export function validateSearchQuery(query: string): ValidationResult {
    if (!query) {
        return { isValid: true };
    }

    if (query.length > 100) {
        return {
            isValid: false,
            error: "Search query must be 100 characters or less",
        };
    }

    return { isValid: true };
}

/**
 * Sanitize search query
 * - Remove SQL injection attempts
 * - Trim whitespace
 */
export function sanitizeSearchQuery(query: string): string {
    // Remove SQL keywords and special characters that could be used for injection
    let sanitized = query.trim();

    // Remove common SQL injection patterns
    sanitized = sanitized.replace(/['";\\]/g, "");
    sanitized = sanitized.replace(/--/g, "");
    sanitized = sanitized.replace(/\/\*/g, "");
    sanitized = sanitized.replace(/\*\//g, "");

    return sanitized;
}

/**
 * Batch validation helper
 * Returns all validation errors
 */
export function validateAll(
    validations: Array<{ field: string; result: ValidationResult }>
): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};

    validations.forEach(({ field, result }) => {
        if (!result.isValid && result.error) {
            errors[field] = result.error;
        }
    });

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
}
