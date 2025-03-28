/**
 * Balance Formatter Service
 * Provides utility functions for formatting currency values
 */
export class BalanceFormatterService {
    /**
     * Format a numeric value as USD currency
     * @param value The numeric value to format
     * @param options Formatting options
     * @returns Formatted currency string
     */
    static formatAsCurrency(
        value: string | number | undefined | null,
        options: {
            currency?: string
            minimumFractionDigits?: number
            maximumFractionDigits?: number
            fallbackValue?: string
        } = {},
    ): string {
        // Set default options
        const {
            currency = 'USD',
            minimumFractionDigits = 2,
            maximumFractionDigits = 2,
            fallbackValue = '$0.00',
        } = options

        // Handle null or undefined values
        if (value === null || value === undefined) {
            return fallbackValue
        }

        try {
            // Convert string to number if needed
            const numericValue = typeof value === 'string' ? parseFloat(value) : value

            // Check if the value is a valid number
            if (isNaN(numericValue)) {
                console.warn('BalanceFormatterService: Invalid numeric value', value)
                return fallbackValue
            }

            // Format the value as currency
            return numericValue.toLocaleString('en-US', {
                style: 'currency',
                currency,
                minimumFractionDigits,
                maximumFractionDigits,
            })
        } catch (error) {
            console.error('BalanceFormatterService: Error formatting value', error)
            return fallbackValue
        }
    }

    /**
     * Format a numeric value with abbreviated units (K, M, B, T)
     * @param value The numeric value to format
     * @param options Formatting options
     * @returns Formatted string with abbreviated units
     */
    static formatWithAbbreviatedUnits(
        value: string | number | undefined | null,
        options: {
            currency?: string
            decimalPlaces?: number
            fallbackValue?: string
        } = {},
    ): string {
        // Set default options
        const { currency = 'USD', decimalPlaces = 2, fallbackValue = '$0' } = options

        // Handle null or undefined values
        if (value === null || value === undefined) {
            return fallbackValue
        }

        try {
            // Convert string to number if needed
            const numericValue = typeof value === 'string' ? parseFloat(value) : value

            // Check if the value is a valid number
            if (isNaN(numericValue)) {
                console.warn('BalanceFormatterService: Invalid numeric value', value)
                return fallbackValue
            }

            // Define abbreviation thresholds and suffixes
            const abbreviations = [
                { threshold: 1e12, suffix: 'T' },
                { threshold: 1e9, suffix: 'B' },
                { threshold: 1e6, suffix: 'M' },
                { threshold: 1e3, suffix: 'K' },
                { threshold: 1, suffix: '' },
            ]

            // Find the appropriate abbreviation
            const abbreviation = abbreviations.find(abbr => Math.abs(numericValue) >= abbr.threshold)

            if (!abbreviation) {
                return fallbackValue
            }

            // Format the value with the abbreviation
            const formattedValue = (numericValue / abbreviation.threshold).toFixed(decimalPlaces)

            // Remove trailing zeros after decimal point
            const cleanedValue = formattedValue.replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1')

            // Add currency symbol and abbreviation suffix
            return currency === 'USD'
                ? `$${cleanedValue}${abbreviation.suffix}`
                : `${cleanedValue}${abbreviation.suffix} ${currency}`
        } catch (error) {
            console.error('BalanceFormatterService: Error formatting value with abbreviated units', error)
            return fallbackValue
        }
    }

    /**
     * Apply privacy mask to a formatted balance
     * @returns Privacy masked string
     */
    static applyPrivacyMask(): string {
        return '••••••'
    }
}
