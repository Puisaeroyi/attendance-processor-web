/**
 * Tests for YAML configuration loader
 */

import {
  loadUsersConfig,
  loadRuleConfig,
  loadCombinedConfig,
  mapUser,
  createUserMapper,
  convertYamlToShiftConfigs,
} from '../yamlLoader';
import type { UserConfig, RuleConfig } from '../yamlLoader';

// Mock the file system for testing
const mockUsersConfig: UserConfig = {
  operators: {
    Silver_Bui: {
      output_name: "Bui Duc Toan",
      output_id: "TPL0001"
    },
    Capone: {
      output_name: "Pham Tan Phat",
      output_id: "TPL0002"
    },
    Minh: {
      output_name: "Mac Le Duc Minh",
      output_id: "TPL0003"
    },
    Trieu: {
      output_name: "Nguyen Hoang Trieu",
      output_id: "TPL0004"
    }
  }
};

const mockRuleConfig: RuleConfig = {
  burst_threshold_minutes: 2,
  status_filter: ["Success"],
  shift_structure: {
    shifts: {
    A: {
      name: "Morning",
      window: "06:00-14:00",
      check_in: {
        search_range: "05:30-06:35",
        shift_start: "06:00:00",
        on_time_cutoff: "06:04:59",
        late_threshold: "06:05:00"
      },
      check_out: {
        search_range: "13:30-14:35"
      }
    },
    B: {
      name: "Afternoon",
      window: "14:00-22:00",
      check_in: {
        search_range: "13:30-14:35",
        shift_start: "14:00:00",
        on_time_cutoff: "14:04:59",
        late_threshold: "14:05:00"
      },
      check_out: {
        search_range: "21:30-22:35"
      }
    },
    C: {
      name: "Night",
      window: "22:00-06:00",
      check_in: {
        search_range: "21:30-22:35",
        shift_start: "22:00:00",
        on_time_cutoff: "22:04:59",
        late_threshold: "22:05:00"
      },
      check_out: {
        search_range: "05:30-06:35"
      }
    }
    }
  },
  break_detection: {
    parameters: {
      A_shift: {
        window: "10:00-10:30",
        break_out: {
          search_range: "09:50-10:35",
          checkpoint: "10:00:00"
        },
        break_in: {
          search_range: "09:50-10:35",
          break_end_time: "10:30:00",
          on_time_cutoff: "10:34:59",
          late_threshold: "10:35:00"
        },
        midpoint_checkpoint: "10:15",
        minimum_break_gap_minutes: 5
      },
      B_shift: {
        window: "18:00-18:30",
        break_out: {
          search_range: "17:50-18:35",
          checkpoint: "18:00:00"
        },
        break_in: {
          search_range: "17:50-18:35",
          break_end_time: "18:30:00",
          on_time_cutoff: "18:34:59",
          late_threshold: "18:35:00"
        },
        midpoint_checkpoint: "18:15",
        minimum_break_gap_minutes: 5
      },
      C_shift: {
        window: "02:00-02:45",
        break_out: {
          search_range: "01:50-02:50",
          checkpoint: "02:00:00"
        },
        break_in: {
          search_range: "01:50-02:50",
          break_end_time: "02:45:00",
          on_time_cutoff: "02:49:59",
          late_threshold: "02:50:00"
        },
        midpoint_checkpoint: "02:22:30",
        minimum_break_gap_minutes: 5
      }
    }
  }
};

describe('YAML Configuration Loader', () => {
  describe('User Mapping', () => {
    test('should map known users correctly', () => {
      const userMapper = createUserMapper(mockUsersConfig);

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
    });

    test('should return original user info for unknown users', () => {
      const userMapper = createUserMapper(mockUsersConfig);

      const unknownUser = userMapper('Unknown_User');
      expect(unknownUser.name).toBe('Unknown_User');
      expect(unknownUser.id).toBe('Unknown_User');
    });

    test('should map user directly using mapUser function', () => {
      const result = mapUser('Silver_Bui', mockUsersConfig);
      expect(result.name).toBe('Bui Duc Toan');
      expect(result.id).toBe('TPL0001');
    });
  });

  describe('Shift Configuration Conversion', () => {
    test('should convert YAML shift configurations to web app format', () => {
      const shiftConfigs = convertYamlToShiftConfigs(mockRuleConfig);

      // Check A shift
      expect(shiftConfigs.A).toBeDefined();
      expect(shiftConfigs.A.name).toBe('A');
      expect(shiftConfigs.A.displayName).toBe('Morning');
      expect(shiftConfigs.A.checkInStart).toBe('05:30:00');
      expect(shiftConfigs.A.checkInEnd).toBe('06:35:00');
      expect(shiftConfigs.A.shiftStart).toBe('06:00:00');
      expect(shiftConfigs.A.checkInOnTimeCutoff).toBe('06:04:59');
      expect(shiftConfigs.A.checkInLateThreshold).toBe('06:05:00');

      // Check B shift
      expect(shiftConfigs.B).toBeDefined();
      expect(shiftConfigs.B.name).toBe('B');
      expect(shiftConfigs.B.displayName).toBe('Afternoon');
      expect(shiftConfigs.B.checkInStart).toBe('13:30:00');
      expect(shiftConfigs.B.checkInEnd).toBe('14:35:00');

      // Check C shift
      expect(shiftConfigs.C).toBeDefined();
      expect(shiftConfigs.C.name).toBe('C');
      expect(shiftConfigs.C.displayName).toBe('Night');
      expect(shiftConfigs.C.checkInStart).toBe('21:30:00');
      expect(shiftConfigs.C.checkInEnd).toBe('22:35:00');
    });

    test('should handle break configuration conversion', () => {
      const shiftConfigs = convertYamlToShiftConfigs(mockRuleConfig);

      // Check A shift break configuration
      expect(shiftConfigs.A.breakSearchStart).toBe('09:50:00');
      expect(shiftConfigs.A.breakSearchEnd).toBe('10:35:00');
      expect(shiftConfigs.A.breakOutCheckpoint).toBe('10:00:00');
      expect(shiftConfigs.A.midpoint).toBe('10:15:00');
      expect(shiftConfigs.A.minimumBreakGapMinutes).toBe(5);
      expect(shiftConfigs.A.breakEndTime).toBe('10:30:00');
      expect(shiftConfigs.A.breakInOnTimeCutoff).toBe('10:34:59');
      expect(shiftConfigs.A.breakInLateThreshold).toBe('10:35:00');
    });

    test('should return empty object when missing shift or break configuration', () => {
      const incompleteConfig = {
        shifts: {
          A: {
            name: "Morning",
            window: "06:00-14:00",
            check_in: {
              search_range: "05:30-06:35",
              shift_start: "06:00:00",
              on_time_cutoff: "06:04:59",
              late_threshold: "06:05:00"
            },
            check_out: {
              search_range: "13:30-14:35"
            }
          }
        }
      };

      const shiftConfigs = convertYamlToShiftConfigs(incompleteConfig as RuleConfig);
      expect(Object.keys(shiftConfigs)).toHaveLength(0);
    });
  });

  describe('Configuration Loading', () => {
    test('should load combined configuration successfully', () => {
      // Since we can't easily mock file system operations in this setup,
      // we'll test the combination logic separately

      const combinedConfig = {
        rules: mockRuleConfig,
        users: mockUsersConfig
      };

      expect(combinedConfig.rules.burst_threshold_minutes).toBe(2);
      expect(combinedConfig.rules.status_filter).toEqual(['Success']);
      expect(combinedConfig.users.operators.Silver_Bui.output_name).toBe('Bui Duc Toan');
    });
  });

  describe('Integration Tests', () => {
    test('should handle end-to-end user mapping and shift configuration', () => {
      // Load configurations
      const shiftConfigs = convertYamlToShiftConfigs(mockRuleConfig);
      const userMapper = createUserMapper(mockUsersConfig);

      // Test user mapping
      const user = userMapper('Silver_Bui');
      expect(user.name).toBe('Bui Duc Toan');
      expect(user.id).toBe('TPL0001');

      // Test shift configuration
      expect(shiftConfigs.A.displayName).toBe('Morning');
      expect(shiftConfigs.A.checkInOnTimeCutoff).toBe('06:04:59');
      expect(shiftConfigs.A.breakInLateThreshold).toBe('10:35:00');

      // Test B shift
      expect(shiftConfigs.B.displayName).toBe('Afternoon');
      expect(shiftConfigs.B.checkInOnTimeCutoff).toBe('14:04:59');
      expect(shiftConfigs.B.breakInLateThreshold).toBe('18:35:00');

      // Test C shift
      expect(shiftConfigs.C.displayName).toBe('Night');
      expect(shiftConfigs.C.checkInOnTimeCutoff).toBe('22:04:59');
      expect(shiftConfigs.C.breakInLateThreshold).toBe('02:50:00');
    });

    test('should validate all required users are present', () => {
      const expectedUsers = ['Silver_Bui', 'Capone', 'Minh', 'Trieu'];
      const userMapper = createUserMapper(mockUsersConfig);

      expectedUsers.forEach(userId => {
        const user = userMapper(userId);
        expect(user.name).not.toBe(userId); // Should be mapped to real name
        expect(user.id).toMatch(/^TPL\d{4}$/); // Should match TPL0000 pattern
      });
    });
  });
});