"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { formatInManila, formatDateForAPI } from "@/lib/types"
import { cn } from "@/lib/utils"

interface DateSelectorProps {
    selectedDate: Date
    onDateChange: (date: Date) => void
}

export function DateSelector({ selectedDate, onDateChange }: DateSelectorProps) {
    const goToPreviousDay = () => {
        const newDate = new Date(selectedDate)
        newDate.setDate(newDate.getDate() - 1)
        onDateChange(newDate)
    }

    const goToNextDay = () => {
        const newDate = new Date(selectedDate)
        newDate.setDate(newDate.getDate() + 1)
        onDateChange(newDate)
    }

    const goToToday = () => {
        onDateChange(new Date())
    }

    const isToday = formatDateForAPI(selectedDate) === formatDateForAPI(new Date())

    return (
        <div className="flex items-center gap-2">
            <Button
                variant="outline"
                size="icon"
                onClick={goToPreviousDay}
                className="h-10 w-10"
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>

            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className={cn(
                            "min-w-[200px] justify-start text-left font-normal",
                            !selectedDate && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? formatInManila(selectedDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && onDateChange(date)}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>

            <Button
                variant="outline"
                size="icon"
                onClick={goToNextDay}
                className="h-10 w-10"
            >
                <ChevronRight className="h-4 w-4" />
            </Button>

            {!isToday && (
                <Button
                    variant="default"
                    onClick={goToToday}
                    className="ml-2"
                >
                    Today
                </Button>
            )}
        </div>
    )
}
