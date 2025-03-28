declare module 'motion/react' {
    type MotionComponent<T extends React.ElementType> = React.ComponentType<
        React.ComponentPropsWithoutRef<T> & MotionProps
    >

    export const motion: {
        div: MotionComponent<'div'>
        span: MotionComponent<'span'>
        button: MotionComponent<'button'>
        a: MotionComponent<'a'>
        ul: MotionComponent<'ul'>
        li: MotionComponent<'li'>
        p: MotionComponent<'p'>
        h1: MotionComponent<'h1'>
        h2: MotionComponent<'h2'>
        h3: MotionComponent<'h3'>
        h4: MotionComponent<'h4'>
        h5: MotionComponent<'h5'>
        h6: MotionComponent<'h6'>
        img: MotionComponent<'img'>
        svg: MotionComponent<'svg'>
        path: MotionComponent<'path'>
        [key: string]: MotionComponent<React.ElementType>
    }

    export const AnimatePresence: React.FC<{
        children?: React.ReactNode
        mode?: 'sync' | 'wait' | 'popLayout'
        initial?: boolean
        onExitComplete?: () => void
    }>

    type VariantLabels = string | string[]
    type TargetAndTransition = Record<string, unknown>

    export interface MotionProps {
        initial?: boolean | VariantLabels | TargetAndTransition
        animate?: VariantLabels | TargetAndTransition
        exit?: VariantLabels | TargetAndTransition
        transition?: {
            duration?: number
            delay?: number
            ease?: string | number[]
            type?: string
            stiffness?: number
            damping?: number
            mass?: number
            velocity?: number
            [key: string]: unknown
        }
        variants?: Record<string, TargetAndTransition>
        whileHover?: VariantLabels | TargetAndTransition
        whileTap?: VariantLabels | TargetAndTransition
        whileFocus?: VariantLabels | TargetAndTransition
        whileDrag?: VariantLabels | TargetAndTransition
        whileInView?: VariantLabels | TargetAndTransition
        viewport?: Record<string, unknown>
        drag?: boolean | 'x' | 'y'
        dragConstraints?: Record<string, unknown>
        dragElastic?: number | { top?: number; right?: number; bottom?: number; left?: number }
        dragMomentum?: boolean
        dragTransition?: Record<string, unknown>
        onDrag?: (event: React.MouseEvent | React.TouchEvent | PointerEvent, info: PanInfo) => void
        onDragStart?: (event: React.MouseEvent | React.TouchEvent | PointerEvent, info: PanInfo) => void
        onDragEnd?: (event: React.MouseEvent | React.TouchEvent | PointerEvent, info: PanInfo) => void
        onDirectionLock?: (axis: 'x' | 'y') => void
    }

    export interface PanInfo {
        point: {
            x: number
            y: number
        }
        delta: {
            x: number
            y: number
        }
        offset: {
            x: number
            y: number
        }
        velocity: {
            x: number
            y: number
        }
    }
}
