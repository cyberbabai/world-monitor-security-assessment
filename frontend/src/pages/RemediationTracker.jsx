import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import SeverityBadge from '../components/findings/SeverityBadge'
import { MOCK_FINDINGS } from '../lib/mockData'
import { pageVariants } from '../lib/motion'

const COLUMNS = [
  { id: 'open',        label: 'Open',        color: '#636366' },
  { id: 'in-progress', label: 'In Progress', color: '#0A84FF' },
  { id: 'fixed',       label: 'Fixed',       color: '#30D158' },
  { id: 'accepted',    label: 'Accepted',    color: '#FF9F0A' },
]

function FindingCard({ finding }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: finding.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      whileTap={{ scale: 0.98 }}
      className="glass-card-sm p-3.5 cursor-grab active:cursor-grabbing select-none
        hover:bg-white/[0.09] transition-colors duration-150"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-[13px] font-medium text-white leading-tight">{finding.title}</p>
        <SeverityBadge severity={finding.severity} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-white/40">{finding.category}</span>
        <span className="text-[12px] font-bold text-white/60">{finding.cvss}</span>
      </div>
    </motion.div>
  )
}

function Column({ column, items }) {
  const ids = items.map((f) => f.id)
  return (
    <div className="flex-1 min-w-64 flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: column.color }} />
          <span className="text-[14px] font-semibold text-white">{column.label}</span>
        </div>
        <span className="text-[12px] text-white/40 px-2 py-0.5 rounded-full bg-white/[0.06]">
          {items.length}
        </span>
      </div>

      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 min-h-24 p-3 rounded-[16px]"
          style={{ background: `${column.color}08`, border: `1px solid ${column.color}15` }}>
          {items.map((f) => <FindingCard key={f.id} finding={f} />)}
          {items.length === 0 && (
            <div className="flex items-center justify-center h-16 text-[13px] text-white/20">
              Drop here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  )
}

export default function RemediationTracker() {
  const [items, setItems] = useState(() =>
    MOCK_FINDINGS.map((f) => ({ ...f, column: f.status ?? 'open' }))
  )

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    const activeItem = items.find((i) => i.id === active.id)
    const overItem = items.find((i) => i.id === over.id)
    if (!activeItem || !overItem) return

    if (activeItem.column !== overItem.column) {
      setItems((prev) => prev.map((i) =>
        i.id === active.id ? { ...i, column: overItem.column } : i
      ))
    } else {
      const colItems = items.filter((i) => i.column === activeItem.column)
      const oldIdx = colItems.findIndex((i) => i.id === active.id)
      const newIdx = colItems.findIndex((i) => i.id === over.id)
      const reordered = arrayMove(colItems, oldIdx, newIdx)
      const otherItems = items.filter((i) => i.column !== activeItem.column)
      setItems([...otherItems, ...reordered])
    }
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="p-8 space-y-6"
    >
      <div>
        <h1 className="text-[34px] font-bold text-white">Remediation Tracker</h1>
        <p className="text-[15px] text-white/50 mt-1">Drag findings between columns to update status</p>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <Column
              key={col.id}
              column={col}
              items={items.filter((i) => i.column === col.id)}
            />
          ))}
        </div>
      </DndContext>
    </motion.div>
  )
}
