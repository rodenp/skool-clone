"use client"

import type React from "react"
import { DragDropContext, Droppable, Draggable, type DropResult } from "react-beautiful-dnd"
import { GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"

interface SortableItem {
  id: string
  content: React.ReactNode
}

interface SortableListProps {
  items: SortableItem[]
  onReorder: (startIndex: number, endIndex: number) => void
  className?: string
  itemClassName?: string
  showDragHandle?: boolean
  disabled?: boolean
}

export function SortableList({
  items,
  onReorder,
  className,
  itemClassName,
  showDragHandle = true,
  disabled = false
}: SortableListProps) {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || disabled) {
      return
    }

    const startIndex = result.source.index
    const endIndex = result.destination.index

    if (startIndex !== endIndex) {
      onReorder(startIndex, endIndex)
    }
  }

  if (disabled) {
    return (
      <div className={cn("space-y-2", className)}>
        {items.map((item, index) => (
          <div
            key={item.id}
            className={cn(
              "flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-white",
              itemClassName
            )}
          >
            {showDragHandle && (
              <div className="text-gray-300">
                <GripVertical className="h-4 w-4" />
              </div>
            )}
            <div className="flex-1">{item.content}</div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="sortable-list">
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={cn(
              "space-y-2",
              snapshot.isDraggingOver && "bg-blue-50 rounded-lg p-2",
              className
            )}
          >
            {items.map((item, index) => (
              <Draggable key={item.id} draggableId={item.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={cn(
                      "flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-white transition-shadow",
                      snapshot.isDragging && "shadow-lg ring-2 ring-blue-500 ring-opacity-50",
                      itemClassName
                    )}
                  >
                    {showDragHandle && (
                      <div
                        {...provided.dragHandleProps}
                        className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
                      >
                        <GripVertical className="h-4 w-4" />
                      </div>
                    )}
                    <div className="flex-1">{item.content}</div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}
