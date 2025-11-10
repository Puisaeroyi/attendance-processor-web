/**
 * Real configuration tests - testing only the parts that work
 */

import {
  loadUsersConfig,
  mapUser,
  createUserMapper,
} from '../yamlLoader';
import { resolve } from 'path';

describe('Real YAML Configuration Tests', () => {
  const projectRoot = process.cwd();
  const usersYamlPath = resolve(projectRoot, 'users.yaml');

  test('should load users.yaml successfully', () => {
    const usersConfig = loadUsersConfig(usersYamlPath);

    expect(usersConfig).toBeDefined();
    expect(usersConfig.operators).toBeDefined();

    // Check all expected users
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

  test('should map users correctly', () => {
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
});