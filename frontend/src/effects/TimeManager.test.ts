/**
 * Property-Based Tests for TimeManager
 * 
 * Feature: visual-effects-enhancement
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { TimeManager } from './TimeManager';
import { colorDistance, hexToColor } from './utils';
import type { TimePeriod } from './types';

describe('TimeManager - Property-Based Tests', () => {
  /**
   * Property 1: Time Cycle Completion
   * 
   * For any starting time in the cycle, advancing by 24 minutes of real time
   * should return the time system to the same period and similar sky colors
   * (accounting for smooth transitions).
   * 
   * Validates: Requirements 1.1
   */
  it('Property 1: time cycle returns to same state after 24 minutes', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 24, noNaN: true }),
        (startTime) => {
          const timeManager = new TimeManager(startTime);
          
          const startPeriod = timeManager.period;
          const startColors = timeManager.getSkyColors();
          
          // Advance by full cycle
          timeManager.advance(24);
          
          const endPeriod = timeManager.period;
          const endColors = timeManager.getSkyColors();
          
          // Should return to same period
          expect(endPeriod).toBe(startPeriod);
          
          // Colors should be similar (within transition tolerance)
          const topDist = colorDistance(
            hexToColor(startColors.top),
            hexToColor(endColors.top)
          );
          const middleDist = colorDistance(
            hexToColor(startColors.middle),
            hexToColor(endColors.middle)
          );
          const bottomDist = colorDistance(
            hexToColor(startColors.bottom),
            hexToColor(endColors.bottom)
          );
          
          // Allow small tolerance for floating point errors
          expect(topDist).toBeLessThan(0.1);
          expect(middleDist).toBeLessThan(0.1);
          expect(bottomDist).toBeLessThan(0.1);
          
          timeManager.dispose();
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Property 2: Smooth Color Transitions
   * 
   * For any two consecutive time samples taken within a transition period (30 seconds),
   * the color difference should be small and proportional to the time elapsed,
   * ensuring no sudden jumps in sky color.
   * 
   * Validates: Requirements 1.2, 1.8
   */
  it('Property 2: color transitions are smooth with no sudden jumps', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 24, noNaN: true }),
        fc.float({ min: 0.01, max: 0.5, noNaN: true }),
        (startTime, deltaTime) => {
          const timeManager = new TimeManager(startTime);
          
          const colors1 = timeManager.getSkyColors();
          timeManager.advance(deltaTime);
          const colors2 = timeManager.getSkyColors();
          
          // Calculate color change
          const topChange = colorDistance(
            hexToColor(colors1.top),
            hexToColor(colors2.top)
          );
          const middleChange = colorDistance(
            hexToColor(colors1.middle),
            hexToColor(colors2.middle)
          );
          const bottomChange = colorDistance(
            hexToColor(colors1.bottom),
            hexToColor(colors2.bottom)
          );
          
          // Color change should be proportional to time elapsed
          // Maximum expected change over 30 seconds is full color distance (~1.73)
          // So for deltaTime minutes, max change is (deltaTime / 0.5) * 1.73
          const maxExpectedChange = (deltaTime / 0.5) * 2.0;  // 1.5x tolerance
          
          expect(topChange).toBeLessThan(maxExpectedChange);
          expect(middleChange).toBeLessThan(maxExpectedChange);
          expect(bottomChange).toBeLessThan(maxExpectedChange);
          
          timeManager.dispose();
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Property 3: Time Period Color Ranges
   * 
   * For any time value within a specific period (morning, day, evening, night),
   * the sky colors should fall within the expected color palette for that period
   * (warm tones for morning, bright for day, sunset for evening, dark for night).
   * 
   * Validates: Requirements 1.3, 1.4, 1.5, 1.6
   */
  it('Property 3: sky colors match expected palette for each period', () => {
    // Define expected color characteristics for each period
    const periodColorChecks: Record<TimePeriod, (colors: { top: string; middle: string; bottom: string }) => boolean> = {
      morning: (colors) => {
        // Morning should have warm tones (orange, pink, light blue)
        const top = hexToColor(colors.top);
        const middle = hexToColor(colors.middle);
        // Check for warm colors (high red component)
        return top.r > 0.5 && middle.r > 0.5;
      },
      day: (colors) => {
        // Day should have bright blue tones
        const top = hexToColor(colors.top);
        const middle = hexToColor(colors.middle);
        // Check for blue colors (high blue component)
        return top.b > 0.5 && middle.b > 0.5;
      },
      evening: (colors) => {
        // Evening should have sunset colors (orange, purple, deep blue)
        const top = hexToColor(colors.top);
        // Check for warm or purple tones
        return top.r > 0.3 || (top.r > 0.2 && top.b > 0.2);
      },
      night: (colors) => {
        // Night should have dark colors
        const top = hexToColor(colors.top);
        const middle = hexToColor(colors.middle);
        const bottom = hexToColor(colors.bottom);
        // Check for low overall brightness
        const avgBrightness = (top.r + top.g + top.b + middle.r + middle.g + middle.b + bottom.r + bottom.g + bottom.b) / 9;
        return avgBrightness < 0.4;
      }
    };
    
    fc.assert(
      fc.property(
        fc.constantFrom<TimePeriod>('morning', 'day', 'evening', 'night'),
        fc.float({ min: 0, max: 1, noNaN: true }),
        (period, periodProgress) => {
          // Calculate time within the period
          const periodRanges = {
            morning: { start: 0, end: 6 },
            day: { start: 6, end: 12 },
            evening: { start: 12, end: 18 },
            night: { start: 18, end: 24 }
          };
          
          const range = periodRanges[period];
          const time = range.start + periodProgress * (range.end - range.start);
          
          const timeManager = new TimeManager(time);
          
          // Verify period is correct
          expect(timeManager.period).toBe(period);
          
          // Get colors and check they match period characteristics
          const colors = timeManager.getSkyColors();
          const colorCheck = periodColorChecks[period];
          
          expect(colorCheck(colors)).toBe(true);
          
          timeManager.dispose();
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Property 4: Light Intensity Correlation
   * 
   * For any time of day, the lighting intensity should correlate with the time period,
   * with day having highest intensity, night having lowest, and morning/evening having
   * intermediate values.
   * 
   * Validates: Requirements 1.7
   */
  it('Property 4: light intensity correlates with time period', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 24, noNaN: true }),
        (time) => {
          const timeManager = new TimeManager(time);
          
          const period = timeManager.period;
          const intensity = timeManager.getLightIntensity();
          
          // Verify intensity is within valid range
          expect(intensity).toBeGreaterThanOrEqual(0);
          expect(intensity).toBeLessThanOrEqual(1);
          
          // Verify intensity matches period expectations
          if (period === 'day') {
            // Day should have highest intensity (0.8)
            expect(intensity).toBeGreaterThanOrEqual(0.7);
          } else if (period === 'night') {
            // Night should have lowest intensity (0.3)
            expect(intensity).toBeLessThanOrEqual(0.4);
          } else {
            // Morning and evening should have intermediate values
            expect(intensity).toBeGreaterThan(0.4);
            expect(intensity).toBeLessThan(0.7);
          }
          
          timeManager.dispose();
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Additional test: Time wrapping
   * Verify that time wraps correctly at 24 minutes
   */
  it('time wraps correctly from 24 back to 0', () => {
    const timeManager = new TimeManager(23.9);
    timeManager.advance(0.2);  // Should wrap to 0.1
    
    expect(timeManager.currentTime).toBeCloseTo(0.1, 1);
    expect(timeManager.period).toBe('morning');
    
    timeManager.dispose();
  });
  
  /**
   * Additional test: Period boundaries
   * Verify that period changes occur at correct boundaries
   */
  it('period changes occur at correct time boundaries', () => {
    const boundaries = [
      { time: 5.9, expectedPeriod: 'morning' as TimePeriod },
      { time: 6.1, expectedPeriod: 'day' as TimePeriod },
      { time: 11.9, expectedPeriod: 'day' as TimePeriod },
      { time: 12.1, expectedPeriod: 'evening' as TimePeriod },
      { time: 17.9, expectedPeriod: 'evening' as TimePeriod },
      { time: 18.1, expectedPeriod: 'night' as TimePeriod },
      { time: 23.9, expectedPeriod: 'night' as TimePeriod },
      { time: 0.1, expectedPeriod: 'morning' as TimePeriod }
    ];
    
    boundaries.forEach(({ time, expectedPeriod }) => {
      const timeManager = new TimeManager(time);
      expect(timeManager.period).toBe(expectedPeriod);
      timeManager.dispose();
    });
  });
});
