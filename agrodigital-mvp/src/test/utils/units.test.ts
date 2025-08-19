import { describe, it, expect } from 'vitest'
import { convertAmount } from '../../utils/units'

describe('convertAmount', () => {
	describe('Mass conversions', () => {
		it('should convert kg to g', () => {
			expect(convertAmount(1, 'kg', 'g')).toBe(1000)
			expect(convertAmount(2.5, 'kg', 'g')).toBe(2500)
		})

		it('should convert g to kg', () => {
			expect(convertAmount(1000, 'g', 'kg')).toBe(1)
			expect(convertAmount(500, 'g', 'kg')).toBe(0.5)
		})

		it('should handle same unit conversion', () => {
			expect(convertAmount(100, 'kg', 'kg')).toBe(100)
			expect(convertAmount(50, 'g', 'g')).toBe(50)
		})
	})

	describe('Volume conversions', () => {
		it('should convert L to ml', () => {
			expect(convertAmount(1, 'L', 'ml')).toBe(1000)
			expect(convertAmount(0.5, 'L', 'ml')).toBe(500)
		})

		it('should convert ml to L', () => {
			expect(convertAmount(1000, 'ml', 'L')).toBe(1)
			expect(convertAmount(250, 'ml', 'L')).toBe(0.25)
		})

		it('should convert m³ to L', () => {
			expect(convertAmount(1, 'm3', 'L')).toBe(1000)
			expect(convertAmount(0.001, 'm3', 'L')).toBe(1)
		})

		it('should convert L to m³', () => {
			expect(convertAmount(1000, 'L', 'm3')).toBe(1)
			expect(convertAmount(1, 'L', 'm3')).toBe(0.001)
		})
	})

	describe('Edge cases', () => {
		it('should handle zero values', () => {
			expect(convertAmount(0, 'kg', 'g')).toBe(0)
			expect(convertAmount(0, 'L', 'ml')).toBe(0)
		})

		it('should handle negative values', () => {
			expect(convertAmount(-1, 'kg', 'g')).toBe(-1000)
			expect(convertAmount(-2.5, 'L', 'ml')).toBe(-2500)
		})

		it('should handle decimal precision', () => {
			expect(convertAmount(0.001, 'kg', 'g')).toBe(1)
			expect(convertAmount(0.000001, 'm3', 'L')).toBe(0.001)
		})
	})

	describe('Invalid conversions', () => {
		it('should throw error for incompatible units', () => {
			expect(() => convertAmount(1, 'kg', 'L')).toThrow('Incompatible units')
			expect(() => convertAmount(1, 'L', 'kg')).toThrow('Incompatible units')
		})

		it('should throw error for unknown units', () => {
			expect(() => convertAmount(1, 'unknown', 'kg')).toThrow('Unknown unit')
			expect(() => convertAmount(1, 'kg', 'unknown')).toThrow('Unknown unit')
		})
	})
})
