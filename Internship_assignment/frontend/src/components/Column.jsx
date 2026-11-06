import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  Lock,
  Plus,
  ChevronLeft,
  ChevronRight,
  Layers,
  List
} from 'lucide-react';
import TaskCard from './TaskCard';

function Column({ col, tasks, onAddTask, onEditTask, onViewTask, canAddTask }) {
  const isDoneColumn = col.id === 'Done';
  const [viewMode, setViewMode] = useState('carousel'); // 'carousel' | 'list'
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);

    // Determine which card is most visible
    const cards = el.querySelectorAll('.carousel-card-slot');
    if (cards.length === 0) return;
    const containerRect = el.getBoundingClientRect();
    const containerCenter = containerRect.left + containerRect.width / 2;
    let closest = 0;
    let closestDist = Infinity;
    cards.forEach((card, i) => {
      const rect = card.getBoundingClientRect();
      const cardCenter = rect.left + rect.width / 2;
      const dist = Math.abs(cardCenter - containerCenter);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    });
    setActiveIdx(closest);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      ro.disconnect();
    };
  }, [tasks.length, viewMode, updateScrollState]);

  const scrollTo = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    // Scroll by one card width
    const cardWidth = el.querySelector('.carousel-card-slot')?.offsetWidth || 280;
    const gap = 14;
    el.scrollBy({ left: direction === 'next' ? cardWidth + gap : -(cardWidth + gap), behavior: 'smooth' });
  };

  const scrollToIndex = (idx) => {
    const el = scrollRef.current;
    if (!el) return;
    const cards = el.querySelectorAll('.carousel-card-slot');
    if (cards[idx]) {
      cards[idx].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
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

  const isCarousel = viewMode === 'carousel' && tasks.length > 1;

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
          {tasks.length > 1 && (
            <button
              type="button"
              className="card-wheel-toggle-mode"
              onClick={() => setViewMode(viewMode === 'carousel' ? 'list' : 'carousel')}
              title={viewMode === 'carousel' ? 'Switch to vertical list' : 'Switch to horizontal carousel'}
              aria-label="Toggle view mode"
            >
              {viewMode === 'carousel' ? <List size={12} /> : <Layers size={12} />}
              <span>{viewMode === 'carousel' ? 'List' : 'Carousel'}</span>
            </button>
          )}

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

      <Droppable droppableId={col.id} direction={isCarousel ? 'horizontal' : 'vertical'}>
        {(provided, snapshot) => (
          <div
            className={`column-content ${snapshot.isDraggingOver ? 'dragging-over' : ''} ${isCarousel ? 'carousel-mode' : ''}`}
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

            {isCarousel ? (
              <div className="carousel-wrapper">
                {/* Left Arrow */}
                <button
                  type="button"
                  className={`carousel-arrow carousel-arrow-left ${canScrollLeft ? '' : 'hidden-arrow'}`}
                  onClick={() => scrollTo('prev')}
                  aria-label="Scroll left"
                >
                  <ChevronLeft size={18} />
                </button>

                {/* Scrollable Track */}
                <div className="carousel-track" ref={scrollRef}>
                  {tasks.map((task, index) => (
                    <div className="carousel-card-slot" key={task.id}>
                      <TaskCard
                        task={task}
                        index={index}
                        onEdit={onEditTask}
                        onView={() => onViewTask(task)}
                      />
                    </div>
                  ))}
                  {provided.placeholder}
                </div>

                {/* Right Arrow */}
                <button
                  type="button"
                  className={`carousel-arrow carousel-arrow-right ${canScrollRight ? '' : 'hidden-arrow'}`}
                  onClick={() => scrollTo('next')}
                  aria-label="Scroll right"
                >
                  <ChevronRight size={18} />
                </button>

                {/* Dot Indicators */}
                {tasks.length > 1 && (
                  <div className="carousel-dots">
                    {tasks.map((task, i) => (
                      <button
                        key={task.id}
                        type="button"
                        className={`carousel-dot ${i === activeIdx ? 'active' : ''}`}
                        onClick={() => scrollToIndex(i)}
                        aria-label={`Go to task ${i + 1}`}
                        title={`[${task.taskId}] ${task.title}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                {tasks.map((task, index) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    index={index}
                    onEdit={onEditTask}
                    onView={() => onViewTask(task)}
                  />
                ))}
                {provided.placeholder}
              </>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}

export default React.memo(Column);
