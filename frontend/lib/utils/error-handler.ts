import { toast } from "sonner";

/**
 * Error types for better error handling
 */
export enum ErrorType {
    NETWORK = "NETWORK",
    AUTHENTICATION = "AUTHENTICATION",
    AUTHORIZATION = "AUTHORIZATION",
    VALIDATION = "VALIDATION",
    NOT_FOUND = "NOT_FOUND",
    SERVER = "SERVER",
    UNKNOWN = "UNKNOWN",
}

/**
 * Custom error class with additional context
 */
export class AppError extends Error {
    type: ErrorType;
    statusCode?: number;
    details?: unknown;
    retryable: boolean;

    constructor(
        message: string,
        type: ErrorType = ErrorType.UNKNOWN,
        statusCode?: number,
        details?: unknown,
        retryable: boolean = false
    ) {
        super(message);
        this.name = "AppError";
        this.type = type;
        this.statusCode = statusCode;
        this.details = details;
        this.retryable = retryable;
    }
}

/**
 * Parse HTTP error responses and create AppError instances
 */
export function parseHttpError(error: unknown, defaultMessage: string = "An error occurred"): AppError {
    // Handle AppError instances
    if (error instanceof AppError) {
        return error;
    }

    // Handle standard Error instances
    if (error instanceof Error) {
        // Check for network errors
        if (error.message.includes("fetch") || error.message.includes("network")) {
            return new AppError(
                "Network error. Please check your connection.",
                ErrorType.NETWORK,
                undefined,
                error,
                true
            );
        }

        // Check for HTTP status codes in error message
        const statusMatch = error.message.match(/status:\s*(\d+)/);
        if (statusMatch) {
            const statusCode = parseInt(statusMatch[1], 10);
            return createErrorFromStatus(statusCode, error.message, error);
        }

        return new AppError(error.message, ErrorType.UNKNOWN, undefined, error, false);
    }

    // Handle unknown error types
    return new AppError(defaultMessage, ErrorType.UNKNOWN, undefined, error, false);
}

/**
 * Create AppError from HTTP status code
 */
function createErrorFromStatus(statusCode: number, message: string, originalError?: unknown): AppError {
    switch (statusCode) {
        case 400:
            return new AppError(message, ErrorType.VALIDATION, statusCode, originalError, false);
        case 401:
            return new AppError("You need to log in to continue.", ErrorType.AUTHENTICATION, statusCode, originalError, false);
        case 403:
            return new AppError("You don't have permission to perform this action.", ErrorType.AUTHORIZATION, statusCode, originalError, false);
        case 404:
            return new AppError("The requested resource was not found.", ErrorType.NOT_FOUND, statusCode, originalError, false);
        case 500:
        case 502:
        case 503:
        case 504:
            return new AppError("Server error. Please try again later.", ErrorType.SERVER, statusCode, originalError, true);
        default:
            return new AppError(message, ErrorType.UNKNOWN, statusCode, originalError, false);
    }
}

/**
 * Display error toast with retry option if applicable
 */
export function showErrorToast(error: AppError, onRetry?: () => void): void {
    const action = error.retryable && onRetry
        ? {
            label: "Retry",
            onClick: onRetry,
        }
        : undefined;

    toast.error(error.message, {
        description: error.details ? String(error.details) : undefined,
        action,
        duration: error.retryable ? 6000 : 4000,
    });
}

/**
 * Handle errors with automatic toast display
 */
export function handleError(error: unknown, onRetry?: () => void, customMessage?: string): AppError {
    const appError = parseHttpError(error, customMessage);
    showErrorToast(appError, onRetry);
    return appError;
}

/**
 * Group-specific error messages
 */
export function handleGroupError(error: unknown, onRetry?: () => void): AppError {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Check for specific group errors
    if (errorMessage.includes("not a member") || errorMessage.includes("NOT_GROUP_MEMBER")) {
        const appError = new AppError(
            "You are not a member of this group.",
            ErrorType.AUTHORIZATION,
            403,
            error,
            false
        );
        showErrorToast(appError);
        return appError;
    }

    if (errorMessage.includes("not an admin") || errorMessage.includes("NOT_GROUP_ADMIN")) {
        const appError = new AppError(
            "Only group admins can perform this action.",
            ErrorType.AUTHORIZATION,
            403,
            error,
            false
        );
        showErrorToast(appError);
        return appError;
    }

    if (errorMessage.includes("group not found") || errorMessage.includes("GROUP_NOT_FOUND")) {
        const appError = new AppError(
            "This group no longer exists.",
            ErrorType.NOT_FOUND,
            404,
            error,
            false
        );
        showErrorToast(appError);
        return appError;
    }

    if (errorMessage.includes("group deleted") || errorMessage.includes("GROUP_DELETED")) {
        const appError = new AppError(
            "This group has been deleted.",
            ErrorType.NOT_FOUND,
            404,
            error,
            false
        );
        showErrorToast(appError);
        return appError;
    }

    // Fall back to generic error handling
    return handleError(error, onRetry);
}

/**
 * WebSocket error handler
 */
export function handleWebSocketError(error: unknown): void {
    const appError = parseHttpError(error, "Connection error. Attempting to reconnect...");

    toast.error(appError.message, {
        description: "We're trying to reconnect you automatically.",
        duration: 3000,
    });
}

/**
 * AI-specific error messages
 */
export function handleAIError(error: unknown, isGroupAI: boolean = false): void {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes("insufficient data") || errorMessage.includes("still learning")) {
        toast.info(
            isGroupAI ? "Group AI is still learning" : "AI Friend is still learning",
            {
                description: isGroupAI
                    ? "The Group AI needs more messages to learn the group's style."
                    : "Your AI Friend needs more messages to learn your style.",
                duration: 4000,
            }
        );
        return;
    }

    toast.error(
        isGroupAI ? "Group AI error" : "AI Friend error",
        {
            description: "Failed to generate AI response. Please try again.",
            duration: 4000,
        }
    );
}
