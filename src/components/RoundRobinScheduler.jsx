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
  const [processIterations, setProcessIterations] = useState([]);

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
    setTimeElapsed(0);
    setQueue([]);
    setGanttData([]);
    setProcessIterations([]);

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
        IR: 'LOAD',
        PC: 0,
      });
    }

    setProcesses(initialProcesses);
    setQueue(initialProcesses);
    setIsRunning(true);
  };

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeElapsed((prevTime) => prevTime + quantumSize);

      const updatedProcesses = [...processes];
      const updatedQueue = [...queue];
      const updatedGanttData = [...ganttData];
      let iterationState = [];

      if (updatedQueue.length > 0) {
        const currentProcess = updatedQueue.shift();
        currentProcess.state = 'Running';

        updatedGanttData.push({
          processId: currentProcess.id,
          start: timeElapsed,
          end: timeElapsed + quantumSize,
          state: 'Running',
        });

        currentProcess.IR = currentProcess.IR === 'ADD' ? 'SUB' : 'ADD';
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

          iterationState = updatedProcesses.map((process) => ({
            id: process.id,
            state: process.state,
            remainingTime: process.remainingTime,
            PC: process.PC,
            IR: process.IR,
          }));

          setQueue(updatedQueue);
          setProcesses(updatedProcesses);
          setGanttData(updatedGanttData);

          setProcessIterations((prevIterations) => [...prevIterations, iterationState]);

          if (updatedQueue.length === 0 && updatedProcesses.every((p) => p.remainingTime === 0)) {
            setIsRunning(false);
          }
        }, 500);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeElapsed, processes, queue, quantumSize, ganttData]);

  const renderIterations = () => {
    return processIterations.map((iteration, index) => (
      <div key={index} className="iteration-card">
        <h3>Iteration {index + 1}</h3>
        <table className="iteration-table">
          <thead>
            <tr>
              <th>Process ID</th>
              <th>State</th>
              <th>Remaining Time</th>
              <th>Program Counter (PC)</th>
              <th>Instruction Register (IR)</th>
            </tr>
          </thead>
          <tbody>
            {iteration.map((processState) => (
              <tr
                key={processState.id}
                className={processState.state === 'Running' ? 'highlight' : ''}
              >
                <td>{processState.id}</td>
                <td>{processState.state}</td>
                <td>{processState.remainingTime}</td>
                <td>{processState.PC}</td>
                <td>{processState.IR}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ));
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
              <tr
                key={process.id}
                className={
                  process.state === 'Running'
                    ? 'running-row'
                    : process.state === 'Completed'
                    ? 'completed-row'
                    : ''
                }
              >
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

      {renderIterations()}
    </div>
  );
};

export default RoundRobinScheduler;
