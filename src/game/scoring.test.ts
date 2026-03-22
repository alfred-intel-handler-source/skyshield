import { describe, it, expect } from 'vitest';
import { applyCompletionMultiplier } from './scoring.js';

describe('applyCompletionMultiplier', () => {
  it('returns multiplier 1.0 when elapsed >= 90% of max_duration', () => {
    const result = applyCompletionMultiplier(270, 300);
    expect(result.completion_multiplier).toBe(1.0);
    expect(result.time_bonus_detail).toBe('Mission completed (90% duration)');
  });

  it('returns multiplier 1.0 at exactly 90%', () => {
    const result = applyCompletionMultiplier(270, 300);
    expect(result.completion_multiplier).toBe(1.0);
  });

  it('returns multiplier 0.95 when elapsed >= 70% but < 90%', () => {
    const result = applyCompletionMultiplier(240, 300); // 80%
    expect(result.completion_multiplier).toBe(0.95);
    expect(result.time_bonus_detail).toContain('Early exit penalty');
  });

  it('returns multiplier 0.85 when elapsed >= 50% but < 70%', () => {
    const result = applyCompletionMultiplier(180, 300); // 60%
    expect(result.completion_multiplier).toBe(0.85);
    expect(result.time_bonus_detail).toContain('Early exit penalty');
  });

  it('returns multiplier 0.70 when elapsed < 50%', () => {
    const result = applyCompletionMultiplier(120, 300); // 40%
    expect(result.completion_multiplier).toBe(0.70);
    expect(result.time_bonus_detail).toContain('Early exit penalty');
  });

  it('handles zero elapsed time', () => {
    const result = applyCompletionMultiplier(0, 300);
    expect(result.completion_multiplier).toBe(0.70);
  });

  it('handles elapsed exceeding max_duration (clamped to 1.0)', () => {
    const result = applyCompletionMultiplier(400, 300);
    expect(result.completion_multiplier).toBe(1.0);
  });

  it('includes completion percentage in detail string', () => {
    const result = applyCompletionMultiplier(150, 300); // 50%
    expect(result.time_bonus_detail).toContain('50%');
  });
});
