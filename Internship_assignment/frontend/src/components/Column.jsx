import React, { useState, useEffect } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  Lock,
  Plus,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Layers,
  ListFilter
} from 'lucide-react';
import TaskCard from './TaskCard';

function Column({ col, tasks, onAddTask, onEditTask, onViewTask, canAddTask }) {
  const isDoneColumn = col.id === 'Done';
  const [activeIdx, setActiveIdx] = useState(0);
  const [animDirection, setAnimDirection] = useState(''); // 'next' | 'prev' | ''
  const [viewMode, setViewMode] = useState('wheel'); // 'wheel' | 'list'

  // Clamp activeIdx if tasks change (e.g. task moved or deleted)
  useEffect(() => {
    if (activeIdx >= tasks.length && tasks.length > 0) {
      setActiveIdx(tasks.length - 1);
    }
  }, [tasks.length, activeIdx]);

  const handleRotateNext = (e) => {
    if (e) e.stopPropagation();
    if (tasks.length <= 1 || animDirection) return;
    setAnimDirection('next');
    setTimeout(() => {
      setActiveIdx((prev) => (prev + 1) % tasks.length);
      setAnimDirection('');
    }, 280);
  };

  const handleRotatePrev = (e) => {
    if (e) e.stopPropagation();
    if (tasks.length <= 1 || animDirection) return;
    setAnimDirection('prev');
    setTimeout(() => {
      setActiveIdx((prev) => (prev - 1 + tasks.length) % tasks.length);
      setAnimDirection('');
    }, 280);
  };

  const handleWheelScroll = (e) => {
    if (viewMode !== 'wheel' || tasks.length <= 1 || animDirection) return;
    if (Math.abs(e.deltaY) > 20) {
      if (e.deltaY > 0) {
        handleRotateNext();
      } else {
        handleRotatePrev();
      }
    }
  };

  const renderEmptyIcon = () => {
    switch (col.id) {
      case 'To Do':
        return <ClipboardList size={26} color="var(--text-muted)" />;
      case 'In Progress':
        return <Clock size={26} color="var(--text-muted)" />;
      case 'Done':
        return <CheckCircle2 size={26} color="#16a34a" />;
      default:
        return <ClipboardList size={26} color="var(--text-muted)" />;
    }
  };

  const safeIdx = tasks.length > 0 ? Math.min(activeIdx, tasks.length - 1) : 0;
  const isWheelMode = viewMode === 'wheel' && tasks.length > 1;

  return (
    <div className={`column-container ${col.cssClass}`}>
      <div className="column-header">
        <div className="column-header-left">
          <span className="column-dot" />
          <h2 className="column-title" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>{col.label}</span>
            {isDoneColumn && <Lock size={12} color="var(--accent-black)" />}
          </h2>
          <span className="task-count">{tasks.length}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {/* Wheel / List View Mode Toggle (Only when multiple cards exist) */}
          {tasks.length > 1 && (
            <button
              type="button"
              className="card-wheel-toggle-mode"
              onClick={() => setViewMode(viewMode === 'wheel' ? 'list' : 'wheel')}
              title={viewMode === 'wheel' ? 'Switch to vertical list view' : 'Switch to 3D wheel pile view'}
              aria-label="Toggle view mode"
            >
              {viewMode === 'wheel' ? <ListFilter size={12} /> : <Layers size={12} />}
              <span>{viewMode === 'wheel' ? 'List' : 'Wheel'}</span>
            </button>
          )}

          {/* Add task button only on To Do / In Progress, and only for Admins */}
          {!isDoneColumn && canAddTask && (
            <button
              className="add-task-btn"
              id={`add-task-btn-${col.id.replace(/\s+/g, '-').toLowerCase()}`}
              onClick={onAddTask}
              title={`Add task to ${col.label}`}
              aria-label={`Add task to ${col.label}`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Plus size={14} />
            </button>
          )}

          {isDoneColumn && (
            <span
              className="commit-lock-badge"
              title="Tasks in this column are completed strictly via Git commit containing the Task ID"
              style={{
                fontSize: '0.65rem',
                fontWeight: '900',
                background: '#fef08a',
                border: '1px solid var(--accent-black)',
                padding: '0.15rem 0.4rem',
                letterSpacing: '0.5px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <Lock size={10} />
              <span>COMMIT ONLY</span>
            </span>
          )}
        </div>
      </div>

      <Droppable droppableId={col.id}>
        {(provided, snapshot) => (
          <div
            className={`column-content ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="column-empty">
                <div className="column-empty-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.35rem' }}>
                  {renderEmptyIcon()}
                </div>
                <span>{col.emptyText}</span>
                {isDoneColumn && (
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Push a commit with Task ID to complete
                  </span>
                )}
              </div>
            )}

            {/* 3D Rotating Wheel Pile Mode (When cards are piled up) */}
            {isWheelMode ? (
              <>
                {/* Rotating Controls Bar */}
                <div className="card-wheel-controls">
                  <button
                    type="button"
                    className="card-wheel-nav-btn"
                    onClick={handleRotatePrev}
                    title="Rotate to previous card in pile"
                    aria-label="Previous Task Card"
                  >
                    <ChevronLeft size={13} />
                    <span>Prev</span>
                  </button>

                  <div
                    className="card-wheel-indicator"
                    onClick={handleRotateNext}
                    title="Click or scroll mouse wheel over cards to rotate through pile"
                  >
                    <RotateCw size={12} className={animDirection ? 'spin-once' : ''} />
                    <span>Task {safeIdx + 1} of {tasks.length}</span>
                  </div>

                  <button
                    type="button"
                    className="card-wheel-nav-btn"
                    onClick={handleRotateNext}
                    title="Rotate to next card in pile"
                    aria-label="Next Task Card"
                  >
                    <span>Next</span>
                    <ChevronRight size={13} />
                  </button>
                </div>

                {/* 3D Card Stack Stage */}
                <div
                  className={`cards-wheel-pile-stage ${animDirection ? `anim-rotate-${animDirection}` : ''}`}
                  onWheel={handleWheelScroll}
                >
                  {tasks.map((task, index) => {
                    const offset = (index - safeIdx + tasks.length) % tasks.length;
                    let pileClass = 'pile-hidden';
                    let isPeek = false;

                    if (offset === 0) {
                      pileClass = 'pile-active';
                    } else if (offset === 1) {
                      pileClass = 'pile-peek-1';
                      isPeek = true;
                    } else if (offset === 2 && tasks.length >= 3) {
                      pileClass = 'pile-peek-2';
                      isPeek = true;
                    } else if (offset === tasks.length - 1 && animDirection === 'prev') {
                      pileClass = 'pile-peek-last';
                    }

                    return (
                      <div
                        key={task.id}
                        className={`pile-card-wrapper ${pileClass}`}
                        onClick={isPeek ? handleRotateNext : undefined}
                        title={isPeek ? `Click to rotate to [${task.taskId}] ${task.title}` : undefined}
                      >
                        <TaskCard
                          task={task}
                          index={index}
                          onEdit={onEditTask}
                          onView={() => onViewTask(task)}
                          isWheelPeek={isPeek}
                          onWheelPeekClick={handleRotateNext}
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="wheel-scroll-tip">
                  <RotateCw size={11} />
                  <span>Scroll mouse wheel or click Next to rotate through cards</span>
                </div>
              </>
            ) : (
              /* Single Card or Classic List Mode */
              tasks.map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  onEdit={onEditTask}
                  onView={() => onViewTask(task)}
                />
              ))
            )}

            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

export default React.memo(Column);
