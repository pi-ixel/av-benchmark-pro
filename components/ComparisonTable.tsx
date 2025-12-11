import React, { useState, useRef, useEffect } from 'react';
import { Dimension, Software } from '../types';
import { Trash2, Plus, FileText, Edit2, GripVertical, Settings, Check, X } from 'lucide-react';
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
  onUpdateSoftwareDetails: (id: string, name: string, color: string) => void;
  onUpdateDimensionName: (id: string, name: string) => void;
}

// --- Sortable Components ---

interface SortableHeaderProps {
  id: string;
  software: Software;
  onDelete: (id: string) => void;
  onUpdateDetails: (id: string, name: string, color: string) => void;
}

// Sortable Header (Column)
const SortableHeader: React.FC<SortableHeaderProps> = ({
  id,
  software,
  onDelete,
  onUpdateDetails,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 'auto',
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(software.name);
  const [editColor, setEditColor] = useState(software.color);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
            setIsEditing(false);
        }
    };
    if (isEditing) {
        document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditing]);

  const handleSave = () => {
      onUpdateDetails(software.id, editName, editColor);
      setIsEditing(false);
  };

  return (
    <th
      ref={setNodeRef}
      style={style}
      className="px-2 py-4 text-center text-xs font-medium uppercase tracking-wider group relative min-w-[140px] bg-gray-900/95"
    >
      <div className="flex flex-col items-center justify-center gap-2">
        <div className="flex items-center gap-2">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-600 hover:text-gray-300"
            title="拖拽排序"
          >
            <GripVertical size={14} />
          </button>
          
          <span 
            className="font-bold text-sm truncate max-w-[120px]" 
            style={{ color: software.color }}
          >
            {software.name}
          </span>
          
          <button
            onClick={() => {
                setEditName(software.name);
                setEditColor(software.color);
                setIsEditing(true);
            }}
            className="text-gray-600 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
            title="编辑名称与颜色"
          >
            <Settings size={14} />
          </button>
        </div>

        {/* Action Buttons (Absolute) */}
        <button
            onClick={() => onDelete(software.id)}
            className="absolute top-1 right-1 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            title="删除该软件"
        >
            <Trash2 size={14} />
        </button>
      </div>

      {/* Edit Popover */}
      {isEditing && (
        <div 
            ref={popoverRef}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-gray-800 border border-gray-600 rounded-lg shadow-xl p-3 z-50 flex flex-col gap-3 text-left"
            onMouseDown={(e) => e.stopPropagation()} // Prevent drag start
        >
            <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-400 uppercase">软件名称</label>
                <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded p-1.5 text-white text-sm focus:border-blue-500 outline-none"
                    autoFocus
                />
            </div>
            <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-400 uppercase">代表色</label>
                <div className="flex items-center gap-2">
                    <input 
                        type="color" 
                        value={editColor}
                        onChange={(e) => setEditColor(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer bg-transparent border-none p-0"
                    />
                    <span className="text-xs text-gray-400 font-mono">{editColor}</span>
                </div>
            </div>
            <div className="flex justify-end gap-2 mt-1">
                <button 
                    onClick={() => setIsEditing(false)}
                    className="px-2 py-1 text-xs text-gray-400 hover:text-white"
                >
                    取消
                </button>
                <button 
                    onClick={handleSave}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded"
                >
                    保存
                </button>
            </div>
        </div>
      )}
    </th>
  );
};

interface SortableRowProps {
  id: string;
  dimension: Dimension;
  children: React.ReactNode;
  onDelete: (id: string) => void;
  onUpdateName: (id: string, name: string) => void;
}

// Sortable Row (Dimension)
const SortableRow: React.FC<SortableRowProps> = ({
  id,
  dimension,
  children,
  onDelete,
  onUpdateName,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 'auto',
    position: isDragging ? 'relative' as const : undefined,
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(dimension.name);

  const handleSave = () => {
    if (editName.trim()) {
        onUpdateName(dimension.id, editName);
    } else {
        setEditName(dimension.name); // Revert if empty
    }
    setIsEditing(false);
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`hover:bg-gray-700/30 transition-colors group/row ${isDragging ? 'bg-gray-700/50' : ''}`}
    >
      <td className="px-4 py-4 text-sm font-medium text-gray-300 sticky left-0 bg-gray-800 z-10 align-top shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)] min-w-[150px]">
        <div className="flex items-center gap-2 mt-2 w-full">
          <div
             {...attributes}
             {...listeners}
             className="cursor-grab active:cursor-grabbing text-gray-600 hover:text-gray-400 p-1 -ml-2 shrink-0"
          >
             <GripVertical size={14} />
          </div>
          
          {isEditing ? (
             <div className="flex items-center gap-1 w-full">
                <input 
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave();
                        if (e.key === 'Escape') {
                            setEditName(dimension.name);
                            setIsEditing(false);
                        }
                    }}
                    onBlur={handleSave}
                    autoFocus
                    className="w-full bg-gray-900 border border-blue-500 rounded px-2 py-1 text-sm outline-none"
                />
             </div>
          ) : (
            <>
                <span className="truncate" title={dimension.name}>{dimension.name}</span>
                <button
                    onClick={() => {
                        setEditName(dimension.name);
                        setIsEditing(true);
                    }}
                    className="text-gray-600 hover:text-blue-400 p-1 opacity-0 group-hover/row:opacity-100 transition-opacity ml-1"
                    title="编辑名称"
                >
                    <Edit2 size={12} />
                </button>
            </>
          )}

           <button
            onClick={() => onDelete(dimension.id)}
            className="text-gray-600 hover:text-red-400 transition-colors p-1 rounded opacity-0 group-hover/row:opacity-100 ml-auto shrink-0"
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
  onUpdateSoftwareDetails,
  onUpdateDimensionName,
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
      <div className="overflow-x-auto bg-gray-800 rounded-xl shadow-lg border border-gray-700 min-h-[300px]">
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
                    onUpdateDetails={onUpdateSoftwareDetails}
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
                  onUpdateName={onUpdateDimensionName}
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