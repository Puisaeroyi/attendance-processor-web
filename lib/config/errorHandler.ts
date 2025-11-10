/**
 * Error handling utilities for YAML configuration loading
 */

import { existsSync, statSync } from 'fs';

export class ConfigurationError extends Error {
  public override readonly cause?: Error;

  constructor(message: string, cause?: Error) {
    super(message);
    this.name = 'ConfigurationError';
    this.cause = cause;
  }
}

/**
 * Safe wrapper for YAML loading with comprehensive error handling
 */
export function safeYamlLoad<T>(loader: () => T, fallback: T, context: string): T {
  try {
    return loader();
  } catch (error) {
    console.error(`Error loading ${context}:`, error);
    if (error instanceof Error) {
      console.error(`Stack trace:`, error.stack);
    }
    console.warn(`Using fallback configuration for ${context}`);
    return fallback;
  }
}

/**
 * Validates YAML file accessibility
 */
export function validateYamlFile(filePath: string): boolean {
  try {
    if (!existsSync(filePath)) {
      console.warn(`YAML file not found: ${filePath}`);
      return false;
    }

    const stats = statSync(filePath);
    if (!stats.isFile()) {
      console.error(`Path is not a file: ${filePath}`);
      return false;
    }

    if (stats.size === 0) {
      console.warn(`YAML file is empty: ${filePath}`);
      return false;
    }

    if (stats.size > 1024 * 1024) { // 1MB limit
      console.error(`YAML file too large: ${filePath} (${stats.size} bytes)`);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Error validating YAML file ${filePath}:`, error);
    return false;
  }
}

/**
 * Get comprehensive error information for debugging
 */
export function getErrorDetails(error: unknown): {
  message: string;
  type: string;
  stack?: string;
  originalError?: unknown;
} {
  if (error instanceof Error) {
    return {
      message: error.message,
      type: error.constructor.name,
      stack: error.stack,
      originalError: error,
    };
  }

  return {
    message: String(error),
    type: typeof error,
    originalError: error,
  };
}