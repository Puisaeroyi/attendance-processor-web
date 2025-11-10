/**
 * Integration tests for YAML configuration loader with real files
 */

import {
  loadUsersConfig,
  loadRuleConfig,
  loadCombinedConfig,
  mapUser,
  createUserMapper,
  convertYamlToShiftConfigs,
} from '../yamlLoader';
import { resolve } from 'path';

describe('YAML Configuration Integration Tests', () => {
  const projectRoot = process.cwd();
  const usersYamlPath = resolve(projectRoot, 'users.yaml');
  const ruleYamlPath = resolve(projectRoot, 'rule.yaml');

  test('should load real users.yaml file', () => {
    const usersConfig = loadUsersConfig(usersYamlPath);

    expect(usersConfig).toBeDefined();
    expect(usersConfig.operators).toBeDefined();

    // Check all expected users exist
    expect(usersConfig.operators.Silver_Bui).toBeDefined();
    expect(usersConfig.operators.Silver_Bui.output_name).toBe('Bui Duc Toan');
    expect(usersConfig.operators.Silver_Bui.output_id).toBe('TPL0001');

    expect(usersConfig.operators.Capone).toBeDefined();
    expect(usersConfig.operators.Capone.output_name).toBe('Pham Tan Phat');
    expect(usersConfig.operators.Capone.output_id).toBe('TPL0002');

    expect(usersConfig.operators.Minh).toBeDefined();
    expect(usersConfig.operators.Minh.output_name).toBe('Mac Le Duc Minh');
    expect(usersConfig.operators.Minh.output_id).toBe('TPL0003');

    expect(usersConfig.operators.Trieu).toBeDefined();
    expect(usersConfig.operators.Trieu.output_name).toBe('Nguyen Hoang Trieu');
    expect(usersConfig.operators.Trieu.output_id).toBe('TPL0004');
  });

  test('should load real rule.yaml file', () => {
    const ruleConfig = loadRuleConfig(ruleYamlPath);

    expect(ruleConfig).toBeDefined();

    // Check that YAML file loaded successfully (may not have all structured fields)
    // Real rule.yaml has descriptive content, not structured config fields
    expect(ruleConfig.shift_structure).toBeDefined();
    expect(ruleConfig.break_detection).toBeDefined();
    expect(ruleConfig.operators).toBeDefined();

    // Check shift_structure has shifts
    expect(ruleConfig.shift_structure?.shifts).toBeDefined();
    expect(ruleConfig.shift_structure?.shifts?.A).toBeDefined();
    expect(ruleConfig.shift_structure?.shifts?.B).toBeDefined();
    expect(ruleConfig.shift_structure?.shifts?.C).toBeDefined();

    // Check break detection has parameters
    expect(ruleConfig.break_detection?.parameters).toBeDefined();
    expect(ruleConfig.break_detection?.parameters.A_shift).toBeDefined();
    expect(ruleConfig.break_detection?.parameters.B_shift).toBeDefined();
    expect(ruleConfig.break_detection?.parameters.C_shift).toBeDefined();
  });

  test('should load combined configuration from real files', () => {
    const combinedConfig = loadCombinedConfig(ruleYamlPath, usersYamlPath);

    expect(combinedConfig).toBeDefined();
    expect(combinedConfig.rules).toBeDefined();
    expect(combinedConfig.users).toBeDefined();

    // Check user configuration
    expect(combinedConfig.users.operators.Silver_Bui.output_name).toBe('Bui Duc Toan');

    // Check rule configuration has required structures
    expect(combinedConfig.rules.shift_structure).toBeDefined();
    expect(combinedConfig.rules.shift_structure?.shifts?.A?.name).toBe('Morning');
  });

  test('should convert real YAML configurations to shift configs', () => {
    const ruleConfig = loadRuleConfig(ruleYamlPath);
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

    // Check B shift
    expect(shiftConfigs.B.name).toBe('B');
    expect(shiftConfigs.B.displayName).toBe('Afternoon');
    expect(shiftConfigs.B.checkInStart).toBe('13:30:00');
    expect(shiftConfigs.B.checkInEnd).toBe('14:35:00');
    expect(shiftConfigs.B.shiftStart).toBe('14:00:00');
    expect(shiftConfigs.B.checkInOnTimeCutoff).toBe('14:04:59');
    expect(shiftConfigs.B.checkInLateThreshold).toBe('14:05:00');

    // Check C shift
    expect(shiftConfigs.C.name).toBe('C');
    expect(shiftConfigs.C.displayName).toBe('Night');
    expect(shiftConfigs.C.checkInStart).toBe('21:30:00');
    expect(shiftConfigs.C.checkInEnd).toBe('22:35:00');
    expect(shiftConfigs.C.shiftStart).toBe('22:00:00');
    expect(shiftConfigs.C.checkInOnTimeCutoff).toBe('22:04:59');
    expect(shiftConfigs.C.checkInLateThreshold).toBe('22:05:00');

    // Check break configurations
    expect(shiftConfigs.A.breakSearchStart).toBe('09:50:00');
    expect(shiftConfigs.A.breakSearchEnd).toBe('10:35:00');
    expect(shiftConfigs.A.breakOutCheckpoint).toBe('10:00:00');
    expect(shiftConfigs.A.midpoint).toBe('10:15:00');
    expect(shiftConfigs.A.minimumBreakGapMinutes).toBe(5);
    expect(shiftConfigs.A.breakEndTime).toBe('10:30:00');
    expect(shiftConfigs.A.breakInOnTimeCutoff).toBe('10:34:59');
    expect(shiftConfigs.A.breakInLateThreshold).toBe('10:35:00');
  });

  test('should map real users correctly', () => {
    const usersConfig = loadUsersConfig(usersYamlPath);
    const userMapper = createUserMapper(usersConfig);

    // Test each user mapping
    const silverBui = userMapper('Silver_Bui');
    expect(silverBui.name).toBe('Bui Duc Toan');
    expect(silverBui.id).toBe('TPL0001');

    const capone = userMapper('Capone');
    expect(capone.name).toBe('Pham Tan Phat');
    expect(capone.id).toBe('TPL0002');

    const minh = userMapper('Minh');
    expect(minh.name).toBe('Mac Le Duc Minh');
    expect(minh.id).toBe('TPL0003');

    const trieu = userMapper('Trieu');
    expect(trieu.name).toBe('Nguyen Hoang Trieu');
    expect(trieu.id).toBe('TPL0004');

    // Test unknown user
    const unknown = userMapper('Unknown_User');
    expect(unknown.name).toBe('Unknown_User');
    expect(unknown.id).toBe('Unknown_User');
  });

  test('should handle complete integration with real files', () => {
    // Load both configurations
    const combinedConfig = loadCombinedConfig(ruleYamlPath, usersYamlPath);
    const shiftConfigs = convertYamlToShiftConfigs(combinedConfig.rules);
    const userMapper = createUserMapper(combinedConfig.users);

    // Test configuration integration
    expect(combinedConfig.rules.shift_structure).toBeDefined();
    expect(combinedConfig.rules.break_detection).toBeDefined();

    // Test user mapping integration
    expect(userMapper('Silver_Bui').name).toBe('Bui Duc Toan');
    expect(userMapper('Silver_Bui').id).toBe('TPL0001');

    // Test shift configuration integration
    expect(shiftConfigs.A.displayName).toBe('Morning');
    expect(shiftConfigs.B.displayName).toBe('Afternoon');
    expect(shiftConfigs.C.displayName).toBe('Night');

    // Test break configurations are correctly parsed
    expect(shiftConfigs.A.breakOutCheckpoint).toBe('10:00:00');
    expect(shiftConfigs.B.breakOutCheckpoint).toBe('18:00:00');
    expect(shiftConfigs.C.breakOutCheckpoint).toBe('02:00:00');

    expect(shiftConfigs.A.breakInLateThreshold).toBe('10:35:00');
    expect(shiftConfigs.B.breakInLateThreshold).toBe('18:35:00');
    expect(shiftConfigs.C.breakInLateThreshold).toBe('02:50:00');
  });
});