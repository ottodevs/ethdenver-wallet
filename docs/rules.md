# Rules

## General

- Don't introduce any new dependencies without discussing it first
- We use Next, Tailwind, Tanstack Query, Legend State, Okto, and React with TypeScript
- We use shadcn/ui for the components with radix under the hood, and sonner, recharts and other libraries that shadcn/ui uses under the hood

## Legend State

We use the latest v3 version of Legend State.

Use the correct imports for the plugins:
import { configureSynced } from "@legendapp/state/sync"
import { syncedFetch } from "@legendapp/state/sync-plugins/fetch";

## Next.js

We use the latest version of Next.js 15

## Tailwind CSS

- We use the latest version of Tailwind CSS 4
- Use shorthands where possible, like bg-black/50 instead of bg-black bg-opacity-50 and the size instead of w-full h-full, the normal shorthands that the eslint plugin for tailwindcss rules will give you

## Typescript

- Don't use types like "any", try to always use the most specific type, or create a new type if the don't exist, based on the context and use

## React

- Prevent re-renders, use memoization where needed and combine with legend observable to make it reactive and make fine-grained reactivity

## Zod

- We use zod for validation where needed
