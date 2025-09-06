import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, Book, Plus, CheckCircle, AlertTriangle, Target, Trash2, Download, Upload, Save, FolderOpen, Star, TrendingUp, Award, Moon, Sun, Search, X, BarChart3, Bell, Eye, EyeOff, ArrowUp, ArrowDown, RotateCcw } from 'lucide-react';

const StudentTaskManager = () => {
  const STORAGE_KEY = 'studyplanner-data';
  const HISTORY_KEY = 'studyplanner-history';
  const SETTINGS_KEY = 'studyplanner-settings';

  const [tasks, setTasks] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [showSaveLoadPanel, setShowSaveLoadPanel] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [sortBy, setSortBy] = useState('dueDate');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showCompletedTasks, setShowCompletedTasks] = useState(true);
  const [notification, setNotification] = useState(null);
  const [dataHistory, setDataHistory] = useState([]);
  const fileInputRef = useRef(null);

  const [newTask, setNewTask] = useState({
    title: '',
    subject: '',
    type: 'assignment',
    dueDate: '',
    estimatedHours: 1,
    description: '',
    priority: 'medium'
  });

  const loadDataFromStorage = () => {
    try {
      const savedTasks = localStorage.getItem(STORAGE_KEY);
      if (savedTasks) {
        const parsedTasks = JSON.parse(savedTasks);
        setTasks(parsedTasks);
      }

      const savedHistory = localStorage.getItem(HISTORY_KEY);
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        setDataHistory(parsedHistory);
      }

      const savedSettings = localStorage.getItem(SETTINGS_KEY);
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setIsDarkMode(settings.isDarkMode || false);
        setViewMode(settings.viewMode || 'list');
        setSortBy(settings.sortBy || 'dueDate');
        setSortOrder(settings.sortOrder || 'asc');
        setShowCompletedTasks(settings.showCompletedTasks ?? true);
        setFilterPriority(settings.filterPriority || 'all');
      }
    } catch (error) {
      console.error('データの読み込みに失敗しました:', error);
    }
  };

  const saveDataToStorage = React.useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error('データの保存に失敗しました:', error);
      showNotification('データの保存に失敗しました', 'error');
    }
  }, [tasks]);

  const saveSettingsToStorage = React.useCallback(() => {
    try {
      const settings = {
        isDarkMode,
        viewMode,
        sortBy,
        sortOrder,
        showCompletedTasks,
        filterPriority
      };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('設定の保存に失敗しました:', error);
    }
  }, [isDarkMode, viewMode, sortBy, sortOrder, showCompletedTasks, filterPriority]);

  const saveHistoryToStorage = React.useCallback(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(dataHistory));
    } catch (error) {
      console.error('履歴の保存に失敗しました:', error);
    }
  }, [dataHistory]);

  useEffect(() => {
    loadDataFromStorage();
  }, []);

  useEffect(() => {
    if (tasks.length > 0) {
      saveDataToStorage();
    }
  }, [saveDataToStorage, tasks]);

  useEffect(() => {
    saveSettingsToStorage();
  }, [isDarkMode, viewMode, sortBy, sortOrder, showCompletedTasks, filterPriority, saveSettingsToStorage]);

  useEffect(() => {
    if (dataHistory.length > 0) {
      saveHistoryToStorage();
    }
  }, [dataHistory, saveHistoryToStorage]);

  const showNotification = (message, type = 'info', duration = 3000) => {
    setNotification({ message, type, id: Date.now() });
    setTimeout(() => setNotification(null), duration);
  };

  const getTaskPriority = (dueDate) => {
    const due = new Date(dueDate);
    const now = new Date();
    const daysUntilDue = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue < 0) return 'overdue';
    if (daysUntilDue === 0) return 'today';
    if (daysUntilDue <= 2) return 'urgent';
    if (daysUntilDue <= 7) return 'warning';
    return 'normal';
  };

  const generateStudyPlan = (dueDate, totalHours) => {
    const due = new Date(dueDate);
    const now = new Date();
    const daysUntilDue = Math.max(1, Math.ceil((due - now) / (1000 * 60 * 60 * 24)));
    
    const plan = [];
    const optimalDailyHours = Math.min(3, Math.max(0.5, totalHours / daysUntilDue));
    let remainingHours = totalHours;
    
    for (let i = 0; i < daysUntilDue && remainingHours > 0; i++) {
      const studyDate = new Date(now);
      studyDate.setDate(now.getDate() + i);
      
      const isWeekend = studyDate.getDay() === 0 || studyDate.getDay() === 6;
      const dailyHours = Math.min(
        remainingHours,
        isWeekend ? optimalDailyHours * 1.5 : optimalDailyHours
      );
      
      plan.push({
        date: studyDate.toISOString().split('T')[0],
        hours: Math.round(dailyHours * 4) / 4, 
        completed: false,
        isWeekend
      });
      
      remainingHours -= dailyHours;
    }
    
    return plan;
  };

  const saveDataToHistory = () => {
    const snapshot = {
      tasks: JSON.parse(JSON.stringify(tasks)),
      timestamp: new Date().toISOString(),
      version: dataHistory.length + 1
    };
    setDataHistory(prev => [...prev.slice(-9), snapshot]); // 最新10個まで保持
  };

  const restoreFromHistory = (snapshot) => {
    setTasks(snapshot.tasks);
    showNotification('データを復元しました', 'success');
  };

  const addTask = () => {
    if (newTask.title.trim() && newTask.dueDate) {
      const task = {
        ...newTask,
        id: Date.now(),
        title: newTask.title.trim(),
        completed: false,
        createdAt: new Date().toISOString(),
        studyPlan: generateStudyPlan(newTask.dueDate, newTask.estimatedHours),
        completedAt: null,
        studyTime: 0,
        progress: 0
      };
      
      setTasks(prev => [...prev, task]);
      setNewTask({
        title: '',
        subject: '',
        type: 'assignment',
        dueDate: '',
        estimatedHours: 1,
        description: '',
        priority: 'medium'
      });
      setShowAddForm(false);
      saveDataToHistory();
      showNotification('タスクを追加しました', 'success');
    } else {
      showNotification('タスク名と締切日は必須です', 'error');
    }
  };

  const toggleTask = (id) => {
    setTasks(prev => prev.map(task => {
      if (task.id === id) {
        const isCompleting = !task.completed;
        return {
          ...task,
          completed: isCompleting,
          completedAt: isCompleting ? new Date().toISOString() : null,
          progress: isCompleting ? 100 : 0
        };
      }
      return task;
    }));
    saveDataToHistory();
  };

  const deleteTask = (id) => {
    setTasks(prev => prev.filter(task => task.id !== id));
    setSelectedTask(null);
    saveDataToHistory();
    showNotification('タスクを削除しました', 'success');
  };

  const updateTaskProgress = (id, progress) => {
    setTasks(prev => prev.map(task => {
      if (task.id === id) {
        return {
          ...task,
          progress: Math.max(0, Math.min(100, progress)),
          completed: progress >= 100,
          completedAt: progress >= 100 ? new Date().toISOString() : null
        };
      }
      return task;
    }));
  };

  const clearAllData = () => {
    if (window.confirm('すべてのデータを削除しますか？この操作は取り消せません。')) {
      try {
        setTasks([]);
        setDataHistory([]);
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(HISTORY_KEY);
        showNotification('すべてのデータを削除しました', 'success');
      } catch (error) {
        showNotification('データの削除に失敗しました', 'error');
      }
    }
  };

  const filteredAndSortedTasks = tasks
    .filter(task => {
      if (!showCompletedTasks && task.completed) return false;
      
      const matchesSearch = [task.title, task.subject, task.description]
        .some(field => field.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const priority = getTaskPriority(task.dueDate);
      const matchesFilter = filterPriority === 'all' || 
                            priority === filterPriority ||
                            (filterPriority === 'completed' && task.completed) ||
                            (filterPriority === 'pending' && !task.completed);
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      let comparison = 0;
    
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      
      switch (sortBy) {
        case 'dueDate':
          comparison = new Date(a.dueDate) - new Date(b.dueDate);
          break;
        case 'priority':
          const priorities = { overdue: 0, today: 1, urgent: 2, warning: 3, normal: 4 };
          comparison = priorities[getTaskPriority(a.dueDate)] - priorities[getTaskPriority(b.dueDate)];
          break;
        case 'created':
          comparison = new Date(a.createdAt) - new Date(b.createdAt);
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'subject':
          comparison = a.subject.localeCompare(b.subject);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const exportData = () => {
    try {
      const dataToExport = {
        tasks: tasks,
        settings: { isDarkMode, viewMode, sortBy, sortOrder, showCompletedTasks, filterPriority },
        exportDate: new Date().toISOString(),
        version: '2.1'
      };
      
      const dataStr = JSON.stringify(dataToExport, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `studyplanner-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showNotification('データをエクスポートしました', 'success');
    } catch (error) {
      showNotification('エクスポートに失敗しました', 'error');
    }
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        
        if (importedData.tasks && Array.isArray(importedData.tasks)) {
          setTasks(importedData.tasks);
          if (importedData.settings) {
            setIsDarkMode(importedData.settings.isDarkMode || false);
            setViewMode(importedData.settings.viewMode || 'list');
            setSortBy(importedData.settings.sortBy || 'dueDate');
            setSortOrder(importedData.settings.sortOrder || 'asc');
            setShowCompletedTasks(importedData.settings.showCompletedTasks ?? true);
            setFilterPriority(importedData.settings.filterPriority || 'all');
          }
          saveDataToHistory();
          showNotification(`${importedData.tasks.length}個のタスクをインポートしました`, 'success');
        } else {
          showNotification('無効なファイル形式です', 'error');
        }
      } catch (error) {
        showNotification('ファイルの読み込みに失敗しました', 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    urgent: tasks.filter(t => ['overdue', 'today', 'urgent'].includes(getTaskPriority(t.dueDate)) && !t.completed).length,
    overdue: tasks.filter(t => getTaskPriority(t.dueDate) === 'overdue' && !t.completed).length,
    totalStudyHours: tasks.reduce((sum, task) => sum + task.estimatedHours, 0),
    completedStudyHours: tasks.filter(t => t.completed).reduce((sum, task) => sum + task.estimatedHours, 0),
    completionRate: tasks.length > 0 ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0,
    avgProgress: tasks.length > 0 ? Math.round(tasks.reduce((sum, task) => sum + (task.progress || 0), 0) / tasks.length) : 0
  };

  const themeClasses = {
    bg: isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50',
    cardBg: isDarkMode ? 'bg-gray-800' : 'bg-white',
    text: isDarkMode ? 'text-white' : 'text-gray-800',
    textSecondary: isDarkMode ? 'text-gray-300' : 'text-gray-600',
    border: isDarkMode ? 'border-gray-700' : 'border-gray-200',
    hover: isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
  };

  const priorityColors = {
    overdue: 'bg-red-500 text-white',
    today: 'bg-orange-500 text-white',
    urgent: 'bg-yellow-500 text-black',
    warning: 'bg-blue-500 text-white',
    normal: 'bg-green-500 text-white'
  };

  const NotificationBar = () => {
    if (!notification) return null;

    const bgColor = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      warning: 'bg-yellow-500',
      info: 'bg-blue-500'
    }[notification.type] || 'bg-blue-500';

    return (
      <div className={`fixed top-4 right-4 z-50 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 animate-pulse`}>
        <div className="flex items-center gap-2">
          <Bell size={16} />
          <span>{notification.message}</span>
          <button 
            onClick={() => setNotification(null)}
            className="ml-2 hover:bg-white hover:bg-opacity-20 rounded-full p-1"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  };

  const EnhancedTaskCard = ({ task }) => {
    const priority = getTaskPriority(task.dueDate);
    const dueDate = new Date(task.dueDate);    
    return (
      <div
        className={`${themeClasses.cardBg} rounded-xl shadow-lg border-l-4 p-6 transition-all duration-300 hover:shadow-xl hover:transform hover:scale-[1.02] cursor-pointer group relative ${
          task.completed ? 'opacity-70' : ''
        } ${
          priority === 'overdue' ? 'border-red-500' :
          priority === 'today' ? 'border-orange-500' :
          priority === 'urgent' ? 'border-yellow-500' :
          priority === 'warning' ? 'border-blue-500' : 'border-green-500'
        }`}
        onClick={() => setSelectedTask(task)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleTask(task.id);
              }}
              className={`mt-1 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-200 transform hover:scale-110 ${
                task.completed 
                  ? 'bg-green-500 border-green-500 text-white shadow-lg' 
                  : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
              }`}
            >
              {task.completed && <CheckCircle size={16} />}
            </button>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h3 className={`text-xl font-bold transition-all duration-200 ${
                  task.completed ? `line-through ${themeClasses.textSecondary}` : themeClasses.text
                }`}>
                  {task.title}
                </h3>
                
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${priorityColors[priority]}`}>
                  {priority === 'overdue' ? '期限切れ' :
                  priority === 'today' ? '今日まで' :
                  priority === 'urgent' ? '緊急' :
                  priority === 'warning' ? '要注意' : '通常'}
                </span>
                
                {task.completed && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center gap-1">
                    <Star size={12} />
                    完了
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap gap-4 text-sm mb-4">
                <span className={`flex items-center gap-2 ${themeClasses.textSecondary}`}>
                  <Book size={16} />
                  {task.subject || '科目なし'}
                </span>
                <span className={`flex items-center gap-2 ${themeClasses.textSecondary}`}>
                  <Calendar size={16} />
                  {dueDate.toLocaleDateString('ja-JP')}
                </span>
                <span className={`flex items-center gap-2 ${themeClasses.textSecondary}`}>
                  <Clock size={16} />
                  {task.estimatedHours}時間
                </span>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className={themeClasses.textSecondary}>進捗</span>
                  <span className={themeClasses.textSecondary}>{task.progress || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${task.progress || 0}%` }}
                  />
                </div>
              </div>

              {task.description && (
                <p className={`${themeClasses.textSecondary} mb-4 line-clamp-2`}>
                  {task.description}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={(e) => {
                e.stopPropagation();
                const newProgress = prompt('進捗を入力してください (0-100):', task.progress || 0);
                if (newProgress !== null) {
                  updateTaskProgress(task.id, parseInt(newProgress));
                }
              }}
              className="text-blue-500 hover:text-blue-700 transition-colors duration-200 p-2 hover:bg-blue-50 rounded-lg"
              title="進捗を更新"
            >
              <BarChart3 size={18} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('このタスクを削除しますか？')) {
                  deleteTask(task.id);
                }
              }}
              className="text-red-500 hover:text-red-700 transition-colors duration-200 p-2 hover:bg-red-50 rounded-lg"
              title="削除"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const Header = () => (
    <div className="text-center mb-8">
      <h1 className={`text-4xl md:text-5xl font-bold ${themeClasses.text} mb-3 flex items-center justify-center gap-4`}>
        <div className="relative">
          <Book className="text-indigo-600" size={48} />
        </div>
        StudyPlanner Pro
      </h1>
      <p className={`${themeClasses.textSecondary} text-lg font-medium`}>
        効率的な学習で目標を達成しよう
      </p>
    </div>
  );

  const Toolbar = () => (
    <div className={`${themeClasses.cardBg} rounded-xl shadow-lg p-4 mb-6 ${themeClasses.border} border`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
          >
            <Plus size={18} />
            新規タスク
          </button>
          
          <button
            onClick={() => setShowStats(!showStats)}
            className={`flex items-center gap-2 ${themeClasses.cardBg} ${themeClasses.text} ${themeClasses.border} border font-semibold py-2 px-4 rounded-lg transition-all duration-200 ${themeClasses.hover}`}
          >
            <BarChart3 size={18} />
            統計
          </button>

          <button
            onClick={() => setShowCompletedTasks(!showCompletedTasks)}
            className={`flex items-center gap-2 ${themeClasses.cardBg} ${themeClasses.text} ${themeClasses.border} border font-semibold py-2 px-4 rounded-lg transition-all duration-200 ${themeClasses.hover}`}
          >
            {showCompletedTasks ? <EyeOff size={18} /> : <Eye size={18} />}
            完了済み{showCompletedTasks ? '非表示' : '表示'}
          </button>

          <button
            onClick={() => setShowSaveLoadPanel(!showSaveLoadPanel)}
            className={`flex items-center gap-2 ${themeClasses.cardBg} ${themeClasses.text} ${themeClasses.border} border font-semibold py-2 px-4 rounded-lg transition-all duration-200 ${themeClasses.hover}`}
          >
            <Save size={18} />
            データ管理
          </button>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={`px-3 py-2 ${themeClasses.cardBg} ${themeClasses.text} border ${themeClasses.border} rounded-lg text-sm`}
          >
            <option value="dueDate">締切日順</option>
            <option value="priority">優先度順</option>
            <option value="created">作成日順</option>
            <option value="title">タイトル順</option>
            <option value="subject">科目順</option>
          </select>
          
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className={`p-2 ${themeClasses.cardBg} ${themeClasses.text} ${themeClasses.border} border rounded-lg ${themeClasses.hover} transition-all duration-200`}
            title={sortOrder === 'asc' ? '降順にする' : '昇順にする'}
          >
            {sortOrder === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
          </button>

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 ${themeClasses.cardBg} ${themeClasses.text} ${themeClasses.border} border rounded-lg ${themeClasses.hover} transition-all duration-200`}
            title={isDarkMode ? 'ライトモードに変更' : 'ダークモードに変更'}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mt-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="タスクを検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-10 py-2 ${themeClasses.cardBg} ${themeClasses.text} border ${themeClasses.border} rounded-lg transition-all duration-200`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
        
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className={`px-4 py-2 ${themeClasses.cardBg} ${themeClasses.text} border ${themeClasses.border} rounded-lg`}
        >
          <option value="all">すべて</option>
          <option value="overdue">期限切れ</option>
          <option value="today">今日まで</option>
          <option value="urgent">緊急</option>
          <option value="warning">要注意</option>
          <option value="normal">通常</option>
          <option value="completed">完了済み</option>
          <option value="pending">未完了</option>
        </select>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-500 ${themeClasses.bg}`}>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <NotificationBar />
        <Header />

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className={`${themeClasses.cardBg} rounded-xl shadow-lg p-6 ${themeClasses.border} border`}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Target className="text-white" size={24} />
              </div>
              <div>
                <h3 className={`font-bold ${themeClasses.text}`}>総タスク</h3>
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className={`${themeClasses.cardBg} rounded-xl shadow-lg p-6 ${themeClasses.border} border`}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <CheckCircle className="text-white" size={24} />
              </div>
              <div>
                <h3 className={`font-bold ${themeClasses.text}`}>完了率</h3>
                <p className="text-2xl font-bold text-green-600">{stats.completionRate}%</p>
              </div>
            </div>
          </div>
          
          <div className={`${themeClasses.cardBg} rounded-xl shadow-lg p-6 ${themeClasses.border} border`}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <AlertTriangle className="text-white" size={24} />
              </div>
              <div>
                <h3 className={`font-bold ${themeClasses.text}`}>緊急</h3>
                <p className="text-2xl font-bold text-orange-600">{stats.urgent}</p>
              </div>
            </div>
          </div>

          <div className={`${themeClasses.cardBg} rounded-xl shadow-lg p-6 ${themeClasses.border} border`}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="text-white" size={24} />
              </div>
              <div>
                <h3 className={`font-bold ${themeClasses.text}`}>平均進捗</h3>
                <p className="text-2xl font-bold text-purple-600">{stats.avgProgress}%</p>
              </div>
            </div>
          </div>
        </div>

        <Toolbar />

        {/* 統計パネル */}
        {showStats && (
          <div className={`${themeClasses.cardBg} rounded-xl shadow-xl p-6 mb-8 ${themeClasses.border} border`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-bold ${themeClasses.text} flex items-center gap-2`}>
                <BarChart3 size={24} className="text-indigo-600" />
                詳細統計
              </h3>
              <button
                onClick={() => setShowStats(false)}
                className={`p-2 ${themeClasses.hover} rounded-lg transition-colors duration-200`}
              >
                <X size={20} className={themeClasses.textSecondary} />
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white">
                <div className="text-3xl font-bold">{stats.completedStudyHours}h</div>
                <div className="text-sm opacity-90">完了学習時間</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl text-white">
                <div className="text-3xl font-bold">{stats.totalStudyHours}h</div>
                <div className="text-sm opacity-90">総学習時間</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-red-500 to-red-600 rounded-xl text-white">
                <div className="text-3xl font-bold">{stats.overdue}</div>
                <div className="text-sm opacity-90">期限切れ</div>
              </div>
            </div>
            
            <div className="mb-6">
              <h4 className={`font-medium ${themeClasses.text} mb-3`}>学習進捗の分布</h4>
              <div className="space-y-2">
                {['0-25%', '26-50%', '51-75%', '76-99%', '100%'].map((range, index) => {
                  const min = index * 25;
                  const max = index === 4 ? 100 : (index + 1) * 25 - 1;
                  const count = tasks.filter(t => {
                    const progress = t.progress || 0;
                    return index === 4 ? progress === 100 : progress >= min && progress <= max;
                  }).length;
                  const percentage = tasks.length > 0 ? (count / tasks.length) * 100 : 0;
                  
                  return (
                    <div key={range} className="flex items-center gap-3">
                      <div className={`w-16 text-sm ${themeClasses.textSecondary}`}>{range}</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className={`w-12 text-sm ${themeClasses.textSecondary}`}>{count}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {stats.completed > 0 && (
              <div className="p-4 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <Award size={20} />
                  <span className="font-medium">
                    素晴らしい！{stats.completed}個のタスクを完了しました！
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* データ管理パネル */}
        {showSaveLoadPanel && (
          <div className={`${themeClasses.cardBg} rounded-xl shadow-xl p-6 mb-8 ${themeClasses.border} border`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-bold ${themeClasses.text} flex items-center gap-2`}>
                <FolderOpen size={24} className="text-green-600" />
                データ管理
              </h3>
              <button
                onClick={() => setShowSaveLoadPanel(false)}
                className={`p-2 ${themeClasses.hover} rounded-lg transition-colors duration-200`}
              >
                <X size={20} className={themeClasses.textSecondary} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className={`text-lg font-medium mb-4 ${themeClasses.text} flex items-center gap-2`}>
                  <Download size={20} />
                  エクスポート・インポート
                </h4>
                <div className="space-y-3">
                  <button
                    onClick={exportData}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200"
                  >
                    <Download size={18} />
                    データをエクスポート
                  </button>
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200"
                  >
                    <Upload size={18} />
                    データをインポート
                  </button>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={importData}
                    accept=".json"
                    className="hidden"
                  />
                  
                  <button
                    onClick={clearAllData}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200"
                  >
                    <Trash2 size={18} />
                    すべてのデータを削除
                  </button>
                </div>
              </div>
              
              <div>
                <h4 className={`text-lg font-medium mb-4 ${themeClasses.text} flex items-center gap-2`}>
                  <RotateCcw size={20} />
                  データ履歴（自動保存）
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {dataHistory.length === 0 ? (
                    <p className={`${themeClasses.textSecondary} text-sm`}>履歴がありません</p>
                  ) : (
                    dataHistory.slice().reverse().map((snapshot, index) => (
                      <button
                        key={snapshot.timestamp}
                        onClick={() => restoreFromHistory(snapshot)}
                        className={`w-full text-left p-3 ${themeClasses.border} border rounded-lg ${themeClasses.hover} transition-all duration-200`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">
                            v{snapshot.version} - {snapshot.tasks.length}個のタスク
                          </span>
                          <span className={`text-xs ${themeClasses.textSecondary}`}>
                            {new Date(snapshot.timestamp).toLocaleString('ja-JP')}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900 dark:to-green-900 rounded-lg border border-blue-200 dark:border-blue-700">
              <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                <Star size={16} />
                データ保存について
              </h5>
              <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <p>• <strong>自動保存:</strong> データは自動的にブラウザに永続保存されます</p>
                <p>• <strong>履歴機能:</strong> 過去10バージョンのデータを自動保存</p>
                <p>• <strong>永続保存:</strong> ページを再読み込みしてもデータが残ります</p>
                <p>• <strong>バックアップ:</strong> エクスポート機能で追加のバックアップが可能</p>
                <p>• <strong>プライバシー:</strong> データはあなたのブラウザにのみ保存されます</p>
              </div>
            </div>
          </div>
        )}

        {/* タスク追加フォーム */}
        {showAddForm && (
          <div className={`${themeClasses.cardBg} rounded-xl shadow-xl p-6 mb-8 ${themeClasses.border} border`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-bold ${themeClasses.text} flex items-center gap-2`}>
                <Plus size={24} className="text-indigo-600" />
                新しいタスク
              </h3>
              <button
                onClick={() => setShowAddForm(false)}
                className={`p-2 ${themeClasses.hover} rounded-lg transition-colors duration-200`}
              >
                <X size={20} className={themeClasses.textSecondary} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                  タスク名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  className={`w-full p-3 ${themeClasses.cardBg} ${themeClasses.text} border ${themeClasses.border} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                  placeholder="例: 数学の中間テスト対策"
                  required
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>科目</label>
                <input
                  type="text"
                  value={newTask.subject}
                  onChange={(e) => setNewTask({...newTask, subject: e.target.value})}
                  className={`w-full p-3 ${themeClasses.cardBg} ${themeClasses.text} border ${themeClasses.border} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                  placeholder="例: 数学"
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>タイプ</label>
                <select
                  value={newTask.type}
                  onChange={(e) => setNewTask({...newTask, type: e.target.value})}
                  className={`w-full p-3 ${themeClasses.cardBg} ${themeClasses.text} border ${themeClasses.border} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                >
                  <option value="assignment">課題</option>
                  <option value="exam">試験</option>
                  <option value="project">プロジェクト</option>
                  <option value="review">復習</option>
                </select>
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                  締切日 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                  className={`w-full p-3 ${themeClasses.cardBg} ${themeClasses.text} border ${themeClasses.border} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                  required
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>予想学習時間</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0.5"
                    max="20"
                    step="0.5"
                    value={newTask.estimatedHours}
                    onChange={(e) => setNewTask({...newTask, estimatedHours: parseFloat(e.target.value)})}
                    className="flex-1"
                  />
                  <span className={`${themeClasses.text} font-medium min-w-16`}>
                    {newTask.estimatedHours}時間
                  </span>
                </div>
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>優先度</label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                  className={`w-full p-3 ${themeClasses.cardBg} ${themeClasses.text} border ${themeClasses.border} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                >
                  <option value="low">低</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                </select>
              </div>
            </div>
            
            <div className="mt-6">
              <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>詳細・メモ</label>
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                className={`w-full p-3 ${themeClasses.cardBg} ${themeClasses.text} border ${themeClasses.border} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                rows="3"
                placeholder="詳細な説明や学習のポイントなど..."
              />
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={addTask}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
              >
                タスクを追加
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className={`${themeClasses.cardBg} ${themeClasses.text} ${themeClasses.border} border font-semibold py-3 px-6 rounded-lg transition-all duration-200 ${themeClasses.hover}`}
              >
                キャンセル
              </button>
            </div>
          </div>
        )}

        {/* メインコンテンツ */}
        <div className="space-y-6">
          {filteredAndSortedTasks.length === 0 ? (
            <div className="text-center py-16">
              <Book className={`mx-auto w-24 h-24 ${themeClasses.textSecondary} mb-6`} />
              <p className={`${themeClasses.textSecondary} text-xl mb-4`}>
                {searchQuery || filterPriority !== 'all' ? 
                  '条件に一致するタスクがありません' : 
                  'まだタスクがありません'
                }
              </p>
              <p className={`${themeClasses.textSecondary} mb-8`}>
                {searchQuery || filterPriority !== 'all' ? 
                  '検索条件やフィルターを変更してみてください' : 
                  '新しいタスクを追加して学習計画を始めましょう'
                }
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredAndSortedTasks.map(task => (
                <EnhancedTaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>

        {/* タスク詳細モーダル */}
        {selectedTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`${themeClasses.cardBg} rounded-xl shadow-2xl max-w-3xl w-full max-h-96 overflow-y-auto`}>
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className={`text-2xl font-bold ${themeClasses.text} mb-2`}>{selectedTask.title}</h2>
                    <div className="flex gap-2">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${priorityColors[getTaskPriority(selectedTask.dueDate)]}`}>
                        {getTaskPriority(selectedTask.dueDate) === 'overdue' ? '期限切れ' :
                        getTaskPriority(selectedTask.dueDate) === 'today' ? '今日まで' :
                        getTaskPriority(selectedTask.dueDate) === 'urgent' ? '緊急' :
                        getTaskPriority(selectedTask.dueDate) === 'warning' ? '要注意' : '通常'}
                      </span>
                      {selectedTask.completed && (
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          完了済み
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedTask(null)}
                    className={`p-2 ${themeClasses.hover} rounded-lg transition-colors duration-200`}
                  >
                    <X size={24} className={themeClasses.textSecondary} />
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className={`font-medium ${themeClasses.text} mb-2`}>基本情報</h3>
                        <div className="space-y-2 text-sm">
                          <div className={`flex justify-between ${themeClasses.textSecondary}`}>
                            <span>科目:</span>
                            <span>{selectedTask.subject || '未設定'}</span>
                          </div>
                          <div className={`flex justify-between ${themeClasses.textSecondary}`}>
                            <span>タイプ:</span>
                            <span>
                              {selectedTask.type === 'assignment' ? '課題' : 
                              selectedTask.type === 'exam' ? '試験' :
                              selectedTask.type === 'project' ? 'プロジェクト' : '復習'}
                            </span>
                          </div>
                          <div className={`flex justify-between ${themeClasses.textSecondary}`}>
                            <span>締切日:</span>
                            <span>{new Date(selectedTask.dueDate).toLocaleDateString('ja-JP')}</span>
                          </div>
                          <div className={`flex justify-between ${themeClasses.textSecondary}`}>
                            <span>予想時間:</span>
                            <span>{selectedTask.estimatedHours}時間</span>
                          </div>
                        </div>
                      </div>
                      
                      {selectedTask.description && (
                        <div>
                          <h3 className={`font-medium ${themeClasses.text} mb-2`}>詳細</h3>
                          <p className={`${themeClasses.textSecondary} bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-sm`}>
                            {selectedTask.description}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h3 className={`font-medium ${themeClasses.text} mb-3`}>進捗状況</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className={themeClasses.textSecondary}>完了率</span>
                            <span className={themeClasses.text}>{selectedTask.progress || 0}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-300"
                              style={{ width: `${selectedTask.progress || 0}%` }}
                            />
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={selectedTask.progress || 0}
                              onChange={(e) => updateTaskProgress(selectedTask.id, parseInt(e.target.value))}
                              className={`flex-1 p-2 ${themeClasses.cardBg} ${themeClasses.text} border ${themeClasses.border} rounded text-sm`}
                            />
                            <span className={`${themeClasses.textSecondary} text-sm flex items-center`}>%</span>
                          </div>
                        </div>
                      </div>
                      
                      {selectedTask.studyPlan && selectedTask.studyPlan.length > 0 && (
                        <div>
                          <h3 className={`font-medium ${themeClasses.text} mb-3`}>学習計画</h3>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {selectedTask.studyPlan.slice(0, 5).map((plan, index) => (
                              <div
                                key={index}
                                className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm"
                              >
                                <span>
                                  {new Date(plan.date).toLocaleDateString('ja-JP', { 
                                    month: 'short', 
                                    day: 'numeric',
                                    weekday: 'short'
                                  })}
                                </span>
                                <span className="font-medium">{plan.hours}時間</span>
                              </div>
                            ))}
                            {selectedTask.studyPlan.length > 5 && (
                              <p className={`${themeClasses.textSecondary} text-xs text-center`}>
                                他 {selectedTask.studyPlan.length - 5} 日...
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        toggleTask(selectedTask.id);
                        setSelectedTask(null);
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                        selectedTask.completed 
                          ? 'bg-gray-500 hover:bg-gray-600 text-white' 
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      }`}
                    >
                      <CheckCircle size={18} />
                      {selectedTask.completed ? '未完了にする' : '完了にする'}
                    </button>
                    
                    <button
                      onClick={() => {
                        if (window.confirm('このタスクを削除しますか？')) {
                          deleteTask(selectedTask.id);
                        }
                      }}
                      className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
                    >
                      <Trash2 size={18} />
                      削除
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentTaskManager;