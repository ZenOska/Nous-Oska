import { describe, expect, it } from 'vitest';
import { projectInfo } from '../../src/shared/project.js';

describe('Phase 0 project metadata', () => {
  it('identifies Nous and its Apache 2.0 license', () => {
    expect(projectInfo.name).toBe('Nous');
    expect(projectInfo.license).toBe('Apache-2.0');
  });

  it('does not claim browser features before Phase 1', () => {
    expect(projectInfo.phase).toBe(0);
  });
});
