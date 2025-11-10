/**
 * Configuration Loader for YAML files
 * Loads and merges rule.yaml and users.yaml configurations
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import yaml from 'js-yaml';
import type { ShiftConfig } from '@/types/attendance';
import { safeYamlLoad, validateYamlFile } from './errorHandler';

export interface UserConfig {
  operators: Record<string, {
    output_name: string;
    output_id: string;
  }>;
}

export interface RuleConfig {
  // Business rules configuration (snake_case to match YAML)
  burst_threshold_minutes?: number;
  status_filter?: string[];
  operators?: {
    valid_users: string[];
  };
  grouping_logic?: {
    primary_grouping: string;
  };
  shift_structure?: {
    shifts?: Record<string, {
      name: string;
      window: string;
      check_in: {
        search_range: string;
        shift_start: string;
        on_time_cutoff: string;
        late_threshold: string;
      };
      check_out: {
        search_range: string;
      };
    }>;
  };
  break_detection?: {
    parameters: Record<string, {
      window: string;
      break_out: {
        search_range: string;
        checkpoint: string;
      };
      break_in: {
        search_range: string;
        break_end_time: string;
        on_time_cutoff: string;
        late_threshold: string;
      };
      midpoint_checkpoint: string;
      minimum_break_gap_minutes: number;
    }>;
  };
  [key: string]: unknown;
}

export interface CombinedConfig {
  rules: RuleConfig;
  users: UserConfig;
}

/**
 * Load users.yaml file
 */
export function loadUsersConfig(configPath?: string): UserConfig {
  const defaultPath = resolve(process.cwd(), 'users.yaml');
  const usersPath = configPath || defaultPath;

  return safeYamlLoad(
    () => {
      if (!validateYamlFile(usersPath)) {
        return { operators: {} };
      }

      const fileContents = readFileSync(usersPath, 'utf8');
      const config = yaml.load(fileContents) as UserConfig;

      if (!config || !config.operators) {
        throw new Error('users.yaml must contain an "operators" section');
      }

      return config;
    },
    { operators: {} },
    'users.yaml'
  );
}

/**
 * Load rule.yaml file
 */
export function loadRuleConfig(configPath?: string): RuleConfig {
  const defaultPath = resolve(process.cwd(), 'rule.yaml');
  const rulePath = configPath || defaultPath;

  return safeYamlLoad(
    () => {
      if (!validateYamlFile(rulePath)) {
        return {};
      }

      const fileContents = readFileSync(rulePath, 'utf8');
      return yaml.load(fileContents) as RuleConfig;
    },
    {},
    'rule.yaml'
  );
}

/**
 * Load both configuration files and combine them
 */
export function loadCombinedConfig(rulePath?: string, usersPath?: string): CombinedConfig {
  try {
    const rules = loadRuleConfig(rulePath);
    const users = loadUsersConfig(usersPath);

    return {
      rules,
      users,
    };
  } catch (error) {
    console.error('Error loading combined configuration:', error);
    throw error;
  }
}

/**
 * Map user ID to output name and ID from users.yaml
 */
export function mapUser(operatorId: string, usersConfig: UserConfig): {
  name: string;
  id: string;
} {
  const user = usersConfig.operators[operatorId];

  if (!user) {
    // Return original if not found in mapping
    return {
      name: operatorId,
      id: operatorId,
    };
  }

  return {
    name: user.output_name,
    id: user.output_id,
  };
}

/**
 * Get user mapping function for processing
 */
export function createUserMapper(usersConfig: UserConfig) {
  return (operatorId: string) => mapUser(operatorId, usersConfig);
}

/**
 * Convert YAML rule configuration to web app ShiftConfig format
 */
export function convertYamlToShiftConfigs(ruleConfig: RuleConfig): Record<string, ShiftConfig> {
  const yamlShifts = ruleConfig.shift_structure?.shifts;
  const yamlBreaks = ruleConfig.break_detection?.parameters;

  if (!yamlShifts || !yamlBreaks) {
    console.warn('Missing shift or break configuration in rule.yaml, using defaults');
    return {};
  }

  const shiftConfigs: Record<string, ShiftConfig> = {};

  // Convert A shift
  if (yamlShifts.A && yamlBreaks.A_shift) {
    shiftConfigs.A = {
      name: 'A',
      displayName: yamlShifts.A.name,
      checkInStart: yamlShifts.A.check_in.search_range.split('-')[0] + ':00',
      checkInEnd: yamlShifts.A.check_in.search_range.split('-')[1] + ':00',
      shiftStart: yamlShifts.A.check_in.shift_start,
      checkInOnTimeCutoff: yamlShifts.A.check_in.on_time_cutoff,
      checkInLateThreshold: yamlShifts.A.check_in.late_threshold,
      checkOutStart: yamlShifts.A.check_out.search_range.split('-')[0] + ':00',
      checkOutEnd: yamlShifts.A.check_out.search_range.split('-')[1] + ':00',
      breakSearchStart: yamlBreaks.A_shift.break_out.search_range.split('-')[0] + ':00',
      breakSearchEnd: yamlBreaks.A_shift.break_out.search_range.split('-')[1] + ':00',
      breakOutCheckpoint: yamlBreaks.A_shift.break_out.checkpoint,
      midpoint: yamlBreaks.A_shift.midpoint_checkpoint + ':00',
      minimumBreakGapMinutes: yamlBreaks.A_shift.minimum_break_gap_minutes,
      breakEndTime: yamlBreaks.A_shift.break_in.break_end_time,
      breakInOnTimeCutoff: yamlBreaks.A_shift.break_in.on_time_cutoff,
      breakInLateThreshold: yamlBreaks.A_shift.break_in.late_threshold,
    };
  }

  // Convert B shift
  if (yamlShifts.B && yamlBreaks.B_shift) {
    shiftConfigs.B = {
      name: 'B',
      displayName: yamlShifts.B.name,
      checkInStart: yamlShifts.B.check_in.search_range.split('-')[0] + ':00',
      checkInEnd: yamlShifts.B.check_in.search_range.split('-')[1] + ':00',
      shiftStart: yamlShifts.B.check_in.shift_start,
      checkInOnTimeCutoff: yamlShifts.B.check_in.on_time_cutoff,
      checkInLateThreshold: yamlShifts.B.check_in.late_threshold,
      checkOutStart: yamlShifts.B.check_out.search_range.split('-')[0] + ':00',
      checkOutEnd: yamlShifts.B.check_out.search_range.split('-')[1] + ':00',
      breakSearchStart: yamlBreaks.B_shift.break_out.search_range.split('-')[0] + ':00',
      breakSearchEnd: yamlBreaks.B_shift.break_out.search_range.split('-')[1] + ':00',
      breakOutCheckpoint: yamlBreaks.B_shift.break_out.checkpoint,
      midpoint: yamlBreaks.B_shift.midpoint_checkpoint + ':00',
      minimumBreakGapMinutes: yamlBreaks.B_shift.minimum_break_gap_minutes,
      breakEndTime: yamlBreaks.B_shift.break_in.break_end_time,
      breakInOnTimeCutoff: yamlBreaks.B_shift.break_in.on_time_cutoff,
      breakInLateThreshold: yamlBreaks.B_shift.break_in.late_threshold,
    };
  }

  // Convert C shift
  if (yamlShifts.C && yamlBreaks.C_shift) {
    shiftConfigs.C = {
      name: 'C',
      displayName: yamlShifts.C.name,
      checkInStart: yamlShifts.C.check_in.search_range.split('-')[0] + ':00',
      checkInEnd: yamlShifts.C.check_in.search_range.split('-')[1] + ':00',
      shiftStart: yamlShifts.C.check_in.shift_start,
      checkInOnTimeCutoff: yamlShifts.C.check_in.on_time_cutoff,
      checkInLateThreshold: yamlShifts.C.check_in.late_threshold,
      checkOutStart: yamlShifts.C.check_out.search_range.split('-')[0] + ':00',
      checkOutEnd: yamlShifts.C.check_out.search_range.split('-')[1] + ':00',
      breakSearchStart: yamlBreaks.C_shift.break_out.search_range.split('-')[0] + ':00',
      breakSearchEnd: yamlBreaks.C_shift.break_out.search_range.split('-')[1] + ':00',
      breakOutCheckpoint: yamlBreaks.C_shift.break_out.checkpoint,
      midpoint: yamlBreaks.C_shift.midpoint_checkpoint + ':00',
      minimumBreakGapMinutes: yamlBreaks.C_shift.minimum_break_gap_minutes,
      breakEndTime: yamlBreaks.C_shift.break_in.break_end_time,
      breakInOnTimeCutoff: yamlBreaks.C_shift.break_in.on_time_cutoff,
      breakInLateThreshold: yamlBreaks.C_shift.break_in.late_threshold,
    };
  }

  return shiftConfigs;
}