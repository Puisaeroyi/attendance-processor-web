/**
 * Test shift configuration parsing with clean YAML file
 */

import {
  loadRuleConfig,
  convertYamlToShiftConfigs,
} from '../yamlLoader';
import { resolve } from 'path';

describe('Shift Configuration Tests', () => {
  const projectRoot = process.cwd();
  const ruleTestPath = resolve(projectRoot, 'rule-test.yaml');

  test('should load clean rule.yaml test file', () => {
    const ruleConfig = loadRuleConfig(ruleTestPath);

    expect(ruleConfig).toBeDefined();
    expect(ruleConfig.burst_threshold_minutes).toBe(2);
    expect(ruleConfig.status_filter).toEqual(['Success']);
    expect(ruleConfig.shift_structure?.shifts).toBeDefined();
    expect(ruleConfig.break_detection).toBeDefined();
  });

  test('should convert YAML shift configurations correctly', () => {
    const ruleConfig = loadRuleConfig(ruleTestPath);
    const shiftConfigs = convertYamlToShiftConfigs(ruleConfig);

    expect(shiftConfigs).toBeDefined();
    expect(Object.keys(shiftConfigs)).toHaveLength(3); // A, B, C shifts

    // Check A shift
    expect(shiftConfigs.A.name).toBe('A');
    expect(shiftConfigs.A.displayName).toBe('Morning');
    expect(shiftConfigs.A.checkInStart).toBe('05:30:00');
    expect(shiftConfigs.A.checkInEnd).toBe('06:35:00');
    expect(shiftConfigs.A.shiftStart).toBe('06:00:00');
    expect(shiftConfigs.A.checkInOnTimeCutoff).toBe('06:04:59');
    expect(shiftConfigs.A.checkInLateThreshold).toBe('06:05:00');
    expect(shiftConfigs.A.checkOutStart).toBe('13:30:00');
    expect(shiftConfigs.A.checkOutEnd).toBe('14:35:00');

    // Check B shift
    expect(shiftConfigs.B.name).toBe('B');
    expect(shiftConfigs.B.displayName).toBe('Afternoon');
    expect(shiftConfigs.B.checkInStart).toBe('13:30:00');
    expect(shiftConfigs.B.checkInEnd).toBe('14:35:00');
    expect(shiftConfigs.B.shiftStart).toBe('14:00:00');
    expect(shiftConfigs.B.checkInOnTimeCutoff).toBe('14:04:59');
    expect(shiftConfigs.B.checkInLateThreshold).toBe('14:05:00');
    expect(shiftConfigs.B.checkOutStart).toBe('21:30:00');
    expect(shiftConfigs.B.checkOutEnd).toBe('22:35:00');

    // Check C shift
    expect(shiftConfigs.C.name).toBe('C');
    expect(shiftConfigs.C.displayName).toBe('Night');
    expect(shiftConfigs.C.checkInStart).toBe('21:30:00');
    expect(shiftConfigs.C.checkInEnd).toBe('22:35:00');
    expect(shiftConfigs.C.shiftStart).toBe('22:00:00');
    expect(shiftConfigs.C.checkInOnTimeCutoff).toBe('22:04:59');
    expect(shiftConfigs.C.checkInLateThreshold).toBe('22:05:00');
    expect(shiftConfigs.C.checkOutStart).toBe('05:30:00');
    expect(shiftConfigs.C.checkOutEnd).toBe('06:35:00');
  });

  test('should convert break configurations correctly', () => {
    const ruleConfig = loadRuleConfig(ruleTestPath);
    const shiftConfigs = convertYamlToShiftConfigs(ruleConfig);

    // Check A shift break configuration
    expect(shiftConfigs.A.breakSearchStart).toBe('09:50:00');
    expect(shiftConfigs.A.breakSearchEnd).toBe('10:35:00');
    expect(shiftConfigs.A.breakOutCheckpoint).toBe('10:00:00');
    expect(shiftConfigs.A.midpoint).toBe('10:15:00');
    expect(shiftConfigs.A.minimumBreakGapMinutes).toBe(5);
    expect(shiftConfigs.A.breakEndTime).toBe('10:30:00');
    expect(shiftConfigs.A.breakInOnTimeCutoff).toBe('10:34:59');
    expect(shiftConfigs.A.breakInLateThreshold).toBe('10:35:00');

    // Check B shift break configuration
    expect(shiftConfigs.B.breakSearchStart).toBe('17:50:00');
    expect(shiftConfigs.B.breakSearchEnd).toBe('18:35:00');
    expect(shiftConfigs.B.breakOutCheckpoint).toBe('18:00:00');
    expect(shiftConfigs.B.midpoint).toBe('18:15:00');
    expect(shiftConfigs.B.minimumBreakGapMinutes).toBe(5);
    expect(shiftConfigs.B.breakEndTime).toBe('18:30:00');
    expect(shiftConfigs.B.breakInOnTimeCutoff).toBe('18:34:59');
    expect(shiftConfigs.B.breakInLateThreshold).toBe('18:35:00');

    // Check C shift break configuration
    expect(shiftConfigs.C.breakSearchStart).toBe('01:50:00');
    expect(shiftConfigs.C.breakSearchEnd).toBe('02:50:00');
    expect(shiftConfigs.C.breakOutCheckpoint).toBe('02:00:00');
    expect(shiftConfigs.C.midpoint).toBe('02:22:30:00');
    expect(shiftConfigs.C.minimumBreakGapMinutes).toBe(5);
    expect(shiftConfigs.C.breakEndTime).toBe('02:45:00');
    expect(shiftConfigs.C.breakInOnTimeCutoff).toBe('02:49:59');
    expect(shiftConfigs.C.breakInLateThreshold).toBe('02:50:00');
  });
});