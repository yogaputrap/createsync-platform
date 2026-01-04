import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import { 
  Box, Typography, TextField, Button, IconButton, Paper, 
  Avatar, Divider, Badge, CircularProgress, Container 
} from '@mui/material';
import { 
  Send as SendIcon, 
  Forum as ThreadIcon, 
  ArrowBack as BackIcon,
  Circle as StatusIcon
} from '@mui/icons-material';
import ThreadPanel from '../components/ThreadPanel';

function ProjectChatPage() {
    const { projectId } = useParams();
    const token = localStorage.getItem('token');
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [connected, setConnected] = useState(false);
    const [activeThread, setActiveThread] = useState(null);
    
    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        socketRef.current = io('http://localhost:3001');
        const socket = socketRef.current;
        socket.on('connect', () => {
            setConnected(true);
            socket.emit('joinRoom', { projectId, token });
        });
        socket.on('joinedRoom', () => fetchMessageHistory());
        socket.on('receiveMessage', (msg) => setMessages(prev => [...prev, msg]));
        socket.on('updateReplyCount', ({ messageId }) => {
            setMessages(prev => prev.map(msg => 
                msg.message_id === messageId ? { ...msg, reply_count: Number(msg.reply_count || 0) + 1 } : msg
            ));
        });
        return () => socket.disconnect();
    }, [projectId, token]);

    useEffect(() => {
        if (!activeThread) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, activeThread]);

    const fetchMessageHistory = async () => {
        try {
            const res = await axios.get(`http://localhost:3001/api/projects/${projectId}/messages`, {
                headers: { 'x-auth-token': token }
            });
            setMessages(res.data);
        } catch (err) { console.error(err); }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socketRef.current) return;
        socketRef.current.emit('sendMessage', { projectId, content: newMessage, token, parentMessageId: null });
        setNewMessage('');
    };

    return (
        <Box sx={{ display: 'flex', height: 'calc(100vh - 100px)', gap: 0, position: 'relative', bgcolor: '#f0f2f5', borderRadius: 2, overflow: 'hidden', border: '1px solid #ddd' }}>
            
            {/* --- Alur Chat Utama --- */}
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                {/* Header Chat */}
                <Box sx={{ p: 2, bgcolor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #ddd' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <IconButton component={RouterLink} to={`/projects/${projectId}`} size="small"><BackIcon /></IconButton>
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold">Obrolan Proyek</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <StatusIcon sx={{ fontSize: 10, color: connected ? 'success.main' : 'error.main' }} />
                                <Typography variant="caption" color="text.secondary">{connected ? 'Online' : 'Offline'}</Typography>
                            </Box>
                        </Box>
                    </Box>
                </Box>

                {/* Area Pesan */}
                <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {messages.map((msg) => (
                        <Box key={msg.message_id} sx={{ display: 'flex', gap: 1.5, maxWidth: '80%' }}>
                            <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: '1rem' }}>{msg.sender_name[0]}</Avatar>
                            <Box>
                                <Paper elevation={0} sx={{ p: 1.5, borderRadius: '0 12px 12px 12px', bgcolor: 'white', border: '1px solid #e0e0e0' }}>
                                    <Typography variant="caption" fontWeight="bold" color="primary">{msg.sender_name}</Typography>
                                    <Typography variant="body2" sx={{ mt: 0.5, wordBreak: 'break-word' }}>{msg.content}</Typography>
                                </Paper>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                                    <Typography variant="caption" color="text.secondary">{new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Typography>
                                    <Button 
                                        size="small" 
                                        startIcon={<ThreadIcon sx={{ fontSize: 16 }} />} 
                                        onClick={() => setActiveThread(msg)}
                                        sx={{ textTransform: 'none', py: 0 }}
                                    >
                                        {msg.reply_count || 0} Balasan
                                    </Button>
                                </Box>
                            </Box>
                        </Box>
                    ))}
                    <div ref={messagesEndRef} />
                </Box>

                {/* Input Alur Utama */}
                <Box component="form" onSubmit={handleSendMessage} sx={{ p: 2, bgcolor: 'white', borderTop: '1px solid #ddd' }}>
                    <TextField
                        fullWidth
                        placeholder="Ketik pesan..."
                        variant="outlined"
                        size="small"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={!connected}
                        InputProps={{
                            endAdornment: (
                                <IconButton type="submit" color="primary" disabled={!newMessage.trim()}><SendIcon /></IconButton>
                            ),
                            sx: { borderRadius: 4 }
                        }}
                    />
                </Box>
            </Box>

            {/* --- Render Panel Thread (MUI Version) --- */}
            {activeThread && (
                <ThreadPanel
                    socket={socketRef.current}
                    token={token}
                    parentMessage={activeThread}
                    onClose={() => setActiveThread(null)}
                />
            )}
        </Box>
    );
}

export default ProjectChatPage;