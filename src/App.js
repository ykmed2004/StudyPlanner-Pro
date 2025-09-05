import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, Book, Plus, CheckCircle, AlertTriangle, Target, Trash2, ChevronLeft, ChevronRight, Grid3X3, List, Download, Upload, Save, FolderOpen, Star, TrendingUp, Award, Zap, Moon, Sun, Settings, Filter, Search, X, Edit3, BarChart3, Users, Heart } from 'lucide-react';

const StudentTaskManager = () => {
  const [tasks, setTasks] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showSaveLoadPanel, setShowSaveLoadPanel] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
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

  // ローカルストレージからデータを読み込み（初期化時）
  useEffect(() => {
    const savedTasks = localStorage.getItem('studyPlannerTasks');
    const savedTheme = localStorage.getItem('studyPlannerTheme');
    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks);
        setTasks(parsedTasks);
      } catch (error) {
        console.error('データの読み込みに失敗しました:', error);
      }
    }
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
    }
  }, []);

  // タスクが変更されたときにローカルストレージに保存
  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem('studyPlannerTasks', JSON.stringify(tasks));
    }
  }, [tasks]);

  // テーマの保存
  useEffect(() => {
    localStorage.setItem('studyPlannerTheme', isDarkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const addTask = () => {
    if (newTask.title && newTask.dueDate) {
      const task = {
        ...newTask,
        id: Date.now(),
        completed: false,
        createdAt: new Date().toISOString(),
        studyPlan: generateStudyPlan(newTask.dueDate, newTask.estimatedHours),
        completedAt: null,
        studyTime: 0
      };
      setTasks([...tasks, task]);
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
    }
  };

  const generateStudyPlan = (dueDate, totalHours) => {
    const due = new Date(dueDate);
    const now = new Date();
    const daysUntilDue = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue <= 0) return [];
    
    const plan = [];
    const dailyHours = Math.max(0.5, totalHours / Math.max(daysUntilDue, 1));
    
    for (let i = 0; i < daysUntilDue; i++) {
      const studyDate = new Date(now);
      studyDate.setDate(now.getDate() + i);
      plan.push({
        date: studyDate.toISOString().split('T')[0],
        hours: Math.min(dailyHours, totalHours - (i * dailyHours)),
        completed: false
      });
    }
    
    return plan;
  };

  // カレンダー関連のヘルパー関数
  const getMonthData = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayWeekday = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const days = [];
    
    // 前月の日付を埋める
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = firstDayWeekday - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonth.getDate() - i),
        isCurrentMonth: false
      });
    }
    
    // 今月の日付
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        date: new Date(year, month, day),
        isCurrentMonth: true
      });
    }
    
    // 次月の日付を埋める
    const remainingDays = 42 - days.length; // 6週間分
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        date: new Date(year, month + 1, day),
        isCurrentMonth: false
      });
    }
    
    return days;
  };

  const getWeekData = (date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  const getTasksForDate = (date) => {
    const dateString = date.toISOString().split('T')[0];
    return tasks.filter(task => task.dueDate === dateString);
  };

  const getTaskCountForDate = (date) => {
    return getTasksForDate(date).length;
  };

  const getUrgentTasksForDate = (date) => {
    return getTasksForDate(date).filter(task => !task.completed && getTaskPriority(task.dueDate) === 'urgent').length;
  };

  // JSONファイルとしてデータをエクスポート
  const exportData = () => {
    try {
      const dataToExport = {
        tasks: tasks,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
      
      const dataStr = JSON.stringify(dataToExport, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `study-planner-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showNotification('データのエクスポートが完了しました！', 'success');
    } catch (error) {
      showNotification('エクスポートに失敗しました: ' + error.message, 'error');
    }
  };

  // JSONファイルからデータをインポート
  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        
        // データの検証
        if (importedData.tasks && Array.isArray(importedData.tasks)) {
          setTasks(importedData.tasks);
          localStorage.setItem('studyPlannerTasks', JSON.stringify(importedData.tasks));
          showNotification(`${importedData.tasks.length}個のタスクをインポートしました！`, 'success');
        } else {
          showNotification('無効なファイル形式です。StudyPlanner Proで作成されたファイルを選択してください。', 'error');
        }
      } catch (error) {
        showNotification('ファイルの読み込みに失敗しました: ' + error.message, 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // 通知システム
  const showNotification = (message, type = 'info') => {
    // 簡易的な通知（実装を簡略化）
    if (type === 'success') {
      alert('✅ ' + message);
    } else if (type === 'error') {
      alert('❌ ' + message);
    } else {
      alert('ℹ️ ' + message);
    }
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(task => {
      if (task.id === id) {
        return {
          ...task,
          completed: !task.completed,
          completedAt: !task.completed ? new Date().toISOString() : null
        };
      }
      return task;
    }));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
    setSelectedTask(null);
  };

  const getTaskPriority = (dueDate) => {
    const due = new Date(dueDate);
    const now = new Date();
    const daysUntilDue = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue < 0) return 'overdue';
    if (daysUntilDue <= 3) return 'urgent';
    if (daysUntilDue <= 7) return 'warning';
    return 'normal';
  };

  // フィルタリングされたタスク
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          task.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          task.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterPriority === 'all' || 
                          getTaskPriority(task.dueDate) === filterPriority ||
                          (filterPriority === 'completed' && task.completed) ||
                          (filterPriority === 'pending' && !task.completed);
    
    return matchesSearch && matchesFilter;
  });

  // 統計情報の計算
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    urgent: tasks.filter(t => getTaskPriority(t.dueDate) === 'urgent' && !t.completed).length,
    overdue: tasks.filter(t => getTaskPriority(t.dueDate) === 'overdue' && !t.completed).length,
    totalStudyHours: tasks.reduce((sum, task) => sum + task.estimatedHours, 0),
    completedStudyHours: tasks.filter(t => t.completed).reduce((sum, task) => sum + task.estimatedHours, 0),
    completionRate: tasks.length > 0 ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0
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
    overdue: isDarkMode ? 'bg-red-900 border-red-600 text-red-300' : 'bg-red-100 border-red-300 text-red-800',
    urgent: isDarkMode ? 'bg-orange-900 border-orange-600 text-orange-300' : 'bg-orange-100 border-orange-300 text-orange-800',
    warning: isDarkMode ? 'bg-yellow-900 border-yellow-600 text-yellow-300' : 'bg-yellow-100 border-yellow-300 text-yellow-800',
    normal: isDarkMode ? 'bg-green-900 border-green-600 text-green-300' : 'bg-green-100 border-green-300 text-green-800'
  };

  const navigateCalendar = (direction) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + direction);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction * 7));
    }
    setCurrentDate(newDate);
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSameDay = (date1, date2) => {
    return date1.toDateString() === date2.toDateString();
  };

  const QuickActions = () => (
    <div className="flex flex-wrap gap-2 mb-6">
      <button
        onClick={() => setShowAddForm(!showAddForm)}
        className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 hover:shadow-xl"
      >
        <Plus size={18} />
        <span className="hidden sm:inline">新規タスク</span>
      </button>
      
      <button
        onClick={() => setShowSaveLoadPanel(!showSaveLoadPanel)}
        className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold py-2 px-4 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 hover:shadow-xl"
      >
        <FolderOpen size={18} />
        <span className="hidden sm:inline">データ管理</span>
      </button>

      <button
        onClick={() => setShowStats(!showStats)}
        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-2 px-4 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 hover:shadow-xl"
      >
        <BarChart3 size={18} />
        <span className="hidden sm:inline">統計</span>
      </button>

      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className={`flex items-center gap-2 ${themeClasses.cardBg} ${themeClasses.text} ${themeClasses.border} border font-semibold py-2 px-4 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 hover:shadow-xl`}
      >
        {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        <span className="hidden sm:inline">{isDarkMode ? 'ライト' : 'ダーク'}</span>
      </button>
    </div>
  );

  const SearchAndFilter = () => (
    <div className={`${themeClasses.cardBg} rounded-xl shadow-lg p-4 mb-6 ${themeClasses.border} border`}>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="タスクを検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 ${themeClasses.cardBg} ${themeClasses.text} border ${themeClasses.border} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200`}
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
          className={`px-4 py-2 ${themeClasses.cardBg} ${themeClasses.text} border ${themeClasses.border} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
        >
          <option value="all">すべて</option>
          <option value="urgent">緊急</option>
          <option value="warning">要注意</option>
          <option value="normal">通常</option>
          <option value="overdue">期限切れ</option>
          <option value="completed">完了済み</option>
          <option value="pending">未完了</option>
        </select>
      </div>
    </div>
  );

  const StatsPanel = () => (
    showStats && (
      <div className={`${themeClasses.cardBg} rounded-xl shadow-xl p-6 mb-8 ${themeClasses.border} border animate-pulse`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-xl font-bold ${themeClasses.text} flex items-center gap-2`}>
            <BarChart3 size={24} className="text-indigo-600" />
            学習統計
          </h3>
          <button
            onClick={() => setShowStats(false)}
            className={`p-2 ${themeClasses.hover} rounded-lg transition-colors duration-200`}
          >
            <X size={20} className={themeClasses.textSecondary} />
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white">
            <div className="text-2xl font-bold">{stats.completionRate}%</div>
            <div className="text-sm opacity-90">完了率</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl text-white">
            <div className="text-2xl font-bold">{stats.completedStudyHours}h</div>
            <div className="text-sm opacity-90">完了学習時間</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl text-white">
            <div className="text-2xl font-bold">{stats.totalStudyHours}h</div>
            <div className="text-sm opacity-90">総学習時間</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl text-white">
            <div className="text-2xl font-bold">{stats.urgent}</div>
            <div className="text-sm opacity-90">緊急タスク</div>
          </div>
        </div>
        
        {stats.completed > 0 && (
          <div className="mt-6 p-4 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <Award size={20} />
              <span className="font-medium">
                おめでとうございます！{stats.completed}個のタスクを完了しました！
              </span>
            </div>
          </div>
        )}
      </div>
    )
  );

  const TaskDetailModal = ({ task, onClose }) => {
    if (!task) return null;
    
    const priority = getTaskPriority(task.dueDate);
    const dueDate = new Date(task.dueDate);
    const now = new Date();
    const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className={`${themeClasses.cardBg} rounded-xl shadow-2xl max-w-2xl w-full max-h-96 overflow-y-auto`}>
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className={`text-2xl font-bold ${themeClasses.text}`}>{task.title}</h2>
              <button
                onClick={onClose}
                className={`p-2 ${themeClasses.hover} rounded-lg transition-colors duration-200`}
              >
                <X size={24} className={themeClasses.textSecondary} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium rounded-full">
                  {task.type === 'assignment' ? '📝 課題' : 
                  task.type === 'exam' ? '📚 試験' :
                  task.type === 'project' ? '🚀 プロジェクト' : '🔄 復習'}
                </span>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${priorityColors[priority]}`}>
                  {priority === 'overdue' ? '期限切れ' :
                   priority === 'urgent' ? '緊急' :
                   priority === 'warning' ? '要注意' : '通常'}
                </span>
                {task.completed && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full flex items-center gap-1">
                    <Star size={14} />
                    完了
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className={`flex items-center gap-2 ${themeClasses.textSecondary}`}>
                  <Book size={16} />
                  <span>科目: {task.subject || '未設定'}</span>
                </div>
                <div className={`flex items-center gap-2 ${themeClasses.textSecondary}`}>
                  <Calendar size={16} />
                  <span>締切: {dueDate.toLocaleDateString('ja-JP')}</span>
                </div>
                <div className={`flex items-center gap-2 ${themeClasses.textSecondary}`}>
                  <Clock size={16} />
                  <span>予想時間: {task.estimatedHours}時間</span>
                </div>
                <div className={`font-bold flex items-center gap-1 ${
                  daysUntilDue < 0 ? 'text-red-600' :
                  daysUntilDue <= 3 ? 'text-orange-600' : 'text-green-600'
                }`}>
                  {daysUntilDue < 0 ? '⚠️' : daysUntilDue <= 3 ? '🔥' : '✅'}
                  {daysUntilDue < 0 ? `${Math.abs(daysUntilDue)}日遅れ` :
                  daysUntilDue === 0 ? '今日が締切！' : `あと${daysUntilDue}日`}
                </div>
              </div>
              
              {task.description && (
                <div>
                  <h3 className={`font-medium ${themeClasses.text} mb-2`}>詳細</h3>
                  <p className={`${themeClasses.textSecondary} bg-gray-50 dark:bg-gray-700 p-3 rounded-lg`}>
                    {task.description}
                  </p>
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    toggleTask(task.id);
                    onClose();
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                    task.completed 
                      ? 'bg-gray-500 hover:bg-gray-600 text-white' 
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  <CheckCircle size={18} />
                  {task.completed ? '未完了にする' : '完了にする'}
                </button>
                
                <button
                  onClick={() => {
                    if (window.confirm('このタスクを削除しますか？')) {
                      deleteTask(task.id);
                      onClose();
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
    );
  };

  const EnhancedTaskCard = ({ task }) => {
    const priority = getTaskPriority(task.dueDate);
    const dueDate = new Date(task.dueDate);
    const now = new Date();
    const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
    
    return (
      <div
        className={`${themeClasses.cardBg} rounded-xl shadow-lg border-l-4 p-6 transition-all duration-300 hover:shadow-xl hover:transform hover:scale-102 ${
          task.completed ? 'opacity-70' : ''
        } ${priorityColors[priority]} cursor-pointer group`}
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
                
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-medium rounded-full shadow-sm">
                    {task.type === 'assignment' ? '📝 課題' : 
                    task.type === 'exam' ? '📚 試験' :
                    task.type === 'project' ? '🚀 プロジェクト' : '🔄 復習'}
                  </span>
                  
                  {task.completed && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center gap-1">
                      <Star size={12} />
                      完了
                    </span>
                  )}
                </div>
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
                <span className={`font-bold flex items-center gap-1 ${
                  daysUntilDue < 0 ? 'text-red-600' :
                  daysUntilDue <= 3 ? 'text-orange-600' : 'text-green-600'
                }`}>
                  {daysUntilDue < 0 ? '⚠️' : daysUntilDue <= 3 ? '🔥' : '✅'}
                  {daysUntilDue < 0 ? `${Math.abs(daysUntilDue)}日遅れ` :
                  daysUntilDue === 0 ? '今日が締切！' : `あと${daysUntilDue}日`}
                </span>
              </div>

              {task.description && (
                <p className={`${themeClasses.textSecondary} mb-4 line-clamp-2`}>
                  {task.description}
                </p>
              )}

              {task.studyPlan && task.studyPlan.length > 0 && !task.completed && (
                <div className="mt-4">
                  <h4 className={`font-medium ${themeClasses.text} mb-2 flex items-center gap-2`}>
                    <TrendingUp size={16} />
                    推奨学習計画
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {task.studyPlan.slice(0, 4).map((plan, index) => (
                      <div
                        key={index}
                        className="bg-gradient-to-br from-indigo-50 to-purple-50 p-3 rounded-lg text-xs border shadow-sm hover:shadow-md transition-shadow duration-200"
                      >
                        <div className="font-medium text-indigo-800">
                          {new Date(plan.date).toLocaleDateString('ja-JP', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </div>
                        <div className="text-purple-600 flex items-center gap-1">
                          <Zap size={10} />
                          {plan.hours.toFixed(1)}時間
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={(e) => {
                e.stopPropagation();
                // 編集機能（簡略化）
                alert('編集機能は今後実装予定です');
              }}
              className="text-blue-500 hover:text-blue-700 transition-colors duration-200 p-2 hover:bg-blue-50 rounded-lg"
            >
              <Edit3 size={18} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('このタスクを削除しますか？')) {
                  deleteTask(task.id);
                }
              }}
              className="text-red-500 hover:text-red-700 transition-colors duration-200 p-2 hover:bg-red-50 rounded-lg"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // カレンダー表示用のコンポーネント
  const CalendarMonth = () => {
    const monthData = getMonthData(currentDate);
    const monthName = currentDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' });
    
    return (
      <div className={`${themeClasses.cardBg} rounded-xl shadow-xl ${themeClasses.border} border overflow-hidden`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <button
            onClick={() => navigateCalendar(-1)}
            className={`p-3 ${themeClasses.hover} rounded-lg transition-all duration-200 transform hover:scale-110`}
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className={`text-2xl font-bold ${themeClasses.text}`}>
            {monthName}
          </h2>
          <button
            onClick={() => navigateCalendar(1)}
            className={`p-3 ${themeClasses.hover} rounded-lg transition-all duration-200 transform hover:scale-110`}
          >
            <ChevronRight size={20} />
          </button>
        </div>
        
        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
            <div key={day} className={`p-4 text-center font-bold text-lg ${
              index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : themeClasses.textSecondary
            }`}>
              {day}
            </div>
          ))}
        </div>
        
        {/* カレンダーグリッド */}
        <div className="grid grid-cols-7 gap-0">
          {monthData.map((dayData, index) => {
            const tasksForDay = getTasksForDate(dayData.date);
            const urgentTasks = getUrgentTasksForDate(dayData.date);
            const isCurrentDay = isToday(dayData.date);
            const isSelected = selectedDate && isSameDay(dayData.date, selectedDate);
            
            return (
              <div
                key={index}
                onClick={() => setSelectedDate(dayData.date)}
                className={`
                  min-h-24 p-2 border-r border-b border-gray-200 cursor-pointer transition-all duration-200 hover:bg-blue-50 dark:hover:bg-gray-700
                  ${!dayData.isCurrentMonth ? 'bg-gray-50 dark:bg-gray-800 text-gray-400' : ''}
                  ${isCurrentDay ? 'bg-blue-100 dark:bg-blue-900' : ''}
                  ${isSelected ? 'bg-indigo-100 dark:bg-indigo-900 ring-2 ring-indigo-500' : ''}
                `}
              >
                <div className={`font-semibold mb-1 ${
                  isCurrentDay ? 'text-blue-600' : 
                  !dayData.isCurrentMonth ? 'text-gray-400' : themeClasses.text
                }`}>
                  {dayData.date.getDate()}
                </div>
                
                {tasksForDay.length > 0 && (
                  <div className="space-y-1">
                    {tasksForDay.slice(0, 2).map((task, taskIndex) => (
                      <div
                        key={taskIndex}
                        className={`text-xs px-2 py-1 rounded truncate ${
                          task.completed ? 'bg-green-100 text-green-800' :
                          getTaskPriority(task.dueDate) === 'urgent' ? 'bg-red-100 text-red-800' :
                          getTaskPriority(task.dueDate) === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}
                        title={task.title}
                      >
                        {task.title}
                      </div>
                    ))}
                    
                    {tasksForDay.length > 2 && (
                      <div className="text-xs text-gray-500 font-medium">
                        +{tasksForDay.length - 2} more
                      </div>
                    )}
                  </div>
                )}
                
                {urgentTasks > 0 && (
                  <div className="mt-1">
                    <span className="inline-flex items-center px-2 py-1 text-xs font-bold text-red-800 bg-red-100 rounded-full">
                      🔥 {urgentTasks}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* 選択した日のタスク詳細 */}
        {selectedDate && (
          <div className="p-6 border-t border-gray-200">
            <h3 className={`text-lg font-bold mb-4 ${themeClasses.text}`}>
              {selectedDate.toLocaleDateString('ja-JP', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })} のタスク
            </h3>
            
            <div className="space-y-2">
              {getTasksForDate(selectedDate).length === 0 ? (
                <p className={themeClasses.textSecondary}>この日にはタスクがありません</p>
              ) : (
                getTasksForDate(selectedDate).map(task => (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
                      task.completed ? 'bg-green-50 border-green-200' :
                      getTaskPriority(task.dueDate) === 'urgent' ? 'bg-red-50 border-red-200' :
                      getTaskPriority(task.dueDate) === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                      'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        task.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'
                      }`} />
                      <div className="flex-1">
                        <div className={`font-medium ${task.completed ? 'line-through text-gray-500' : themeClasses.text}`}>
                          {task.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {task.subject} • {task.estimatedHours}時間
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <button
              onClick={() => setSelectedDate(null)}
              className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              閉じる
            </button>
          </div>
        )}
      </div>
    );
  };

  const CalendarWeek = () => {
    const weekData = getWeekData(currentDate);
    const weekStart = weekData[0].toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
    const weekEnd = weekData[6].toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
    
    return (
      <div className={`${themeClasses.cardBg} rounded-xl shadow-xl ${themeClasses.border} border overflow-hidden`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <button
            onClick={() => navigateCalendar(-1)}
            className={`p-3 ${themeClasses.hover} rounded-lg transition-all duration-200 transform hover:scale-110`}
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className={`text-2xl font-bold ${themeClasses.text}`}>
            {weekStart} - {weekEnd}
          </h2>
          <button
            onClick={() => navigateCalendar(1)}
            className={`p-3 ${themeClasses.hover} rounded-lg transition-all duration-200 transform hover:scale-110`}
          >
            <ChevronRight size={20} />
          </button>
        </div>
        
        {/* 週間ビューグリッド */}
        <div className="grid grid-cols-7 gap-0">
          {weekData.map((date, index) => {
            const tasksForDay = getTasksForDate(date);
            const urgentTasks = getUrgentTasksForDate(date);
            const isCurrentDay = isToday(date);
            const dayName = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
            
            return (
              <div
                key={index}
                className={`
                  min-h-80 p-4 border-r border-gray-200 last:border-r-0 transition-all duration-200
                  ${isCurrentDay ? 'bg-blue-50 dark:bg-blue-900' : ''}
                  ${index === 0 || index === 6 ? 'bg-gray-50 dark:bg-gray-800' : ''}
                `}
              >
                {/* 日付ヘッダー */}
                <div className="mb-3">
                  <div className={`text-sm font-bold ${
                    index === 0 ? 'text-red-500' : 
                    index === 6 ? 'text-blue-500' : 
                    themeClasses.textSecondary
                  }`}>
                    {dayName}
                  </div>
                  <div className={`text-xl font-bold ${
                    isCurrentDay ? 'text-blue-600' : themeClasses.text
                  }`}>
                    {date.getDate()}
                  </div>
                  {urgentTasks > 0 && (
                    <div className="mt-1">
                      <span className="inline-flex items-center px-2 py-1 text-xs font-bold text-red-800 bg-red-100 rounded-full">
                        🔥 {urgentTasks}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* タスクリスト */}
                <div className="space-y-2">
                  {tasksForDay.map(task => (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className={`p-2 rounded text-xs cursor-pointer transition-all duration-200 hover:shadow-md ${
                        task.completed ? 'bg-green-100 text-green-800' :
                        getTaskPriority(task.dueDate) === 'urgent' ? 'bg-red-100 text-red-800' :
                        getTaskPriority(task.dueDate) === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}
                    >
                      <div className={`font-medium truncate ${task.completed ? 'line-through' : ''}`}>
                        {task.title}
                      </div>
                      <div className="text-xs opacity-75 mt-1">
                        {task.subject} • {task.estimatedHours}h
                      </div>
                    </div>
                  ))}
                  
                  {tasksForDay.length === 0 && (
                    <div className="text-xs text-gray-400 italic">
                      タスクなし
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const sortedTasks = filteredTasks.sort((a, b) => {
    // 完了済みを下に
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    // 期限順
    return new Date(a.dueDate) - new Date(b.dueDate);
  });

  return (
    <div className={`min-h-screen transition-colors duration-500 ${themeClasses.bg}`}>
      <div className="container mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className={`text-4xl md:text-5xl font-bold ${themeClasses.text} mb-3 flex items-center justify-center gap-4 animate-pulse`}>
            <div className="relative">
              <Book className="text-indigo-600 animate-bounce" size={48} />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full animate-ping"></div>
            </div>
            StudyPlanner Pro
            <Heart className="text-red-500 animate-pulse" size={32} />
          </h1>
          <p className={`${themeClasses.textSecondary} text-lg md:text-xl font-medium`}>
            計画的な学習で成功への道筋を描こう
          </p>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={`${themeClasses.cardBg} rounded-xl shadow-xl p-6 ${themeClasses.border} border transform hover:scale-105 transition-all duration-200`}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Target className="text-white" size={24} />
              </div>
              <div>
                <h3 className={`font-bold ${themeClasses.text}`}>総タスク数</h3>
                <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className={`${themeClasses.cardBg} rounded-xl shadow-xl p-6 ${themeClasses.border} border transform hover:scale-105 transition-all duration-200`}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <CheckCircle className="text-white" size={24} />
              </div>
              <div>
                <h3 className={`font-bold ${themeClasses.text}`}>完了済み</h3>
                <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
              </div>
            </div>
          </div>
          
          <div className={`${themeClasses.cardBg} rounded-xl shadow-xl p-6 ${themeClasses.border} border transform hover:scale-105 transition-all duration-200`}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <AlertTriangle className="text-white" size={24} />
              </div>
              <div>
                <h3 className={`font-bold ${themeClasses.text}`}>緊急タスク</h3>
                <p className="text-3xl font-bold text-orange-600">{stats.urgent}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ビューモード切り替え */}
        <div className="flex justify-center mb-8">
          <div className={`flex ${themeClasses.cardBg} rounded-xl shadow-lg ${themeClasses.border} border p-1`}>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                viewMode === 'list' 
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md transform scale-105' 
                  : `${themeClasses.textSecondary} hover:${themeClasses.text} ${themeClasses.hover}`
              }`}
            >
              <List size={18} />
              リスト
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                viewMode === 'week' 
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md transform scale-105' 
                  : `${themeClasses.textSecondary} hover:${themeClasses.text} ${themeClasses.hover}`
              }`}
            >
              <Calendar size={18} />
              週間
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                viewMode === 'month' 
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md transform scale-105' 
                  : `${themeClasses.textSecondary} hover:${themeClasses.text} ${themeClasses.hover}`
              }`}
            >
              <Grid3X3 size={18} />
              月間
            </button>
          </div>
        </div>

        {/* クイックアクション */}
        <QuickActions />

        {/* 検索とフィルター */}
        <SearchAndFilter />

        {/* 統計パネル */}
        <StatsPanel />

        {/* データ保存・読み込みパネル */}
        {showSaveLoadPanel && (
          <div className={`${themeClasses.cardBg} rounded-xl shadow-2xl p-6 mb-8 ${themeClasses.border} border animate-slide-down`}>
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
              {/* エクスポート・インポート */}
              <div>
                <h4 className={`text-lg font-medium mb-4 ${themeClasses.text} flex items-center gap-2`}>
                  <Download size={20} />
                  ファイルでの保存・読み込み
                </h4>
                <div className="space-y-3">
                  <button
                    onClick={exportData}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
                  >
                    <Download size={18} />
                    JSONファイルでエクスポート
                  </button>
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
                  >
                    <Upload size={18} />
                    JSONファイルからインポート
                  </button>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={importData}
                    accept=".json"
                    className="hidden"
                  />
                  
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700 flex items-center gap-2">
                      <Zap size={16} />
                      データをファイルとして保存・復元できます
                    </p>
                  </div>
                </div>
              </div>
              
              {/* ローカル保存・読み込み */}
              <div>
                <h4 className={`text-lg font-medium mb-4 ${themeClasses.text} flex items-center gap-2`}>
                  <Save size={20} />
                  ブラウザ内での保存・読み込み
                </h4>
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      localStorage.setItem('studyPlannerTasks', JSON.stringify(tasks));
                      showNotification('データをローカルストレージに保存しました！', 'success');
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
                  >
                    <Save size={18} />
                    ローカルストレージに保存
                  </button>
                  
                  <button
                    onClick={() => {
                      const savedTasks = localStorage.getItem('studyPlannerTasks');
                      if (savedTasks) {
                        setTasks(JSON.parse(savedTasks));
                        showNotification('データを読み込みました！', 'success');
                      } else {
                        showNotification('保存されたデータが見つかりません', 'error');
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
                  >
                    <FolderOpen size={18} />
                    ローカルストレージから読み込み
                  </button>
                  
                  <button
                    onClick={() => {
                      if (window.confirm('すべてのタスクデータを削除しますか？この操作は取り消せません。')) {
                        setTasks([]);
                        localStorage.removeItem('studyPlannerTasks');
                        showNotification('すべてのデータを削除しました', 'success');
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
                  >
                    <Trash2 size={18} />
                    すべてのデータを削除
                  </button>
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <h5 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                <Star size={16} />
                データ管理について
              </h5>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• <strong>自動保存:</strong> タスクの変更は自動的にブラウザに保存されます</p>
                <p>• <strong>エクスポート:</strong> データをJSONファイルとしてダウンロード</p>
                <p>• <strong>インポート:</strong> 保存したJSONファイルからデータを復元</p>
                <p>• <strong>安全性:</strong> データはあなたのブラウザにのみ保存されます</p>
              </div>
            </div>
          </div>
        )}

        {/* タスク追加フォーム */}
        {showAddForm && (
          <div className={`${themeClasses.cardBg} rounded-xl shadow-2xl p-6 mb-8 ${themeClasses.border} border animate-slide-down`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-bold ${themeClasses.text} flex items-center gap-2`}>
                <Plus size={24} className="text-indigo-600" />
                新しいタスクの追加
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
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>タスク名</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  className={`w-full p-3 ${themeClasses.cardBg} ${themeClasses.text} border ${themeClasses.border} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200`}
                  placeholder="例: 数学の中間テスト対策"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>科目</label>
                <input
                  type="text"
                  value={newTask.subject}
                  onChange={(e) => setNewTask({...newTask, subject: e.target.value})}
                  className={`w-full p-3 ${themeClasses.cardBg} ${themeClasses.text} border ${themeClasses.border} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200`}
                  placeholder="例: 数学"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>タイプ</label>
                <select
                  value={newTask.type}
                  onChange={(e) => setNewTask({...newTask, type: e.target.value})}
                  className={`w-full p-3 ${themeClasses.cardBg} ${themeClasses.text} border ${themeClasses.border} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200`}
                >
                  <option value="assignment">課題</option>
                  <option value="exam">試験</option>
                  <option value="project">プロジェクト</option>
                  <option value="review">復習</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>締切日</label>
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                  className={`w-full p-3 ${themeClasses.cardBg} ${themeClasses.text} border ${themeClasses.border} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>予想学習時間（時間）</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={newTask.estimatedHours}
                  onChange={(e) => setNewTask({...newTask, estimatedHours: parseFloat(e.target.value)})}
                  className={`w-full p-3 ${themeClasses.cardBg} ${themeClasses.text} border ${themeClasses.border} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>優先度</label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                  className={`w-full p-3 ${themeClasses.cardBg} ${themeClasses.text} border ${themeClasses.border} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200`}
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
                className={`w-full p-3 ${themeClasses.cardBg} ${themeClasses.text} border ${themeClasses.border} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200`}
                rows="3"
                placeholder="詳細な説明や学習のポイントなど..."
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={addTask}
                disabled={!newTask.title || !newTask.dueDate}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg disabled:transform-none disabled:hover:shadow-none"
              >
                追加
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
        {viewMode === 'list' && (
          <div className="space-y-6">
            {sortedTasks.length === 0 ? (
              <div className="text-center py-16">
                <div className="relative">
                  <Book className={`mx-auto w-24 h-24 ${themeClasses.textSecondary} mb-6 animate-bounce`} />
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div>
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-ping animation-delay-200"></div>
                      <div className="w-2 h-2 bg-pink-500 rounded-full animate-ping animation-delay-400"></div>
                    </div>
                  </div>
                </div>
                <p className={`${themeClasses.textSecondary} text-xl mb-2`}>
                  {searchQuery || filterPriority !== 'all' ? 
                    '条件に一致するタスクがありません' : 
                    'まだタスクがありません'
                  }
                </p>
                <p className={`${themeClasses.textSecondary} mb-8`}>
                  {searchQuery || filterPriority !== 'all' ? 
                    '検索条件やフィルターを変更してみてください' : 
                    '上のボタンから新しいタスクを追加してみましょう'
                  }
                </p>
                
                {!searchQuery && filterPriority === 'all' && (
                  <div className={`${themeClasses.cardBg} rounded-xl p-6 max-w-md mx-auto ${themeClasses.border} border shadow-lg`}>
                    <p className="font-medium mb-3 text-indigo-600">StudyPlanner Pro の特徴</p>
                    <div className="text-sm space-y-2 text-left">
                      <p className={themeClasses.textSecondary}>• 自動学習計画の生成</p>
                      <p className={themeClasses.textSecondary}>• 優先度による自動ソート</p>
                      <p className={themeClasses.textSecondary}>• データの自動保存</p>
                      <p className={themeClasses.textSecondary}>• 学習進捗の可視化</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {sortedTasks.map(task => (
                  <EnhancedTaskCard key={task.id} task={task} />
                ))}
              </div>
            )}
          </div>
        )}

        {viewMode === 'month' && <CalendarMonth />}
        {viewMode === 'week' && <CalendarWeek />}

        {/* タスク詳細モーダル */}
        {selectedTask && (
          <TaskDetailModal 
            task={selectedTask} 
            onClose={() => setSelectedTask(null)} 
          />
        )}

        {/* フッター */}
        <footer className="mt-16 text-center">
          <div className={`${themeClasses.cardBg} rounded-xl shadow-lg p-6 ${themeClasses.border} border`}>
            <p className={`${themeClasses.textSecondary} mb-2`}>
              StudyPlanner Pro で効率的な学習を！
            </p>
            <div className="flex justify-center items-center gap-4 text-sm">
              <span className={`flex items-center gap-1 ${themeClasses.textSecondary}`}>
                <Heart size={14} className="text-red-500" />
                学習を愛する全ての人へ
              </span>
              <span className={`flex items-center gap-1 ${themeClasses.textSecondary}`}>
                <Users size={14} />
                一緒に頑張りましょう！
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default StudentTaskManager;