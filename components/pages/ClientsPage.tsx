import React, { useEffect, useState, useCallback } from 'react';
import PageShell from './PageShell';
import { ClientRecord } from '../../types';
import { entityStorage } from '../../services/storage';
import MarkdownBlock from '../MarkdownBlock';
import { subscribeToEntityUpdates } from '../../services/entityEvents';

const ClientsPage: React.FC = () => {
  const [records, setRecords] = useState<ClientRecord[]>([]);
  const [editingRecord, setEditingRecord] = useState<ClientRecord | null>(null);
  const [editName, setEditName] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const load = useCallback(async () => {
    const data = await entityStorage.getClientRecords();
    setRecords(data);
  }, []);

  useEffect(() => {
    load();
    const unsubscribe = subscribeToEntityUpdates('client', load);
    return unsubscribe;
  }, [load]);

  const startEdit = (record: ClientRecord) => {
    setEditingRecord(record);
    setEditName(record.name);
    setEditNotes(record.notes);
  };

  const saveEdit = async () => {
    if (!editingRecord) return;
    await entityStorage.saveClientRecord({ ...editingRecord, name: editName, notes: editNotes });
    setEditingRecord(null);
    load();
  };

  const deleteClient = async (id: string) => {
    await entityStorage.deleteClientRecord(id);
    load();
  };

  return (
    <PageShell title="Clients" subtitle="Every engagement gets a durable profile Sylvia can route intel into.">
      <div className="space-y-3">
        {records.map(record => (
          <div key={record.id} className="rounded-2xl border border-white/70 bg-white/80 p-4">
            <p className="text-sm uppercase tracking-[0.3em] text-secondary-light">{new Date(record.createdAt).toLocaleDateString()}</p>
            {editingRecord?.id === record.id ? (
              <div className="space-y-2">
                <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full rounded-2xl border border-white/70 px-3 py-2 bg-white/80" />
                <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} className="w-full rounded-2xl border border-white/70 px-3 py-2 bg-white/80" />
                <div className="flex gap-2 text-xs">
                  <button onClick={saveEdit} className="px-3 py-1 rounded-full bg-black text-white">Save</button>
                  <button onClick={() => setEditingRecord(null)} className="px-3 py-1 rounded-full bg-white border border-white/70">Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-semibold">{record.name}</h3>
                <MarkdownBlock content={record.notes} className="text-sm mt-1" />
                <div className="flex gap-2 text-xs mt-2">
                  <button onClick={() => startEdit(record)} className="px-3 py-1 rounded-full bg-white border border-white/70">Edit</button>
                  <button onClick={() => deleteClient(record.id)} className="px-3 py-1 rounded-full bg-white border border-white/70">Delete</button>
                </div>
              </>
            )}
          </div>
        ))}
        {records.length === 0 && <p className="text-secondary-light">No clients logged yet.</p>}
      </div>
    </PageShell>
  );
};

export default ClientsPage;
