import { BalanceFormatterService } from '@/services/balance-formatter.service'
import { describe, expect, it } from 'vitest'

describe('BalanceFormatterService', () => {
    describe('formatAsCurrency', () => {
        it('should format a number as USD currency', () => {
            expect(BalanceFormatterService.formatAsCurrency(1234.56)).toBe('$1,234.56')
        })

        it('should format a string number as USD currency', () => {
            expect(BalanceFormatterService.formatAsCurrency('1234.56')).toBe('$1,234.56')
        })

        it('should handle zero values', () => {
            expect(BalanceFormatterService.formatAsCurrency(0)).toBe('$0.00')
            expect(BalanceFormatterService.formatAsCurrency('0')).toBe('$0.00')
        })

        it('should handle null or undefined values', () => {
            expect(BalanceFormatterService.formatAsCurrency(null)).toBe('$0.00')
            expect(BalanceFormatterService.formatAsCurrency(undefined)).toBe('$0.00')
        })

        it('should handle invalid numeric strings', () => {
            expect(BalanceFormatterService.formatAsCurrency('not-a-number')).toBe('$0.00')
        })

        it('should format with custom currency', () => {
            expect(BalanceFormatterService.formatAsCurrency(1234.56, { currency: 'EUR' })).toBe('€1,234.56')
        })

        it('should format with custom fraction digits', () => {
            expect(
                BalanceFormatterService.formatAsCurrency(1234.56789, {
                    minimumFractionDigits: 3,
                    maximumFractionDigits: 3,
                }),
            ).toBe('$1,234.568')
        })

        it('should use custom fallback value', () => {
            expect(BalanceFormatterService.formatAsCurrency(null, { fallbackValue: 'N/A' })).toBe('N/A')
        })
    })

    describe('formatWithAbbreviatedUnits', () => {
        it('should format thousands with K suffix', () => {
            expect(BalanceFormatterService.formatWithAbbreviatedUnits(1234)).toBe('$1.23K')
        })

        it('should format millions with M suffix', () => {
            expect(BalanceFormatterService.formatWithAbbreviatedUnits(1234567)).toBe('$1.23M')
        })

        it('should format billions with B suffix', () => {
            expect(BalanceFormatterService.formatWithAbbreviatedUnits(1234567890)).toBe('$1.23B')
        })

        it('should format trillions with T suffix', () => {
            expect(BalanceFormatterService.formatWithAbbreviatedUnits(1234567890123)).toBe('$1.23T')
        })

        it('should handle small values without suffix', () => {
            expect(BalanceFormatterService.formatWithAbbreviatedUnits(123)).toBe('$123')
        })

        it('should handle zero values', () => {
            expect(BalanceFormatterService.formatWithAbbreviatedUnits(0)).toBe('$0')
        })

        it('should handle null or undefined values', () => {
            expect(BalanceFormatterService.formatWithAbbreviatedUnits(null)).toBe('$0')
            expect(BalanceFormatterService.formatWithAbbreviatedUnits(undefined)).toBe('$0')
        })

        it('should format with custom decimal places', () => {
            expect(BalanceFormatterService.formatWithAbbreviatedUnits(1234, { decimalPlaces: 1 })).toBe('$1.2K')
        })

        it('should format with custom currency', () => {
            expect(BalanceFormatterService.formatWithAbbreviatedUnits(1234, { currency: 'EUR' })).toBe('1.23K EUR')
        })

        it('should use custom fallback value', () => {
            expect(BalanceFormatterService.formatWithAbbreviatedUnits(null, { fallbackValue: 'N/A' })).toBe('N/A')
        })
    })

    describe('applyPrivacyMask', () => {
        it('should return a privacy mask', () => {
            expect(BalanceFormatterService.applyPrivacyMask()).toBe('••••••')
        })
    })
})
