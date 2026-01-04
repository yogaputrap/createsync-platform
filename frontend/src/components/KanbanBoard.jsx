// Nama file: frontend/src/components/KanbanBoard.jsx
// Penjelasan: (L23 & L25) Komponen Papan Kanban lengkap
//              dengan Drag-and-Drop dan Modal Detail Tugas.

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    DndContext,
    closestCenter,
    useDraggable,
    useDroppable,
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Impor Modal Detail Tugas
import TaskDetailModal from './TaskDetailModal';

// ===================================================================
// 1. Komponen Anak: Kartu Tugas (TaskCard)
// ===================================================================
// Ini adalah kartu yang bisa di-drag dan di-klik
function TaskCard({ task, onClick }) {
    const {
        attributes,
        listeners, // Ini adalah 'drag handle'
        setNodeRef, // Ini adalah referensi ke elemen DOM
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.task_id }); // ID unik untuk D&D

    // CSS untuk D&D (memindahkan, transisi, dll.)
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        padding: '10px',
        margin: '5px 0',
        border: '1px solid #ddd',
        borderRadius: '4px',
        backgroundColor: 'white',
        display: 'flex',       // Menggunakan flexbox
        justifyContent: 'space-between', // Untuk memisahkan konten dan handle
        alignItems: 'center',
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            {/* Area yang bisa diklik untuk membuka modal */}
            <div onClick={onClick} style={{ cursor: 'pointer', flexGrow: 1 }}>
                <h4>{task.title}</h4>
                {task.deadline && (
                    <small style={{ color: 'red' }}>
                        Deadline: {new Date(task.deadline).toLocaleDateString()}
                    </small>
                )}
            </div>

            {/* 'Drag Handle' (area untuk di-drag) */}
            <span 
                {...listeners} 
                style={{ cursor: 'grab', padding: '5px', touchAction: 'none' }}
            >
                ::
            </span>
        </div>
    );
}

// ===================================================================
// 2. Komponen Anak: Kolom Kanban (KanbanColumn)
// ===================================================================
// Ini adalah area 'droppable' (tempat menaruh kartu)
function KanbanColumn({ status, tasks = [], onTaskClick }) {
    // Menjadikan kolom ini 'droppable'
    const { setNodeRef } = useDroppable({ id: status });

    return (
        <div style={{ width: '24%', padding: '10px', backgroundColor: '#f4f4f4', borderRadius: '5px' }}>
            <h4>{status}</h4>
            <hr />

            {/* * Konteks untuk item-item yang bisa di-sort (kartu tugas)
              * di dalam kolom ini.
              */}
            <SortableContext
                id={status}
                items={tasks.map(t => t.task_id)} // Daftar ID tugas di kolom ini
                strategy={verticalListSortingStrategy}
            >
                <div ref={setNodeRef} style={{ minHeight: '100px' }}>
                    {tasks.map(task => (
                        <TaskCard
                            key={task.task_id}
                            task={task}
                            onClick={() => onTaskClick(task)} // Teruskan klik ke parent
                        />
                    ))}
                </div>
            </SortableContext>
        </div>
    );
}

// ===================================================================
// 3. Komponen Utama: Papan Kanban (KanbanBoard)
// ===================================================================
const columns = ['To Do', 'In Progress', 'Review', 'Done'];

function KanbanBoard({ projectId }) {
    // --- State ---
    const [tasks, setTasks] = useState([]); // Daftar semua tugas
    const [newTaskTitle, setNewTaskTitle] = useState(''); // Input form
    const [message, setMessage] = useState(''); // Pesan error/info
    const [selectedTask, setSelectedTask] = useState(null); // Tugas untuk modal (L25)
    
    const token = localStorage.getItem('token');

    // --- Pengambilan Data (Fetch) ---
    const fetchTasks = async () => {
        const config = { headers: { 'x-auth-token': token } };
        try {
            const res = await axios.get(`http://localhost:3001/api/projects/${projectId}/tasks`, config);
            setTasks(res.data);
        } catch (err) {
            setMessage('Gagal memuat tugas');
        }
    };

    // Ambil tugas saat komponen dimuat
    useEffect(() => {
        if (projectId) {
            fetchTasks();
        }
    }, [projectId]);

    // --- Handler: Buat Tugas Baru (L23) ---
    const handleCreateTask = async (e) => {
        e.preventDefault();
        if (!newTaskTitle) return;

        const config = { headers: { 'Content-Type': 'application/json', 'x-auth-token': token } };
        const body = JSON.stringify({ title: newTaskTitle });

        try {
            const res = await axios.post(`http://localhost:3001/api/projects/${projectId}/tasks`, body, config);
            setTasks([...tasks, res.data]); // Tambahkan tugas baru ke state
            setNewTaskTitle(''); // Kosongkan input
        } catch (err) {
            setMessage('Gagal membuat tugas');
        }
    };

    // --- Handler: Drag-and-Drop (L23) ---
    const handleDragEnd = async (event) => {
        const { active, over } = event;

        if (!over) return; // Drop di luar kolom

        const activeId = active.id; // task_id yang di-drag
        const newStatus = over.id; // status kolom (cth: 'In Progress')

        const taskToMove = tasks.find(t => t.task_id === activeId);

        // Hanya update jika statusnya benar-benar berubah
        if (taskToMove && taskToMove.status !== newStatus) {
            
            // 1. Update UI (Optimistic Update)
            setTasks(prevTasks =>
                prevTasks.map(t =>
                    t.task_id === activeId ? { ...t, status: newStatus } : t
                )
            );

            // 2. Panggil API untuk menyimpan ke DB
            try {
                const config = { headers: { 'Content-Type': 'application/json', 'x-auth-token': token } };
                const body = JSON.stringify({ status: newStatus });
                
                await axios.put(
                    `http://localhost:3001/api/tasks/${activeId}/status`,
                    body,
                    config
                );
            } catch (err) {
                setMessage('Gagal memperbarui status. Mengembalikan...');
                // 3. Jika API gagal, kembalikan state (Rollback)
                setTasks(prevTasks =>
                    prevTasks.map(t =>
                        t.task_id === activeId ? { ...t, status: taskToMove.status } : t
                    )
                );
            }
        }
    };

    // --- Handler: Simpan dari Modal (L25) ---
    const handleSaveDetails = (updatedTask) => {
        // Update state 'tasks' utama agar perubahan terlihat di Kanban
        setTasks(prevTasks => 
            prevTasks.map(t => 
                t.task_id === updatedTask.task_id ? updatedTask : t
            )
        );
    };

    // --- Helper ---
    const getTasksByStatus = (status) => tasks.filter(task => task.status === status);

    // --- Render JSX ---
    return (
        <div className="kanban-board">
            <h3>(L23) Papan Kanban (Drag & Drop)</h3>
            
            {/* Formulir Buat Tugas Baru */}
            <form onSubmit={handleCreateTask} style={{ marginBottom: '20px' }}>
                <input 
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Judul tugas baru..."
                />
                <button type="submit">Tambah Tugas</button>
                {message && <p style={{color: 'red'}}>{message}</p>}
            </form>

            {/* * Konteks D&D utama
              * Membungkus seluruh papan.
              */}
            <DndContext
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                    {columns.map(status => (
                        <KanbanColumn
                            key={status}
                            status={status}
                            tasks={getTasksByStatus(status)}
                            onTaskClick={(task) => setSelectedTask(task)} // Buka modal
                        />
                    ))}
                </div>
            </DndContext>

            {/* * Render Modal (L25)
              * Hanya render jika 'selectedTask' tidak null.
              */}
            {selectedTask && (
                <TaskDetailModal
                    task={selectedTask}
                    onClose={() => setSelectedTask(null)} // Handler untuk menutup
                    onSave={handleSaveDetails} // Handler untuk menyimpan
                />
            )}
        </div>
    );
}

export default KanbanBoard;