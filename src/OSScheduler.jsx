import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Plus, Trash2, Settings, Info } from 'lucide-react';

const OSScheduler = () => {
  const [processes, setProcesses] = useState([
    { id: 1, name: 'P1', arrivalTime: 0, burstTime: 5, priority: 2, color: '#3b82f6' },
    { id: 2, name: 'P2', arrivalTime: 1, burstTime: 3, priority: 1, color: '#10b981' },
    { id: 3, name: 'P3', arrivalTime: 2, burstTime: 8, priority: 3, color: '#f59e0b' },
    { id: 4, name: 'P4', arrivalTime: 3, burstTime: 6, priority: 2, color: '#ef4444' },
  ]);
  
  const [algorithm, setAlgorithm] = useState('FCFS');
  const [timeQuantum, setTimeQuantum] = useState(2);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [ganttChart, setGanttChart] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [showAddProcess, setShowAddProcess] = useState(false);
  const [speed, setSpeed] = useState(500);

  const algorithms = ['FCFS', 'SJF', 'SRTF', 'Priority', 'Round Robin'];

  const calculateSchedule = () => {
    const procs = [...processes].map(p => ({
      ...p,
      remainingTime: p.burstTime,
      completionTime: 0,
      turnaroundTime: 0,
      waitingTime: 0,
      responseTime: -1,
      startTime: -1
    }));

    let time = 0;
    let chart = [];
    let completed = 0;
    const n = procs.length;

    switch(algorithm) {
      case 'FCFS':
        procs.sort((a, b) => a.arrivalTime - b.arrivalTime);
        procs.forEach(p => {
          if (time < p.arrivalTime) {
            chart.push({ name: 'Idle', start: time, end: p.arrivalTime, color: '#e5e7eb' });
            time = p.arrivalTime;
          }
          p.startTime = time;
          p.responseTime = time - p.arrivalTime;
          chart.push({ name: p.name, start: time, end: time + p.burstTime, color: p.color });
          time += p.burstTime;
          p.completionTime = time;
          p.turnaroundTime = p.completionTime - p.arrivalTime;
          p.waitingTime = p.turnaroundTime - p.burstTime;
        });
        break;

      case 'SJF':
        while (completed < n) {
          const available = procs.filter(p => p.arrivalTime <= time && p.completionTime === 0);
          if (available.length === 0) {
            chart.push({ name: 'Idle', start: time, end: time + 1, color: '#e5e7eb' });
            time++;
            continue;
          }
          available.sort((a, b) => a.burstTime - b.burstTime);
          const p = available[0];
          p.startTime = time;
          p.responseTime = time - p.arrivalTime;
          chart.push({ name: p.name, start: time, end: time + p.burstTime, color: p.color });
          time += p.burstTime;
          p.completionTime = time;
          p.turnaroundTime = p.completionTime - p.arrivalTime;
          p.waitingTime = p.turnaroundTime - p.burstTime;
          completed++;
        }
        break;

      case 'SRTF':
        while (completed < n) {
          const available = procs.filter(p => p.arrivalTime <= time && p.remainingTime > 0);
          if (available.length === 0) {
            chart.push({ name: 'Idle', start: time, end: time + 1, color: '#e5e7eb' });
            time++;
            continue;
          }
          available.sort((a, b) => a.remainingTime - b.remainingTime);
          const p = available[0];
          if (p.startTime === -1) {
            p.startTime = time;
            p.responseTime = time - p.arrivalTime;
          }
          chart.push({ name: p.name, start: time, end: time + 1, color: p.color });
          p.remainingTime--;
          time++;
          if (p.remainingTime === 0) {
            p.completionTime = time;
            p.turnaroundTime = p.completionTime - p.arrivalTime;
            p.waitingTime = p.turnaroundTime - p.burstTime;
            completed++;
          }
        }
        break;

      case 'Priority':
        while (completed < n) {
          const available = procs.filter(p => p.arrivalTime <= time && p.completionTime === 0);
          if (available.length === 0) {
            chart.push({ name: 'Idle', start: time, end: time + 1, color: '#e5e7eb' });
            time++;
            continue;
          }
          available.sort((a, b) => a.priority - b.priority);
          const p = available[0];
          p.startTime = time;
          p.responseTime = time - p.arrivalTime;
          chart.push({ name: p.name, start: time, end: time + p.burstTime, color: p.color });
          time += p.burstTime;
          p.completionTime = time;
          p.turnaroundTime = p.completionTime - p.arrivalTime;
          p.waitingTime = p.turnaroundTime - p.burstTime;
          completed++;
        }
        break;

      case 'Round Robin':
        const queue = [];
        let i = 0;
        while (completed < n) {
          while (i < n && procs[i].arrivalTime <= time) {
            if (procs[i].remainingTime > 0 && !queue.includes(procs[i])) {
              queue.push(procs[i]);
            }
            i++;
          }
          if (queue.length === 0) {
            chart.push({ name: 'Idle', start: time, end: time + 1, color: '#e5e7eb' });
            time++;
            continue;
          }
          const p = queue.shift();
          if (p.startTime === -1) {
            p.startTime = time;
            p.responseTime = time - p.arrivalTime;
          }
          const execTime = Math.min(timeQuantum, p.remainingTime);
          chart.push({ name: p.name, start: time, end: time + execTime, color: p.color });
          p.remainingTime -= execTime;
          time += execTime;
          
          while (i < n && procs[i].arrivalTime <= time) {
            if (procs[i].remainingTime > 0 && !queue.includes(procs[i])) {
              queue.push(procs[i]);
            }
            i++;
          }
          
          if (p.remainingTime === 0) {
            p.completionTime = time;
            p.turnaroundTime = p.completionTime - p.arrivalTime;
            p.waitingTime = p.turnaroundTime - p.burstTime;
            completed++;
          } else {
            queue.push(p);
          }
        }
        break;
    }

    const avgTAT = procs.reduce((sum, p) => sum + p.turnaroundTime, 0) / n;
    const avgWT = procs.reduce((sum, p) => sum + p.waitingTime, 0) / n;
    const avgRT = procs.reduce((sum, p) => sum + p.responseTime, 0) / n;

    setMetrics({
      processes: procs,
      avgTurnaroundTime: avgTAT.toFixed(2),
      avgWaitingTime: avgWT.toFixed(2),
      avgResponseTime: avgRT.toFixed(2),
      throughput: (n / time).toFixed(2)
    });
    setGanttChart(chart);
  };

  const addProcess = () => {
    const colors = ['#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316'];
    const newId = Math.max(...processes.map(p => p.id), 0) + 1;
    setProcesses([...processes, {
      id: newId,
      name: `P${newId}`,
      arrivalTime: 0,
      burstTime: 5,
      priority: 1,
      color: colors[newId % colors.length]
    }]);
  };

  const updateProcess = (id, field, value) => {
    setProcesses(processes.map(p => 
      p.id === id ? { ...p, [field]: parseInt(value) || 0 } : p
    ));
  };

  const deleteProcess = (id) => {
    if (processes.length > 1) {
      setProcesses(processes.filter(p => p.id !== id));
    }
  };

  const runSimulation = () => {
    setIsRunning(true);
    calculateSchedule();
    setCurrentTime(0);
  };

  const reset = () => {
    setIsRunning(false);
    setCurrentTime(0);
    setGanttChart([]);
    setMetrics(null);
  };

  useEffect(() => {
    if (isRunning && ganttChart.length > 0) {
      const maxTime = ganttChart[ganttChart.length - 1].end;
      if (currentTime < maxTime) {
        const timer = setTimeout(() => {
          setCurrentTime(currentTime + 1);
        }, speed);
        return () => clearTimeout(timer);
      } else {
        setIsRunning(false);
      }
    }
  }, [isRunning, currentTime, ganttChart, speed]);

  const visibleChart = ganttChart.filter(item => item.start < currentTime);
  const lastVisible = visibleChart[visibleChart.length - 1];
  if (lastVisible && lastVisible.end > currentTime) {
    visibleChart[visibleChart.length - 1] = { ...lastVisible, end: currentTime };
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            OS Scheduling Visualizer
          </h1>
          <p className="text-slate-300">Interactive CPU Scheduling Algorithm Simulator</p>
        </div>

        {/* Control Panel */}
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Algorithm</label>
              <select 
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value)}
                className="w-full bg-slate-700 rounded-lg px-4 py-2 border border-slate-600 focus:ring-2 focus:ring-purple-500 outline-none"
              >
                {algorithms.map(alg => (
                  <option key={alg} value={alg}>{alg}</option>
                ))}
              </select>
            </div>
            
            {algorithm === 'Round Robin' && (
              <div>
                <label className="block text-sm font-medium mb-2">Time Quantum</label>
                <input 
                  type="number"
                  value={timeQuantum}
                  onChange={(e) => setTimeQuantum(parseInt(e.target.value) || 1)}
                  min="1"
                  className="w-full bg-slate-700 rounded-lg px-4 py-2 border border-slate-600 focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-2">Speed (ms)</label>
              <input 
                type="range"
                value={speed}
                onChange={(e) => setSpeed(parseInt(e.target.value))}
                min="100"
                max="1000"
                step="100"
                className="w-full"
              />
              <div className="text-xs text-slate-400 mt-1">{speed}ms</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button 
              onClick={runSimulation}
              disabled={isRunning}
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-2 rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Play size={18} /> Run
            </button>
            
            <button 
              onClick={reset}
              className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-600 px-6 py-2 rounded-lg font-medium hover:from-red-600 hover:to-pink-700 transition-all"
            >
              <RotateCcw size={18} /> Reset
            </button>
            
            <button 
              onClick={addProcess}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-600 px-6 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-cyan-700 transition-all"
            >
              <Plus size={18} /> Add Process
            </button>
          </div>
        </div>

        {/* Process Table */}
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-slate-700">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Settings size={24} className="text-purple-400" />
            Process Configuration
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left p-3">Process</th>
                  <th className="text-left p-3">Arrival Time</th>
                  <th className="text-left p-3">Burst Time</th>
                  {(algorithm === 'Priority') && (
                    <th className="text-left p-3">Priority</th>
                  )}
                  <th className="text-left p-3">Color</th>
                  <th className="text-left p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {processes.map(p => (
                  <tr key={p.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="p-3 font-medium">{p.name}</td>
                    <td className="p-3">
                      <input 
                        type="number"
                        value={p.arrivalTime}
                        onChange={(e) => updateProcess(p.id, 'arrivalTime', e.target.value)}
                        className="w-20 bg-slate-700 rounded px-2 py-1 border border-slate-600 focus:ring-2 focus:ring-purple-500 outline-none"
                        min="0"
                      />
                    </td>
                    <td className="p-3">
                      <input 
                        type="number"
                        value={p.burstTime}
                        onChange={(e) => updateProcess(p.id, 'burstTime', e.target.value)}
                        className="w-20 bg-slate-700 rounded px-2 py-1 border border-slate-600 focus:ring-2 focus:ring-purple-500 outline-none"
                        min="1"
                      />
                    </td>
                    {(algorithm === 'Priority') && (
                      <td className="p-3">
                        <input 
                          type="number"
                          value={p.priority}
                          onChange={(e) => updateProcess(p.id, 'priority', e.target.value)}
                          className="w-20 bg-slate-700 rounded px-2 py-1 border border-slate-600 focus:ring-2 focus:ring-purple-500 outline-none"
                          min="1"
                        />
                      </td>
                    )}
                    <td className="p-3">
                      <div className="w-8 h-8 rounded" style={{ backgroundColor: p.color }}></div>
                    </td>
                    <td className="p-3">
                      <button 
                        onClick={() => deleteProcess(p.id)}
                        disabled={processes.length === 1}
                        className="text-red-400 hover:text-red-300 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Gantt Chart */}
        {ganttChart.length > 0 && (
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-slate-700">
            <h2 className="text-2xl font-bold mb-4">Gantt Chart</h2>
            <div className="relative">
              <div className="flex items-center mb-2">
                {visibleChart.map((item, idx) => (
                  <div 
                    key={idx}
                    className="relative h-16 flex items-center justify-center border-r border-slate-600 transition-all duration-300"
                    style={{ 
                      width: `${((item.end - item.start) / ganttChart[ganttChart.length - 1].end) * 100}%`,
                      backgroundColor: item.color,
                      opacity: 0.9
                    }}
                  >
                    <span className="font-bold text-white text-sm">{item.name}</span>
                  </div>
                ))}
              </div>
              <div className="flex">
                {ganttChart.map((item, idx) => (
                  <div 
                    key={idx}
                    className="text-xs text-slate-400"
                    style={{ width: `${((item.end - item.start) / ganttChart[ganttChart.length - 1].end) * 100}%` }}
                  >
                    {item.start}
                  </div>
                ))}
                <div className="text-xs text-slate-400">
                  {ganttChart[ganttChart.length - 1].end}
                </div>
              </div>
              <div className="mt-2 text-center text-sm text-purple-400 font-medium">
                Current Time: {currentTime}
              </div>
            </div>
          </div>
        )}

        {/* Metrics */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-slate-700">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Info size={24} className="text-blue-400" />
                Performance Metrics
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                  <span className="text-slate-300">Average Turnaround Time</span>
                  <span className="font-bold text-xl text-blue-400">{metrics.avgTurnaroundTime}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                  <span className="text-slate-300">Average Waiting Time</span>
                  <span className="font-bold text-xl text-green-400">{metrics.avgWaitingTime}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                  <span className="text-slate-300">Average Response Time</span>
                  <span className="font-bold text-xl text-purple-400">{metrics.avgResponseTime}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                  <span className="text-slate-300">Throughput</span>
                  <span className="font-bold text-xl text-orange-400">{metrics.throughput}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-slate-700">
              <h2 className="text-2xl font-bold mb-4">Process Details</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left p-2">Process</th>
                      <th className="text-left p-2">TAT</th>
                      <th className="text-left p-2">WT</th>
                      <th className="text-left p-2">RT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.processes.map(p => (
                      <tr key={p.id} className="border-b border-slate-700/50">
                        <td className="p-2 font-medium">{p.name}</td>
                        <td className="p-2">{p.turnaroundTime}</td>
                        <td className="p-2">{p.waitingTime}</td>
                        <td className="p-2">{p.responseTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OSScheduler;