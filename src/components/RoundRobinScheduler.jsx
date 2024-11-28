import React, { useState, useEffect } from 'react';

const RoundRobinScheduler = () => {
  const [quantumSize, setQuantumSize] = useState(2);
  const [numProcesses, setNumProcesses] = useState(3);
  const [processes, setProcesses] = useState([]);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [queue, setQueue] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [executionTimes, setExecutionTimes] = useState([]);
  const [ganttData, setGanttData] = useState([]);

  const handleQuantumChange = (e) => setQuantumSize(Number(e.target.value));
  const handleNumProcessesChange = (e) => {
    setNumProcesses(Number(e.target.value));
    setExecutionTimes(Array(Number(e.target.value)).fill(''));
  };

  const handleExecutionTimeChange = (index, value) => {
    const newExecutionTimes = [...executionTimes];
    newExecutionTimes[index] = value;
    setExecutionTimes(newExecutionTimes);
  };

  const startScheduling = () => {
    const initialProcesses = [];
    for (let i = 0; i < numProcesses; i++) {
      initialProcesses.push({
        id: `P${i + 1}`,
        arrivalTime: i,
        executionTime: Number(executionTimes[i]) || 0,
        remainingTime: Number(executionTimes[i]) || 0,
        waitingTime: 0,
        turnaroundTime: 0,
        state: 'Waiting',
        startTime: null,
        completionTime: null,
        IR: 'LOAD', // Initial instruction (dummy)
        PC: 0,
      });
    }

    setProcesses(initialProcesses);
    setQueue(initialProcesses);
    setIsRunning(true);
    setGanttData([]);
  };

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeElapsed((prevTime) => prevTime + quantumSize);

      const updatedProcesses = [...processes];
      const updatedQueue = [...queue];
      const updatedGanttData = [...ganttData];

      if (updatedQueue.length > 0) {
        const currentProcess = updatedQueue.shift();

        currentProcess.state = 'Running';
        updatedGanttData.push({
          processId: currentProcess.id,
          start: timeElapsed,
          end: timeElapsed + quantumSize,
          state: 'Running',
        });

        // Update IR (Instruction Register) with a new operation
        currentProcess.IR = currentProcess.IR === 'ADD' ? 'SUB' : 'ADD'; // Toggle between ADD and SUB for demonstration

        // Update PC (Program Counter)
        currentProcess.PC += quantumSize;

        setTimeout(() => {
          if (currentProcess.remainingTime <= quantumSize) {
            currentProcess.remainingTime = 0;
            currentProcess.state = 'Completed';
            currentProcess.completionTime = timeElapsed + quantumSize;
            currentProcess.turnaroundTime = currentProcess.completionTime - currentProcess.arrivalTime;
            currentProcess.waitingTime = currentProcess.turnaroundTime - currentProcess.executionTime;

            updatedGanttData.push({
              processId: currentProcess.id,
              start: timeElapsed + quantumSize,
              end: timeElapsed + quantumSize,
              state: 'Completed',
            });
          } else {
            currentProcess.remainingTime -= quantumSize;
            currentProcess.state = 'Halted';
            updatedQueue.push(currentProcess);

            updatedGanttData.push({
              processId: currentProcess.id,
              start: timeElapsed + quantumSize,
              end: timeElapsed + quantumSize,
              state: 'Halted',
            });
          }

          updatedProcesses[currentProcess.id.slice(1) - 1] = currentProcess;
          setQueue(updatedQueue);
          setProcesses(updatedProcesses);
          setGanttData(updatedGanttData);

          if (updatedQueue.length === 0 && updatedProcesses.every((p) => p.remainingTime === 0)) {
            setIsRunning(false);
          }
        }, 500);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeElapsed, processes, queue, quantumSize, ganttData]);

  const renderGanttChart = () => {
    const ganttBlocks = [];
    let lastEnd = 0;

    ganttData.forEach((entry, index) => {
      const width = (entry.end - entry.start) * 20;
      const color = entry.state === 'Running' ? '#50fa7b' : entry.state === 'Halted' ? '#ffb86c' : '#f8f8f2';
      ganttBlocks.push(
        <div
          key={index}
          style={{
            position: 'absolute',
            left: entry.start * 20,
            width: width,
            height: 30,
            backgroundColor: color,
            textAlign: 'center',
            lineHeight: '30px',
            color: 'white',
            borderRadius: '5px',
            transition: 'all 0.5s ease',
          }}
        >
          {entry.processId}
        </div>
      );
      lastEnd = entry.end;
    });

    return (
      <div style={{ position: 'relative', height: '50px', width: '100%', borderTop: '2px solid #f8f8f2', marginTop: '20px' }}>
        {ganttBlocks}
      </div>
    );
  };

  return (
    <div className="scheduler-container">
      <h1 className="header">Round Robin Scheduling Algorithm</h1>
      <div className="input-container">
        <div className="input-group">
          <label htmlFor="quantum-size">Quantum Size</label>
          <input
            id="quantum-size"
            type="number"
            value={quantumSize}
            onChange={handleQuantumChange}
            placeholder="Quantum Size"
            className="input-field"
          />
        </div>

        <div className="input-group">
          <label htmlFor="num-processes">Number of Processes</label>
          <input
            id="num-processes"
            type="number"
            value={numProcesses}
            onChange={handleNumProcessesChange}
            placeholder="Number of Processes"
            className="input-field"
          />
        </div>

        <div className="input-group">
          <label>Execution Time for Each Process</label>
          {Array.from({ length: numProcesses }).map((_, index) => (
            <div key={index}>
              <label>{`Process P${index + 1} Execution Time`}</label>
              <input
                type="number"
                value={executionTimes[index] || ''}
                onChange={(e) => handleExecutionTimeChange(index, e.target.value)}
                className="input-field"
                placeholder={`Execution time for P${index + 1}`}
              />
            </div>
          ))}
        </div>

        <button className="start-btn" onClick={startScheduling}>Start Scheduling</button>
      </div>

      <div className="process-table-container">
        <table className="process-table">
          <thead>
            <tr>
              <th>Process ID</th>
              <th>Arrival Time</th>
              <th>Execution Time</th>
              <th>Remaining Time</th>
              <th>Waiting Time</th>
              <th>Turnaround Time</th>
              <th>IR (Instruction)</th>
              <th>PC (Program Counter)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {processes.map((process) => (
              <tr key={process.id} className={process.state.toLowerCase()}>
                <td>{process.id}</td>
                <td>{process.arrivalTime}</td>
                <td>{process.executionTime}</td>
                <td>{process.remainingTime}</td>
                <td>{process.waitingTime >= 0 ? process.waitingTime : 0}</td>
                <td>{process.turnaroundTime >= 0 ? process.turnaroundTime : 0}</td>
                <td>{process.IR}</td>
                <td>{process.PC}</td>
                <td>{process.state}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="time-elapsed">
        <span>Time Elapsed: {timeElapsed}</span>
      </div>

      {renderGanttChart()}
    </div>
  );
};

export default RoundRobinScheduler;
