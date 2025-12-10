import React from 'react';
import { Dimension, Software } from '../types';
import { Trash2, Plus, FileText, Edit2, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ComparisonTableProps {
  dimensions: Dimension[];
  softwares: Software[];
  onUpdateScore: (softwareId: string, dimensionId: string, value: number) => void;
  onEditDescription: (softwareId: string, dimensionId: string) => void;
  onDeleteDimension: (id: string) => void;
  onDeleteSoftware: (id: string) => void;
  onReorderSoftwares: (oldIndex: number, newIndex: number) => void;
  onReorderDimensions: (oldIndex: number, newIndex: number) => void;
}

// --- Sortable Components ---

interface SortableHeaderProps {
  id: string;
  software: Software;
  onDelete: (id: string) => void;
}

// Sortable Header (Column)
const SortableHeader: React.FC<SortableHeaderProps> = ({
  id,
  software,
  onDelete,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 'auto',
  };

  return (
    <th
      ref={setNodeRef}
      style={style}
      className="px-2 py-4 text-center text-xs font-medium uppercase tracking-wider group relative min-w-[140px] bg-gray-900/95"
    >
      <div className="flex items-center justify-center gap-2">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-600 hover:text-gray-300"
          title="Drag to reorder"
        >
          <GripVertical size={14} />
        </button>
        <span style={{ color: software.color }}>{software.name}</span>
      </div>
      <button
        onClick={() => onDelete(software.id)}
        className="absolute top-1 right-1 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
        title="删除该软件"
      >
        <Trash2 size={14} />
      </button>
    </th>
  );
};

interface SortableRowProps {
  id: string;
  dimension: Dimension;
  children: React.ReactNode;
  onDelete: (id: string) => void;
}

// Sortable Row (Dimension)
const SortableRow: React.FC<SortableRowProps> = ({
  id,
  dimension,
  children,
  onDelete,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 'auto',
    position: isDragging ? 'relative' as const : undefined, // Fix z-index stacking context
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`hover:bg-gray-700/30 transition-colors group/row ${isDragging ? 'bg-gray-700/50' : ''}`}
    >
      <td className="px-4 py-4 text-sm font-medium text-gray-300 sticky left-0 bg-gray-800 z-10 align-top shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-2 mt-2">
          <div
             {...attributes}
             {...listeners}
             className="cursor-grab active:cursor-grabbing text-gray-600 hover:text-gray-400 p-1 -ml-2"
          >
             <GripVertical size={14} />
          </div>
          <span>{dimension.name}</span>
           <button
            onClick={() => onDelete(dimension.id)}
            className="text-gray-600 hover:text-red-400 transition-colors p-1 rounded opacity-0 group-hover/row:opacity-100 ml-auto"
            title="删除该维度"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
      {children}
    </tr>
  );
};

// --- Main Component ---

const ComparisonTable: React.FC<ComparisonTableProps> = ({
  dimensions,
  softwares,
  onUpdateScore,
  onEditDescription,
  onDeleteDimension,
  onDeleteSoftware,
  onReorderSoftwares,
  onReorderDimensions,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Avoid accidental drags
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;
    if (active.id === over.id) return;

    // Determine if we are dragging a Software (column) or a Dimension (row)
    const activeId = active.id as string;
    const overId = over.id as string;

    const isSoftware = softwares.some((s) => s.id === activeId);
    const isDimension = dimensions.some((d) => d.id === activeId);

    if (isSoftware) {
      const oldIndex = softwares.findIndex((s) => s.id === activeId);
      const newIndex = softwares.findIndex((s) => s.id === overId);
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorderSoftwares(oldIndex, newIndex);
      }
    } else if (isDimension) {
      const oldIndex = dimensions.findIndex((d) => d.id === activeId);
      const newIndex = dimensions.findIndex((d) => d.id === overId);
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorderDimensions(oldIndex, newIndex);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="overflow-x-auto bg-gray-800 rounded-xl shadow-lg border border-gray-700">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-900/50">
            <tr>
              <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider sticky left-0 bg-gray-900/95 z-20 w-48 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                维度 / 软件
              </th>
              
              <SortableContext
                items={softwares.map((s) => s.id)}
                strategy={horizontalListSortingStrategy}
              >
                {softwares.map((sw) => (
                  <SortableHeader
                    key={sw.id}
                    id={sw.id}
                    software={sw}
                    onDelete={onDeleteSoftware}
                  />
                ))}
              </SortableContext>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            <SortableContext
              items={dimensions.map((d) => d.id)}
              strategy={verticalListSortingStrategy}
            >
              {dimensions.map((dim) => (
                <SortableRow
                  key={dim.id}
                  id={dim.id}
                  dimension={dim}
                  onDelete={onDeleteDimension}
                >
                  {/* Render cells for this row */}
                  {softwares.map((sw) => {
                    const description = sw.descriptions?.[dim.id];
                    return (
                      <td
                        key={`${sw.id}-${dim.id}`}
                        className="px-2 py-3 align-top relative"
                      >
                        <div className="flex flex-col items-center gap-3">
                          {/* Score Input */}
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-[10px] text-gray-500 uppercase tracking-tighter">
                              评分
                            </span>
                            <input
                              type="number"
                              min="0"
                              max="10"
                              value={sw.scores[dim.id] || 0}
                              onChange={(e) => {
                                const val = Math.max(
                                  0,
                                  Math.min(10, Number(e.target.value))
                                );
                                onUpdateScore(sw.id, dim.id, val);
                              }}
                              className="w-12 bg-gray-900 border border-gray-600 rounded text-center text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none p-1 text-sm font-bold"
                            />
                          </div>

                          {/* Description Button / Preview */}
                          {description ? (
                            <div className="relative group/tooltip w-full">
                              <button
                                onClick={() => onEditDescription(sw.id, dim.id)}
                                className="w-full flex items-center justify-center gap-2 px-2 py-1.5 rounded border border-gray-700 bg-gray-800/50 hover:bg-gray-700 hover:border-blue-500/50 transition-all text-left group"
                              >
                                <FileText
                                  size={14}
                                  className="text-blue-400 shrink-0"
                                />
                                <span className="text-xs text-gray-300 truncate max-w-[80px] opacity-80 group-hover:opacity-100">
                                  {description}
                                </span>
                                <Edit2
                                  size={10}
                                  className="text-gray-500 opacity-0 group-hover:opacity-100 ml-auto shrink-0"
                                />
                              </button>

                              {/* Custom Tooltip on Hover */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 bg-gray-900 text-xs text-gray-200 rounded-lg shadow-xl border border-gray-600 hidden group-hover/tooltip:block z-50 pointer-events-none whitespace-pre-wrap break-words leading-relaxed text-left">
                                <div className="font-semibold text-blue-400 mb-1 border-b border-gray-700 pb-1">
                                  详细描述
                                </div>
                                {description}
                                {/* Arrow */}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-600"></div>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => onEditDescription(sw.id, dim.id)}
                              className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-400 transition-colors px-2 py-1 rounded hover:bg-gray-700/50 opacity-60 hover:opacity-100"
                            >
                              <Plus size={12} />
                              <span>添加描述</span>
                            </button>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </SortableRow>
              ))}
            </SortableContext>
          </tbody>
        </table>
        {softwares.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            暂无软件数据，请添加软件开始对比。
          </div>
        )}
      </div>
    </DndContext>
  );
};

export default ComparisonTable;