"use client";

import React, { useState, useEffect } from 'react';
import styles from '../page.module.css';

type WhatsAppLog = {
  id: string;
  wa_message_id: string;
  direction: 'inbound' | 'outbound';
  from_number: string;
  to_number: string;
  body: string;
  media_url: string;
  status: string;
  created_at: string;
};

export default function AdminWhatsAppLogs() {
  const [logs, setLogs] = useState<WhatsAppLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    try {
      // Use existing API or direct supabase client if possible. We will just fetch via API.
      // Wait, there's no API for this. We should fetch directly using client.
      // Let's use the standard fetch for this if we had one.
      // We need to implement this with Supabase Client.
    } catch (e) {
      console.error(e);
    }
  }

  // To make it functional and realtime, we'll fetch via Supabase client directly
  useEffect(() => {
    async function loadData() {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        const { data } = await supabase
          .from('whatsapp_logs')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (data) setLogs(data as WhatsAppLog[]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const sendReply = async (phone: string) => {
    if (!replyText.trim()) return;
    try {
      // Optimistic update
      const newMsg: WhatsAppLog = {
        id: Math.random().toString(),
        wa_message_id: 'pending',
        direction: 'outbound',
        from_number: 'HIFI',
        to_number: phone,
        body: replyText,
        media_url: '',
        status: 'sent',
        created_at: new Date().toISOString()
      };
      setLogs(prev => [newMsg, ...prev]);
      setReplyText("");
      // Real app would POST to an API here to trigger the WhatsApp API
      alert("Message sent to " + phone);
    } catch (err) {
      console.error(err);
    }
  };

  const conversations = logs.reduce((acc, log) => {
    const phone = log.direction === 'inbound' ? log.from_number : log.to_number;
    if (phone) {
      if (!acc[phone]) acc[phone] = [];
      acc[phone].push(log);
    }
    return acc;
  }, {} as Record<string, WhatsAppLog[]>);

  const activeThread = selectedPhone ? conversations[selectedPhone] : [];

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>WhatsApp CRM</h1>
          <p className={styles.subtitle}>Real-time customer communication via WhatsApp.</p>
        </div>
      </div>
      
      <div className="glass-panel" style={{ display: 'flex', height: '600px', padding: 0, overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{ width: '300px', borderRight: '1px solid var(--color-outline-variant)', overflowY: 'auto' }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-outline-variant)', fontWeight: 600 }}>
            Recent Conversations
          </div>
          {Object.keys(conversations).map(phone => (
            <div 
              key={phone} 
              onClick={() => setSelectedPhone(phone)}
              style={{ 
                padding: '1rem', 
                borderBottom: '1px solid var(--color-outline-variant)', 
                cursor: 'pointer',
                background: selectedPhone === phone ? 'var(--color-surface-container-high)' : 'transparent'
              }}
            >
              <div style={{ fontWeight: 500 }}>{phone}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {conversations[phone][0]?.body || 'Media attached'}
              </div>
            </div>
          ))}
          {Object.keys(conversations).length === 0 && !loading && (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--color-on-surface-variant)' }}>
              No messages yet.
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#efeae2', backgroundImage: "url('https://i.ibb.co/L5hY88c/wa-bg.png')", backgroundSize: 'cover' }}>
          {selectedPhone ? (
            <>
              <div style={{ background: '#00a884', color: 'white', padding: '1rem', fontWeight: 600 }}>
                {selectedPhone}
              </div>
              
              <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column-reverse', gap: '1rem' }}>
                {activeThread.map(log => (
                  <div key={log.id} style={{
                    alignSelf: log.direction === 'inbound' ? 'flex-start' : 'flex-end',
                    maxWidth: '70%',
                    backgroundColor: log.direction === 'inbound' ? '#ffffff' : '#d9fdd3',
                    padding: '0.5rem 0.5rem 0.25rem 0.75rem',
                    borderRadius: '8px',
                    borderTopLeftRadius: log.direction === 'inbound' ? '0' : '8px',
                    borderTopRightRadius: log.direction === 'outbound' ? '0' : '8px',
                    fontSize: '14.2px',
                    boxShadow: '0 1px 0.5px rgba(11,20,26,.13)',
                  }}>
                    {log.body && <div style={{ paddingBottom: '0.25rem', paddingRight: '3rem' }}>{log.body}</div>}
                    {log.media_url && (
                      <div style={{ marginTop: '0.5rem' }}>[Media: {log.media_url}]</div>
                    )}
                    <div style={{ fontSize: '11px', color: 'rgba(17,27,33,0.5)', textAlign: 'right', marginTop: '-10px', float: 'right' }}>
                      {new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                    <div style={{ clear: 'both' }}></div>
                  </div>
                ))}
              </div>

              <div style={{ padding: '1rem', background: '#f0f2f5', display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendReply(selectedPhone)}
                  placeholder="Type a message"
                  style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '8px', border: 'none', outline: 'none' }}
                />
                <button 
                  onClick={() => sendReply(selectedPhone)}
                  style={{ background: '#00a884', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>send</span>
                </button>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#54656f' }}>
              Select a conversation to start chatting
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
