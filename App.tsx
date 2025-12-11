import React, { useState, useCallback, useRef } from 'react';
import { INITIAL_DIMENSIONS, INITIAL_SOFTWARES } from './constants';
import { Dimension, Software } from './types';
import RadarChartVis from './components/RadarChartVis';
import ComparisonTable from './components/ComparisonTable';
import { arrayMove } from '@dnd-kit/sortable';
import { 
  ShieldCheck, 
  Plus, 
  BarChart2, 
  Settings2,
  X,
  Save,
  MessageSquare,
  Download,
  Upload
} from 'lucide-react';

// Simple unique ID generator
const generateId = () => Math.random().toString(36).substr(2, 9);

// CSV Helper Functions
const escapeCSV = (str: string | number | undefined) => {
  if (str === null || str === undefined) return '';
  const stringValue = String(str);
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const parseCSVLine = (line: string) => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
};

function App() {
  const [dimensions, setDimensions] = useState<Dimension[]>(INITIAL_DIMENSIONS);
  const [softwares, setSoftwares] = useState<Software[]>(INITIAL_SOFTWARES);
  
  // UI State for Modals/Panels
  const [showAddSoftware, setShowAddSoftware] = useState(false);
  const [showAddDimension, setShowAddDimension] = useState(false);
  
  // File Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for Description Modal
  const [editingDesc, setEditingDesc] = useState<{
    swId: string;
    dimId: string;
    swName: string;
    dimName: string;
    text: string;
  } | null>(null);

  const [newSoftwareName, setNewSoftwareName] = useState('');
  const [newDimensionName, setNewDimensionName] = useState('');

  // --- Handlers ---

  const handleScoreUpdate = useCallback((softwareId: string, dimensionId: string, value: number) => {
    setSoftwares(prev => prev.map(sw => {
      if (sw.id === softwareId) {
        return {
          ...sw,
          scores: {
            ...sw.scores,
            [dimensionId]: value
          }
        };
      }
      return sw;
    }));
  }, []);

  const handleOpenDescriptionModal = useCallback((softwareId: string, dimensionId: string) => {
    const sw = softwares.find(s => s.id === softwareId);
    const dim = dimensions.find(d => d.id === dimensionId);
    if (sw && dim) {
      setEditingDesc({
        swId: softwareId,
        dimId: dimensionId,
        swName: sw.name,
        dimName: dim.name,
        text: sw.descriptions?.[dimensionId] || ''
      });
    }
  }, [softwares, dimensions]);

  const handleSaveDescription = () => {
    if (!editingDesc) return;
    
    setSoftwares(prev => prev.map(sw => {
      if (sw.id === editingDesc.swId) {
        return {
          ...sw,
          descriptions: {
            ...(sw.descriptions || {}),
            [editingDesc.dimId]: editingDesc.text
          }
        };
      }
      return sw;
    }));
    setEditingDesc(null);
  };

  const handleAddSoftware = () => {
    if (!newSoftwareName.trim()) return;
    const newSw: Software = {
      id: generateId(),
      name: newSoftwareName,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      scores: dimensions.reduce((acc, dim) => ({ ...acc, [dim.id]: 5 }), {}),
      descriptions: {}
    };
    setSoftwares([...softwares, newSw]);
    setNewSoftwareName('');
    setShowAddSoftware(false);
  };

  const handleAddDimension = () => {
    if (!newDimensionName.trim()) return;
    const newId = newDimensionName.toLowerCase().replace(/\s+/g, '_') + '_' + generateId();
    const newDim: Dimension = { id: newId, name: newDimensionName };
    
    // Update existing software to include this new dimension initialized at 0 or 5
    setSoftwares(prev => prev.map(sw => ({
      ...sw,
      scores: { ...sw.scores, [newId]: 5 },
      descriptions: { ...(sw.descriptions || {}) }
    })));
    
    setDimensions([...dimensions, newDim]);
    setNewDimensionName('');
    setShowAddDimension(false);
  };

  const handleDeleteSoftware = (id: string) => {
    setSoftwares(prev => prev.filter(s => s.id !== id));
  };

  const handleDeleteDimension = (id: string) => {
    setDimensions(prev => prev.filter(d => d.id !== id));
  };

  // --- Drag and Drop Handlers ---
  const handleReorderSoftwares = (oldIndex: number, newIndex: number) => {
    setSoftwares((items) => arrayMove(items, oldIndex, newIndex));
  };

  const handleReorderDimensions = (oldIndex: number, newIndex: number) => {
    setDimensions((items) => arrayMove(items, oldIndex, newIndex));
  };

  // --- Import / Export Handlers ---
  const handleExportCSV = () => {
    // 1. Header Row: Dimension, Type, [Software Names...]
    const headers = ['Dimension', 'Type', ...softwares.map(s => escapeCSV(s.name))];
    const csvRows = [headers.join(',')];

    // 2. Data Rows
    dimensions.forEach(dim => {
      // Score Row
      const scoreRow = [
        escapeCSV(dim.name),
        'Score',
        ...softwares.map(s => s.scores[dim.id] || 0)
      ];
      csvRows.push(scoreRow.join(','));

      // Description Row
      const descRow = [
        escapeCSV(dim.name),
        'Description',
        ...softwares.map(s => escapeCSV(s.descriptions[dim.id] || ''))
      ];
      csvRows.push(descRow.join(','));
    });

    // 3. Download
    const csvString = '\uFEFF' + csvRows.join('\n'); // Add BOM for Excel UTF-8
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `av_comparison_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      try {
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) throw new Error('Invalid CSV format');

        // Parse Header
        const headers = parseCSVLine(lines[0]); 
        // Expected: Dimension, Type, Software1, Software2...
        
        if (headers.length < 3) throw new Error('CSV must have at least Dimension, Type and one Software column');

        const softwareNames = headers.slice(2);
        const softwareIdMap: Record<number, string> = {}; // Index -> ID
        
        // Sync Softwares (Update existing or Create new)
        let updatedSoftwares = [...softwares];
        
        softwareNames.forEach((name, index) => {
          const cleanName = name.trim();
          let existing = updatedSoftwares.find(s => s.name === cleanName);
          if (!existing) {
             existing = {
               id: generateId(),
               name: cleanName,
               color: `hsl(${Math.random() * 360}, 70%, 50%)`,
               scores: {},
               descriptions: {}
             };
             updatedSoftwares.push(existing);
          }
          softwareIdMap[index] = existing.id;
        });

        // Sync Dimensions & Data
        let updatedDimensions = [...dimensions];

        // Process rows
        for(let i = 1; i < lines.length; i++) {
           const row = parseCSVLine(lines[i]);
           if(row.length < 3) continue;
           
           const dimName = row[0].trim();
           const type = row[1].trim().toLowerCase(); // 'score' or 'description'
           const values = row.slice(2);

           let dim = updatedDimensions.find(d => d.name === dimName);
           if (!dim) {
             dim = {
               id: dimName.toLowerCase().replace(/\s+/g, '_') + '_' + generateId(),
               name: dimName
             };
             updatedDimensions.push(dim);
           }

           // Update values for each software in this row
           values.forEach((val, index) => {
             const swId = softwareIdMap[index];
             if (swId) {
               const swIndex = updatedSoftwares.findIndex(s => s.id === swId);
               if (swIndex !== -1) {
                  if (type === 'score') {
                    updatedSoftwares[swIndex] = {
                      ...updatedSoftwares[swIndex],
                      scores: {
                        ...updatedSoftwares[swIndex].scores,
                        [dim.id]: Number(val) || 0
                      }
                    };
                  } else if (type === 'description') {
                     updatedSoftwares[swIndex] = {
                      ...updatedSoftwares[swIndex],
                      descriptions: {
                        ...updatedSoftwares[swIndex].descriptions,
                        [dim.id]: val
                      }
                    };
                  }
               }
             }
           });
        }

        setSoftwares(updatedSoftwares);
        setDimensions(updatedDimensions);
        alert('导入成功！');

      } catch (err) {
        console.error(err);
        alert('导入失败，请检查文件格式是否正确。');
      }
      
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-gray-100">
      
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".csv" 
        className="hidden" 
      />

      {/* Top Header Bar - Replaces Sidebar */}
      <header className="flex flex-col md:flex-row items-center justify-between px-6 py-4 bg-gray-800 border-b border-gray-700 sticky top-0 z-40 shadow-md">
        <div className="flex items-center space-x-3 mb-4 md:mb-0">
          <ShieldCheck className="text-blue-500 shrink-0" size={32} />
          <h1 className="text-xl font-bold tracking-tight text-white">杀软能力对比</h1>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap justify-center">
            {/* Export/Import Group */}
            <div className="flex items-center gap-2 mr-2">
              <button 
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-all text-sm font-medium border border-gray-600"
                title="导出为CSV"
              >
                <Download size={16} />
                <span className="hidden sm:inline">导出</span>
              </button>
              <button 
                onClick={handleImportClick}
                className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-all text-sm font-medium border border-gray-600"
                title="导入CSV"
              >
                <Upload size={16} />
                <span className="hidden sm:inline">导入</span>
              </button>
            </div>

            <div className="w-px h-6 bg-gray-600 mx-1 hidden md:block"></div>

           <button 
              onClick={() => setShowAddSoftware(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-all text-sm font-medium border border-gray-600 hover:border-gray-500"
            >
              <Plus size={16} />
              <span>添加软件</span>
            </button>
            <button 
              onClick={() => setShowAddDimension(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all text-sm font-medium shadow-lg shadow-blue-900/20"
            >
              <Plus size={16} />
              <span>添加对比维度</span>
            </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
           <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-sm">
             <div className="flex items-center space-x-3 text-gray-400 mb-2">
               <Settings2 size={20} />
               <span className="text-sm font-medium">监测维度</span>
             </div>
             <p className="text-3xl font-bold text-white">{dimensions.length}</p>
           </div>
           <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-sm">
             <div className="flex items-center space-x-3 text-gray-400 mb-2">
               <ShieldCheck size={20} />
               <span className="text-sm font-medium">参与对比软件</span>
             </div>
             <p className="text-3xl font-bold text-white">{softwares.length}</p>
           </div>
           <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-sm">
             <div className="flex items-center space-x-3 text-gray-400 mb-2">
               <BarChart2 size={20} />
               <span className="text-sm font-medium">综合最佳</span>
             </div>
             <p className="text-xl font-bold text-white truncate">
                {softwares.length > 0 ? softwares.reduce((prev, current) => {
                  const prevTotal = Object.values(prev.scores).reduce((a: number, b: number) => a + b, 0);
                  const currTotal = Object.values(current.scores).reduce((a: number, b: number) => a + b, 0);
                  return prevTotal > currTotal ? prev : current;
                }).name : "暂无"}
             </p>
           </div>
        </div>

        {/* Visualization & Table */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          <div className="flex flex-col space-y-4">
             <h2 className="text-xl font-semibold text-white">可视化对比</h2>
             <RadarChartVis softwares={softwares} dimensions={dimensions} />
          </div>
          
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-center">
               <h2 className="text-xl font-semibold text-white">详细评分与描述</h2>
               <span className="text-sm text-gray-400">拖拽软件名或维度名可调整排序</span>
            </div>
            <ComparisonTable 
              dimensions={dimensions} 
              softwares={softwares}
              onUpdateScore={handleScoreUpdate}
              onEditDescription={handleOpenDescriptionModal}
              onDeleteDimension={handleDeleteDimension}
              onDeleteSoftware={handleDeleteSoftware}
              onReorderSoftwares={handleReorderSoftwares}
              onReorderDimensions={handleReorderDimensions}
            />
          </div>
        </div>

      </main>

      {/* --- Modals --- */}

      {/* Add Software Modal */}
      {showAddSoftware && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md border border-gray-700 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">添加新软件</h3>
              <button onClick={() => setShowAddSoftware(false)} className="text-gray-400 hover:text-white"><X size={20}/></button>
            </div>
            <input
              autoFocus
              className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-white mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="例如：火绒安全"
              value={newSoftwareName}
              onChange={(e) => setNewSoftwareName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSoftware()}
            />
            <div className="flex justify-end space-x-2">
              <button onClick={() => setShowAddSoftware(false)} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">取消</button>
              <button onClick={handleAddSoftware} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium transition-colors">添加</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Dimension Modal */}
      {showAddDimension && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md border border-gray-700 shadow-2xl">
             <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">添加对比维度</h3>
              <button onClick={() => setShowAddDimension(false)} className="text-gray-400 hover:text-white"><X size={20}/></button>
            </div>
            <input
              autoFocus
              className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-white mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="例如：云查杀能力"
              value={newDimensionName}
              onChange={(e) => setNewDimensionName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddDimension()}
            />
            <div className="flex justify-end space-x-2">
              <button onClick={() => setShowAddDimension(false)} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">取消</button>
              <button onClick={handleAddDimension} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded font-medium transition-colors">添加</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Description Modal */}
      {editingDesc && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-lg border border-gray-700 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-700 flex justify-between items-center bg-gray-900/50 rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="bg-blue-900/30 p-2 rounded-lg text-blue-400">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">编辑描述</h3>
                  <p className="text-sm text-gray-400">{editingDesc.swName} - {editingDesc.dimName}</p>
                </div>
              </div>
              <button onClick={() => setEditingDesc(null)} className="text-gray-500 hover:text-white transition-colors"><X size={24}/></button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
              <textarea
                autoFocus
                className="w-full h-48 bg-gray-900 border border-gray-600 rounded-lg p-4 text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none leading-relaxed"
                placeholder="请输入详细的描述内容，例如：该软件在内存占用方面表现优秀，但在高负载扫描时会有卡顿..."
                value={editingDesc.text}
                onChange={(e) => setEditingDesc({ ...editingDesc, text: e.target.value })}
              />
              <div className="mt-2 text-right text-xs text-gray-500">
                支持换行，鼠标悬停时将显示全部内容
              </div>
            </div>

            <div className="p-5 border-t border-gray-700 flex justify-end space-x-3 bg-gray-900/50 rounded-b-xl">
              <button 
                onClick={() => setEditingDesc(null)} 
                className="px-5 py-2.5 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors font-medium"
              >
                取消
              </button>
              <button 
                onClick={handleSaveDescription} 
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium shadow-lg shadow-blue-900/20 flex items-center gap-2 transition-all active:scale-95"
              >
                <Save size={18} />
                保存描述
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;