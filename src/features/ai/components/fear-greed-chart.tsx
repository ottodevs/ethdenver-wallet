'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { FearGreedHistoryData } from '../services/fear-greed-service'

type FearGreedChartProps = {
    data: FearGreedHistoryData[]
    currentValue: number
    currentClassification: string
}

export function FearGreedChart({ data, currentValue, currentClassification }: FearGreedChartProps) {
    const { theme } = useTheme()
    const [mounted, setMounted] = useState(false)

    // Asegurarse de que el componente solo se renderice en el cliente
    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return null
    }

    // Colores basados en el tema
    const textColor = theme === 'dark' ? '#FFFFFF' : '#000000'
    const gridColor = theme === 'dark' ? '#333333' : '#DDDDDD'
    const tooltipBg = theme === 'dark' ? '#1A1A28' : '#FFFFFF'

    // Determinar el color del índice actual
    const getIndexColor = (value: number) => {
        if (value <= 25) return '#E31A1A' // Extreme Fear - Rojo
        if (value <= 40) return '#FF9500' // Fear - Naranja
        if (value <= 60) return '#FFCC00' // Neutral - Amarillo
        if (value <= 75) return '#7CBA01' // Greed - Verde claro
        return '#009F6B' // Extreme Greed - Verde
    }

    const indexColor = getIndexColor(currentValue)

    // Función para obtener el color del gradiente según el valor
    const getGradientColor = (value: number) => {
        if (value <= 25) return ['#E31A1A', '#FF9500'] // Extreme Fear to Fear
        if (value <= 40) return ['#FF9500', '#FFCC00'] // Fear to Neutral
        if (value <= 60) return ['#FFCC00', '#7CBA01'] // Neutral to Greed
        return ['#7CBA01', '#009F6B'] // Greed to Extreme Greed
    }

    // Obtener el color para el gradiente del gráfico
    const gradientColors = getGradientColor(currentValue)

    return (
        <Card className='mx-auto w-full max-w-3xl'>
            <CardHeader>
                <CardTitle className='flex items-center justify-between'>
                    <span>Crypto Fear & Greed Index</span>
                    <div className='flex items-center gap-2'>
                        <div className='h-4 w-4 rounded-full' style={{ backgroundColor: indexColor }} />
                        <span className='text-lg font-bold'>{currentValue}</span>
                    </div>
                </CardTitle>
                <CardDescription>
                    Current market sentiment: <span className='font-medium'>{currentClassification}</span>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className='h-[300px] w-full'>
                    <ResponsiveContainer width='100%' height='100%'>
                        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id='colorValue' x1='0' y1='0' x2='0' y2='1'>
                                    <stop offset='5%' stopColor={gradientColors[0]} stopOpacity={0.8} />
                                    <stop offset='95%' stopColor={gradientColors[1]} stopOpacity={0.2} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey='date'
                                tick={{ fill: textColor }}
                                tickFormatter={value => {
                                    const date = new Date(value)
                                    return `${date.getDate()}/${date.getMonth() + 1}`
                                }}
                            />
                            <YAxis domain={[0, 100]} tick={{ fill: textColor }} tickCount={5} />
                            <CartesianGrid strokeDasharray='3 3' stroke={gridColor} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: tooltipBg,
                                    border: `1px solid ${gridColor}`,
                                }}
                                formatter={(value: number) => [`${value} - ${getClassification(value)}`, 'Index']}
                                labelFormatter={label => {
                                    const date = new Date(label)
                                    return date.toLocaleDateString()
                                }}
                            />
                            <Area
                                type='monotone'
                                dataKey='value'
                                stroke={indexColor}
                                fillOpacity={1}
                                fill='url(#colorValue)'
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <div className='mt-4 flex justify-between text-xs'>
                    <div className='text-red-500'>Extreme Fear</div>
                    <div className='text-orange-500'>Fear</div>
                    <div className='text-yellow-500'>Neutral</div>
                    <div className='text-green-500'>Greed</div>
                    <div className='text-emerald-500'>Extreme Greed</div>
                </div>
            </CardContent>
        </Card>
    )
}

// Función auxiliar para obtener la clasificación según el valor
function getClassification(value: number): string {
    if (value <= 25) return 'Extreme Fear'
    if (value <= 40) return 'Fear'
    if (value <= 60) return 'Neutral'
    if (value <= 75) return 'Greed'
    return 'Extreme Greed'
}
