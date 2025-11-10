/**
 * API route for users.yaml configuration management
 * Provides CRUD operations for user management with security validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import yaml from 'js-yaml';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { loadUsersConfig, UserConfig } from '@/lib/config/yamlLoader';

// Zod schema for validation (YAML injection prevention)
const UserSchema = z.object({
  output_name: z.string().min(1, "Output name is required").max(100, "Output name too long"),
  output_id: z.string().min(1, "Output ID is required").max(20, "Output ID too long"),
});

const UsersSchema = z.object({
  operators: z.record(z.string().min(1, "Username is required"), UserSchema),
});

export type UserFormData = z.infer<typeof UserSchema>;
export type UsersFormData = z.infer<typeof UsersSchema>;

/**
 * GET /api/v1/config/users
 * Returns current users configuration
 */
export async function GET() {
  try {
    const config = loadUsersConfig();
    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('Error loading users config:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load users configuration',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/config/users
 * Updates users configuration with security validation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate with Zod to prevent YAML injection
    const validatedData = UsersSchema.parse(body);

    // Generate safe YAML
    const yamlString = yaml.dump(validatedData, {
      indent: 2,
      lineWidth: 120,
      noRefs: true,
      sortKeys: false,
    });

    // Add header comment
    const finalYaml = `# User Mapping - Attendance Processor
# Separate from business rules for security/maintainability
# This file contains only user data, can be edited by user managers
# Auto-generated at ${new Date().toISOString()}

${yamlString}`;

    // Write to file with backup
    const usersPath = resolve(process.cwd(), 'users.yaml');
    const backupPath = `${usersPath}.backup.${Date.now()}`;

    // Create backup
    if (existsSync(usersPath)) {
      const currentContent = readFileSync(usersPath, 'utf8');
      writeFileSync(backupPath, currentContent);
    }

    // Write new content
    writeFileSync(usersPath, finalYaml);

    return NextResponse.json({
      success: true,
      message: 'Users configuration updated successfully',
      data: validatedData,
      backup: backupPath,
    });

  } catch (error) {
    console.error('Error saving users config:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save users configuration',
      },
      { status: 500 }
    );
  }
}