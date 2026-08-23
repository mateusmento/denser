import type { ComputedRef } from 'vue'
import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'
import { createContext } from 'reka-ui'
import { cn } from '@/lib/utils'

export { default as Bubble } from './Bubble.vue'
export { default as BubbleContent } from './BubbleContent.vue'
export { default as BubbleGroup } from './BubbleGroup.vue'
export { default as BubbleReactions } from './BubbleReactions.vue'

/** Layout / positioning on the Bubble root. */
export const bubbleVariants = cva(
  cn([
    'gap-1 data-[align=end]:self-end max-w-[80%] data-[variant=ghost]:max-w-full',
    'group-data-[align=end]/message:self-end group/bubble relative flex w-fit min-w-0 flex-col',
  ]),
)

/** Paint / interaction on BubbleContent (variant from Bubble context). */
export const bubbleContentVariants = cva(
  cn([
    'rounded-xl rounded-tl-none border border-transparent px-2.5 py-0 text-sm leading-relaxed',
    'transition-[border-color,background-color,box-shadow] duration-[150ms,150ms,50ms]',
    '[button,a]:outline-none [button,a]:focus-visible:border-ring [button,a]:focus-visible:ring-3',
    '[button,a]:focus-visible:ring-ring/30 group-data-[align=end]/bubble:self-end',
    'w-fit max-w-full min-w-0 overflow-hidden wrap-break-word [button]:text-left [button,a]:transition-colors',
  ]),
  {
    variants: {
      variant: {
        default: cn([
          'bg-primary text-primary-foreground',
          '[&:is(button,a):hover]:bg-primary/80',
        ]),
        secondary: cn([
          'bg-secondary text-secondary-foreground',
          '[&:is(button,a):hover]:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]',
        ]),
        muted: cn([
          'bg-muted',
          '[&:is(button,a):hover]:bg-[color-mix(in_oklch,var(--muted),var(--foreground)_5%)]',
        ]),
        tinted: cn([
          'bg-[oklch(from_var(--primary)_0.93_calc(c*0.4)_h)]',
          'dark:bg-[oklch(from_var(--primary)_0.3_calc(c*0.4)_h)]',
          'text-foreground',
          '[&:is(button,a):hover]:bg-[oklch(from_var(--primary)_0.88_calc(c*0.5)_h)]',
          'dark:[&:is(button,a):hover]:bg-[oklch(from_var(--primary)_0.35_calc(c*0.5)_h)]',
        ]),
        outline: cn([
          'bg-background border-border',
          '[&:is(button,a):hover]:bg-muted',
          '[&:is(button,a):hover]:text-foreground',
          'dark:[&:is(button,a):hover]:bg-input/30',
        ]),
        ghost: cn([
          // `data-highlighted`: keep hover paint while a teleported hover menu is open
          'bg-transparent dark:hover:bg-secondary hover:bg-mist-50',
          'dark:data-[highlighted]:bg-secondary data-[highlighted]:bg-mist-50',
          'hover:shadow-[0_1px_2px_var(--color-mist-200)]',
          'data-[highlighted]:shadow-[0_1px_2px_var(--color-mist-200)]',
          'dark:hover:shadow-[0_1px_2px_var(--color-mist-950)]',
          'dark:data-[highlighted]:shadow-[0_1px_2px_var(--color-mist-950)]',
          'border-transparent hover:border-border data-[highlighted]:border-border',
          '[&:is(button,a):hover]:text-foreground',
          'dark:[&:is(button,a):hover]:bg-muted/50',
        ]),
        destructive: cn([
          'bg-destructive/10 dark:bg-destructive/20',
          'text-destructive',
          '[&:is(button,a):hover]:bg-destructive/20',
          'dark:[&:is(button,a):hover]:bg-destructive/30',
        ]),
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)
export type BubbleContentVariants = VariantProps<typeof bubbleContentVariants>
export type BubbleVariants = BubbleContentVariants
export type BubbleVariant = NonNullable<BubbleContentVariants['variant']>

export interface BubbleContext {
  variant: ComputedRef<BubbleVariant>
}

export const [injectBubbleContext, provideBubbleContext]
  = createContext<BubbleContext>('Bubble')

export const bubbleReactionsVariants = cva(
  cn([
    'rounded-full ring-3 ring-card bg-muted shrink-0 gap-1 px-1.5 py-0.5 has-[button]:p-0 text-sm absolute z-10',
    'flex w-fit items-center justify-center',
  ]),
  {
    variants: {
      side: {
        top: 'top-0 -translate-y-3/4',
        bottom: 'bottom-0 translate-y-3/4',
      },
      align: {
        start: 'left-3',
        end: 'right-3',
      },
    },
    defaultVariants: {
      side: 'bottom',
      align: 'end',
    },
  },
)
export type BubbleReactionsVariants = VariantProps<typeof bubbleReactionsVariants>
