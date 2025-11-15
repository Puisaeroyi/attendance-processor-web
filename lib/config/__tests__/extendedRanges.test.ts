/**
 * Test to verify the extended search ranges are loaded correctly from rule.yaml
 * This test validates the changes made to extend check-in and check-out ranges
 */

import { loadRuleConfig, convertYamlToShiftConfigs } from '../yamlLoader';
import { resolve } from 'path';

describe('Extended Search Ranges Tests', () => {
  const projectRoot = process.cwd();
  const ruleYamlPath = resolve(projectRoot, 'rule.yaml');

  test('should load EXTENDED check-in ranges (1 hour before shift start)', () => {
    const ruleConfig = loadRuleConfig(ruleYamlPath);
    const shiftConfigs = convertYamlToShiftConfigs(ruleConfig);

    // Shift A: Extended from 05:30 to 05:00 (1 hour before 06:00 shift start)
    expect(shiftConfigs.A.checkInStart).toBe('05:00:00');
    expect(shiftConfigs.A.checkInEnd).toBe('06:35:00');

    // Shift B: Extended from 13:30 to 13:00 (1 hour before 14:00 shift start)
    expect(shiftConfigs.B.checkInStart).toBe('13:00:00');
    expect(shiftConfigs.B.checkInEnd).toBe('14:35:00');

    // Shift C: Extended from 21:30 to 21:00 (1 hour before 22:00 shift start)
    expect(shiftConfigs.C.checkInStart).toBe('21:00:00');
    expect(shiftConfigs.C.checkInEnd).toBe('22:35:00');
  });

  test('should load EXTENDED check-out ranges (2 hours after shift end)', () => {
    const ruleConfig = loadRuleConfig(ruleYamlPath);
    const shiftConfigs = convertYamlToShiftConfigs(ruleConfig);

    // Shift A: Extended from 14:35 to 16:00 (2 hours after 14:00 shift end)
    expect(shiftConfigs.A.checkOutStart).toBe('13:30:00');
    expect(shiftConfigs.A.checkOutEnd).toBe('16:00:00');

    // Shift B: Extended from 22:35 to 00:00 (2 hours after 22:00 shift end, midnight boundary)
    expect(shiftConfigs.B.checkOutStart).toBe('21:30:00');
    expect(shiftConfigs.B.checkOutEnd).toBe('00:00:00');

    // Shift C: Extended from 06:35 to 08:00 (2 hours after 06:00 shift end)
    expect(shiftConfigs.C.checkOutStart).toBe('05:30:00');
    expect(shiftConfigs.C.checkOutEnd).toBe('08:00:00');
  });

  test('should correctly parse rule.yaml with new extended ranges', () => {
    const ruleConfig = loadRuleConfig(ruleYamlPath);
    const shiftConfigs = convertYamlToShiftConfigs(ruleConfig);

    // Verify all three shifts are loaded
    expect(Object.keys(shiftConfigs)).toHaveLength(3);
    expect(shiftConfigs.A).toBeDefined();
    expect(shiftConfigs.B).toBeDefined();
    expect(shiftConfigs.C).toBeDefined();

    // Verify display names
    expect(shiftConfigs.A.displayName).toBe('Morning');
    expect(shiftConfigs.B.displayName).toBe('Afternoon');
    expect(shiftConfigs.C.displayName).toBe('Night');
  });

  test('should preserve existing break configurations', () => {
    const ruleConfig = loadRuleConfig(ruleYamlPath);
    const shiftConfigs = convertYamlToShiftConfigs(ruleConfig);

    // Break configurations should remain unchanged
    expect(shiftConfigs.A.breakSearchStart).toBe('09:50:00');
    expect(shiftConfigs.A.breakSearchEnd).toBe('10:35:00');
    expect(shiftConfigs.A.breakOutCheckpoint).toBe('10:00:00');
    expect(shiftConfigs.A.breakInOnTimeCutoff).toBe('10:34:59');
    expect(shiftConfigs.A.breakInLateThreshold).toBe('10:35:00');

    expect(shiftConfigs.B.breakSearchStart).toBe('17:50:00');
    expect(shiftConfigs.B.breakSearchEnd).toBe('18:35:00');
    expect(shiftConfigs.B.breakOutCheckpoint).toBe('18:00:00');
    expect(shiftConfigs.B.breakInOnTimeCutoff).toBe('18:34:59');
    expect(shiftConfigs.B.breakInLateThreshold).toBe('18:35:00');

    expect(shiftConfigs.C.breakSearchStart).toBe('01:50:00');
    expect(shiftConfigs.C.breakSearchEnd).toBe('02:50:00');
    expect(shiftConfigs.C.breakOutCheckpoint).toBe('02:00:00');
    expect(shiftConfigs.C.breakInOnTimeCutoff).toBe('02:49:59');
    expect(shiftConfigs.C.breakInLateThreshold).toBe('02:50:00');
  });

  test('should preserve on-time cutoffs and late thresholds', () => {
    const ruleConfig = loadRuleConfig(ruleYamlPath);
    const shiftConfigs = convertYamlToShiftConfigs(ruleConfig);

    // Check-in late detection thresholds should remain at 5 minutes grace period
    expect(shiftConfigs.A.checkInOnTimeCutoff).toBe('06:04:59');
    expect(shiftConfigs.A.checkInLateThreshold).toBe('06:05:00');

    expect(shiftConfigs.B.checkInOnTimeCutoff).toBe('14:04:59');
    expect(shiftConfigs.B.checkInLateThreshold).toBe('14:05:00');

    expect(shiftConfigs.C.checkInOnTimeCutoff).toBe('22:04:59');
    expect(shiftConfigs.C.checkInLateThreshold).toBe('22:05:00');
  });
});
