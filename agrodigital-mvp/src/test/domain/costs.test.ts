import { describe, it, expect, beforeEach } from 'vitest'
import { 
	calculateFertilizersCost, 
	calculateWaterCost, 
	calculatePhytosanitaryCost 
} from '../../domain/costs'

describe('Cost Calculations', () => {
	describe('calculateFertilizersCost', () => {
		const mockFertilizers = [
			{
				fertilizerAmount: 10,
				fertilizerUnit: 'kg',
				price: 2.5,
				unit: 'kg'
			},
			{
				fertilizerAmount: 5,
				fertilizerUnit: 'g',
				price: 0.003,
				unit: 'g'
			}
		]

		it('should calculate total cost for fertilizers with same units', () => {
			const result = calculateFertilizersCost([mockFertilizers[0]])
			expect(result).toBe(25) // 10 kg * 2.5 €/kg
		})

		it('should calculate total cost for fertilizers with different units', () => {
			const result = calculateFertilizersCost(mockFertilizers)
			expect(result).toBeCloseTo(25.015, 3) // 10kg*2.5€ + 5g*0.003€
		})

		it('should handle empty array', () => {
			const result = calculateFertilizersCost([])
			expect(result).toBe(0)
		})

		it('should handle zero amounts', () => {
			const zeroFertilizer = {
				fertilizerAmount: 0,
				fertilizerUnit: 'kg',
				price: 2.5,
				unit: 'kg'
			}
			const result = calculateFertilizersCost([zeroFertilizer])
			expect(result).toBe(0)
		})
	})

	describe('calculateWaterCost', () => {
		it('should calculate water cost with same units', () => {
			const result = calculateWaterCost(10, 'm3', 0.5, 'm3')
			expect(result).toBe(5) // 10 m³ * 0.5 €/m³
		})

		it('should calculate water cost with different units', () => {
			const result = calculateWaterCost(1000, 'L', 0.5, 'm3')
			expect(result).toBe(0.5) // 1000L = 1m³ * 0.5€/m³
		})

		it('should handle zero consumption', () => {
			const result = calculateWaterCost(0, 'm3', 0.5, 'm3')
			expect(result).toBe(0)
		})

		it('should handle zero price', () => {
			const result = calculateWaterCost(10, 'm3', 0, 'm3')
			expect(result).toBe(0)
		})
	})

	describe('calculatePhytosanitaryCost', () => {
		const mockPhytosanitaries = [
			{
				phytosanitaryAmount: 2,
				phytosanitaryUnit: 'L',
				price: 15,
				unit: 'L'
			},
			{
				phytosanitaryAmount: 500,
				phytosanitaryUnit: 'ml',
				price: 0.03,
				unit: 'ml'
			}
		]

		it('should calculate total cost for phytosanitaries with same units', () => {
			const result = calculatePhytosanitaryCost([mockPhytosanitaries[0]])
			expect(result).toBe(30) // 2L * 15€/L
		})

		it('should calculate total cost for phytosanitaries with different units', () => {
			const result = calculatePhytosanitaryCost(mockPhytosanitaries)
			expect(result).toBeCloseTo(45, 2) // 2L*15€ + 500ml*0.03€
		})

		it('should handle empty array', () => {
			const result = calculatePhytosanitaryCost([])
			expect(result).toBe(0)
		})

		it('should handle zero amounts', () => {
			const zeroPhytosanitary = {
				phytosanitaryAmount: 0,
				phytosanitaryUnit: 'L',
				price: 15,
				unit: 'L'
			}
			const result = calculatePhytosanitaryCost([zeroPhytosanitary])
			expect(result).toBe(0)
		})
	})

	describe('Edge cases and error handling', () => {
		it('should handle very small amounts', () => {
			const result = calculateWaterCost(0.001, 'm3', 1000, 'm3')
			expect(result).toBe(1) // 0.001 m³ * 1000€/m³
		})

		it('should handle very large amounts', () => {
			const result = calculateWaterCost(10000, 'L', 0.001, 'L')
			expect(result).toBe(10) // 10000L * 0.001€/L
		})

		it('should handle negative amounts gracefully', () => {
			const result = calculateWaterCost(-5, 'm3', 1, 'm3')
			expect(result).toBe(-5) // Should handle negative values
		})
	})
})
