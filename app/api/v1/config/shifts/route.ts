/**
 * API route for shift configuration management (rule.yaml shifts section)
 * Provides CRUD operations for shift times with security validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import yaml from 'js-yaml';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { loadRuleConfig, RuleConfig } from '@/lib/config/yamlLoader';

// Zod schemas for validation (YAML injection prevention)
const CheckInSchema = z.object({
  search_range: z.string().regex(/^\d{2}:\d{2}-\d{2}:\d{2}$/, "Invalid time range format (HH:MM-HH:MM)"),
  shift_start: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, "Invalid time format (HH:MM:SS)"),
  on_time_cutoff: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, "Invalid time format (HH:MM:SS)"),
  late_threshold: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, "Invalid time format (HH:MM:SS)"),
});

const CheckOutSchema = z.object({
  search_range: z.string().regex(/^\d{2}:\d{2}-\d{2}:\d{2}$/, "Invalid time range format (HH:MM-HH:MM)"),
});

const ShiftSchema = z.object({
  name: z.string().min(1, "Shift name is required").max(50, "Shift name too long"),
  window: z.string().regex(/^\d{2}:\d{2}-\d{2}:\d{2}$/, "Invalid time window format (HH:MM-HH:MM)"),
  check_in: CheckInSchema,
  check_out: CheckOutSchema,
});

const ShiftsSchema = z.object({
  shifts: z.record(z.enum(['A', 'B', 'C']), ShiftSchema),
});

export type ShiftFormData = z.infer<typeof ShiftSchema>;
export type ShiftsFormData = z.infer<typeof ShiftsSchema>;

/**
 * GET /api/v1/config/shifts
 * Returns current shift configuration
 */
export async function GET() {
  try {
    const config = loadRuleConfig();

    // Extract only shift_structure section
    const shiftsData = config.shift_structure?.shifts || {};

    return NextResponse.json({
      success: true,
      data: {
        shifts: shiftsData,
      },
    });
  } catch (error) {
    console.error('Error loading shifts config:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load shift configuration',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/config/shifts
 * Updates shift configuration with security validation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate with Zod to prevent YAML injection
    const validatedData = ShiftsSchema.parse(body);

    // Load current rule.yaml to preserve other sections
    const rulePath = resolve(process.cwd(), 'rule.yaml');
    const backupPath = `${rulePath}.backup.${Date.now()}`;

    // Create backup
    if (existsSync(rulePath)) {
      const currentContent = readFileSync(rulePath, 'utf8');
      writeFileSync(backupPath, currentContent);
    }

    // Load current config
    let currentConfig: Record<string, unknown> = {};
    try {
      const fileContent = readFileSync(rulePath, 'utf8');
      const loaded = yaml.load(fileContent);
      if (loaded && typeof loaded === 'object') {
        currentConfig = loaded as Record<string, unknown>;
      }
    } catch {
      // If file doesn't exist or can't be parsed, start with empty
    }

    // Update only shift_structure section
    const existingShiftStructure = currentConfig.shift_structure as Record<string, unknown> || {};
    currentConfig.shift_structure = {
      ...existingShiftStructure,
      shifts: validatedData.shifts,
    };

    // Generate safe YAML with updated shifts
    const yamlString = yaml.dump(currentConfig, {
      indent: 2,
      lineWidth: 120,
      noRefs: true,
      sortKeys: false,
    });

    // Add header comment about update
    const finalYaml = `# Attendance Cleaning Rules for 4 CCTV Operators
# Version 10.0 - Complete ruleset with strict grace period enforcement
# Key Features:
#   - Grace period as hard cutoff for late marking
#   - Shift-instance grouping (no split night shifts)
#   - Gap-based break detection with midpoint fallback
#   - Burst detection for multiple rapid swipes
#   - Strict late detection for check-in and break returns
# Shifts updated at: ${new Date().toISOString()}

${yamlString}`;

    // Write updated file
    writeFileSync(rulePath, finalYaml);

    return NextResponse.json({
      success: true,
      message: 'Shift configuration updated successfully',
      data: validatedData,
      backup: backupPath,
    });

  } catch (error) {
    console.error('Error saving shifts config:', error);

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
        error: 'Failed to save shift configuration',
      },
      { status: 500 }
    );
  }
}