import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Box, Typography, IconButton, Paper, Avatar, 
  Divider, TextField, Button 
} from '@mui/material';
import { Close as CloseIcon, Send as SendIcon } from '@mui/icons-material';

function ThreadPanel({ socket, token, parentMessage, onClose }) {
    const [replies, setReplies] = useState([]);
    const [newReply, setNewReply] = useState('');
    const repliesEndRef = useRef(null);

    useEffect(() => {
        if (!parentMessage || !socket) return;
        socket.emit('joinThread', { messageId: parentMessage.message_id });
        
        axios.get(`http://localhost:3001/api/messages/${parentMessage.message_id}/replies`, {
            headers: { 'x-auth-token': token }
        }).then(res => setReplies(res.data));

        const handleReply = (reply) => {
            if (reply.parent_message_id === parentMessage.message_id) setReplies(prev => [...prev, reply]);
        };
        socket.on('receiveReply', handleReply);

        return () => {
            socket.emit('leaveThread', { messageId: parentMessage.message_id });
            socket.off('receiveReply', handleReply);
        };
    }, [parentMessage, socket, token]);

    useEffect(() => { repliesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [replies]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!newReply.trim()) return;
        socket.emit('sendMessage', { projectId: parentMessage.project_id, content: newReply, token, parentMessageId: parentMessage.message_id });
        setNewReply('');
    };

    return (
        <Paper elevation={8} sx={{ width: 350, display: 'flex', flexDirection: 'column', borderLeft: '1px solid #ddd', zIndex: 10 }}>
            {/* Header Thread */}
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8f9fa' }}>
                <Typography variant="h6" fontWeight="bold">Thread</Typography>
                <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
            </Box>
            <Divider />

            {/* Pesan Induk */}
            <Box sx={{ p: 2, bgcolor: '#fffbed' }}>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <Avatar sx={{ width: 24, height: 24, fontSize: '0.8rem' }}>{parentMessage.sender_name[0]}</Avatar>
                    <Typography variant="subtitle2" fontWeight="bold">{parentMessage.sender_name}</Typography>
                </Box>
                <Typography variant="body2">{parentMessage.content}</Typography>
            </Box>
            <Divider />

            {/* Alur Balasan */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {replies.map(reply => (
                    <Box key={reply.message_id} sx={{ display: 'flex', gap: 1.5 }}>
                        <Avatar sx={{ width: 30, height: 30, fontSize: '0.9rem', bgcolor: 'secondary.main' }}>{reply.sender_name[0]}</Avatar>
                        <Box>
                            <Typography variant="caption" fontWeight="bold">{reply.sender_name}</Typography>
                            <Typography variant="body2" sx={{ bgcolor: '#f0f2f5', p: 1, borderRadius: 2 }}>{reply.content}</Typography>
                        </Box>
                    </Box>
                ))}
                <div ref={repliesEndRef} />
            </Box>

            {/* Input Balasan */}
            <Box component="form" onSubmit={handleSend} sx={{ p: 2, borderTop: '1px solid #ddd' }}>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Balas thread..."
                    value={newReply}
                    onChange={(e) => setNewReply(e.target.value)}
                    InputProps={{
                        endAdornment: (
                            <IconButton type="submit" color="primary" disabled={!newReply.trim()}><SendIcon /></IconButton>
                        ),
                        sx: { borderRadius: 2 }
                    }}
                />
            </Box>
        </Paper>
    );
}

export default ThreadPanel;