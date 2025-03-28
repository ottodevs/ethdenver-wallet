import type { Transaction } from '../hooks/use-okto-transactions'
import { transactionsState$ } from '../hooks/use-okto-transactions'

// Re-export the transactions state
export { transactionsState$ }
export type { Transaction }
