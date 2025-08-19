import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAutosaveDraft } from '../../hooks/useAutosaveDraft'

// Mock localStorage
const localStorageMock = {
	getItem: vi.fn(),
	setItem: vi.fn(),
	removeItem: vi.fn(),
	clear: vi.fn(),
}
global.localStorage = localStorageMock

describe('useAutosaveDraft', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	it('should initialize with default values', () => {
		const { result } = renderHook(() => 
			useAutosaveDraft({ 
				isOpen: true, 
				isReadyRef: { current: true }, 
				storageKey: 'test-key', 
				payload: { data: 'test' }, 
				delay: 1000 
			})
		)

		expect(result.current.hasDraft).toBe(false)
		expect(result.current.savedAt).toBeNull()
	})

	it('should save draft after delay', async () => {
		const { result } = renderHook(() => 
			useAutosaveDraft({ 
				isOpen: true, 
				isReadyRef: { current: true }, 
				storageKey: 'test-key', 
				payload: { data: 'updated' }, 
				delay: 1000 
			})
		)

		// Fast-forward time
		act(() => {
			vi.advanceTimersByTime(1000)
		})

		expect(localStorageMock.setItem).toHaveBeenCalledWith(
			'test-key',
			JSON.stringify({ data: 'updated', savedAt: expect.any(Number) })
		)
	})

	it('should not save draft if modal is closed', () => {
		renderHook(() => 
			useAutosaveDraft({ 
				isOpen: false, 
				isReadyRef: { current: true }, 
				storageKey: 'test-key', 
				payload: { data: 'test' }, 
				delay: 1000 
			})
		)

		act(() => {
			vi.advanceTimersByTime(1000)
		})

		expect(localStorageMock.setItem).not.toHaveBeenCalled()
	})

	it('should not save draft if not ready', () => {
		renderHook(() => 
			useAutosaveDraft({ 
				isOpen: true, 
				isReadyRef: { current: false }, 
				storageKey: 'test-key', 
				payload: { data: 'test' }, 
				delay: 1000 
			})
		)

		act(() => {
			vi.advanceTimersByTime(1000)
		})

		expect(localStorageMock.setItem).not.toHaveBeenCalled()
	})

	it('should debounce multiple saves', () => {
		const { rerender } = renderHook(
			({ payload }) => useAutosaveDraft({ 
				isOpen: true, 
				isReadyRef: { current: true }, 
				storageKey: 'test-key', 
				payload, 
				delay: 1000 
			}),
			{ initialProps: { payload: { data: 'first' } } }
		)

		// Change payload multiple times quickly
		rerender({ payload: { data: 'second' } })
		rerender({ payload: { data: 'third' } })

		// Only 500ms have passed
		act(() => {
			vi.advanceTimersByTime(500)
		})

		expect(localStorageMock.setItem).not.toHaveBeenCalled()

		// Complete the delay
		act(() => {
			vi.advanceTimersByTime(500)
		})

		expect(localStorageMock.setItem).toHaveBeenCalledTimes(1)
		expect(localStorageMock.setItem).toHaveBeenCalledWith(
			'test-key',
			JSON.stringify({ data: 'third', savedAt: expect.any(Number) })
		)
	})

	it('should load existing draft on mount', () => {
		const existingDraft = { data: 'existing', savedAt: Date.now() }
		localStorageMock.getItem.mockReturnValue(JSON.stringify(existingDraft))

		const { result } = renderHook(() => 
			useAutosaveDraft({ 
				isOpen: true, 
				isReadyRef: { current: true }, 
				storageKey: 'test-key', 
				payload: { data: 'new' }, 
				delay: 1000 
			})
		)

		expect(result.current.hasDraft).toBe(true)
		expect(result.current.savedAt).toBe(existingDraft.savedAt)
	})

	it('should clear draft when requested', () => {
		const { result } = renderHook(() => 
			useAutosaveDraft({ 
				isOpen: true, 
				isReadyRef: { current: true }, 
				storageKey: 'test-key', 
				payload: { data: 'test' }, 
				delay: 1000 
			})
		)

		act(() => {
			result.current.clearDraft()
		})

		expect(localStorageMock.removeItem).toHaveBeenCalledWith('test-key')
		expect(result.current.hasDraft).toBe(false)
		expect(result.current.savedAt).toBeNull()
	})
})
