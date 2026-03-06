import React, { useEffect, useState } from 'react';

interface BlocklistScreenProps {
    onBack: () => void;
}

const STORAGE_KEY = 'user_blocklist';

export function BlocklistScreen({ onBack }: BlocklistScreenProps) {
    const [items, setItems] = useState<string[]>([]);
    const [newItem, setNewItem] = useState('');

    useEffect(() => {
        // Load initial list
        chrome.storage.local.get(STORAGE_KEY, (result) => {
            if (result[STORAGE_KEY] && Array.isArray(result[STORAGE_KEY])) {
                setItems(result[STORAGE_KEY]);
            }
        });
    }, []);

    const handleAdd = () => {
        const trimmed = newItem.trim().toLowerCase();
        if (!trimmed) return;

        if (items.includes(trimmed)) {
            setNewItem('');
            return;
        }

        if (items.length >= 200) {
            alert('Blocklist limit reached (200 items).');
            return;
        }

        const updated = [...items, trimmed];
        saveList(updated);
        setNewItem('');
    };

    const handleDelete = (itemToDelete: string) => {
        const updated = items.filter(item => item !== itemToDelete);
        saveList(updated);
    };

    const saveList = (newList: string[]) => {
        setItems(newList);
        chrome.storage.local.set({ [STORAGE_KEY]: newList });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleAdd();
        }
    };

    return (
        <div className="w-80 bg-white font-sans text-slate-900 min-h-[400px] flex flex-col">
            <header className="flex items-center gap-2 p-4 border-b border-slate-100 bg-slate-50">
                <button
                    onClick={onBack}
                    className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors"
                    title="Back"
                >
                    <i className="ri-arrow-left-line text-xl"></i>
                </button>
                <h1 className="font-bold text-slate-800 flex-1 text-center pr-8">Hidden Words</h1>
            </header>

            <div className="p-4 flex-1 flex flex-col">
                <div className="text-xs text-slate-500 mb-4 px-1">
                Words you add here are handled only on your device.
                They are never sent, saved, or shared online.                </div>

                <div className="flex gap-2 mb-4">
                    <input
                        type="text"
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Add word or phrase..."
                        maxLength={20}
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                        autoFocus
                    />
                    <button
                        onClick={handleAdd}
                        disabled={!newItem.trim()}
                        className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Add
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto max-h-[250px] space-y-2 pr-1 custom-scrollbar">
                    {items.length === 0 && (
                        <div className="text-center text-slate-400 py-8 text-sm">
                            No hidden words yet.
                        </div>
                    )}
                    {items.map((item) => (
                        <div
                            key={item}
                            className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 group"
                        >
                            <span className="text-sm text-slate-700 font-medium truncate max-w-[180px]">
                                {item}
                            </span>
                            <button
                                onClick={() => handleDelete(item)}
                                className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                                title="Remove"
                            >
                                <i className="ri-delete-bin-line"></i>
                            </button>
                        </div>
                    ))}
                </div>

                <div className="text-[10px] text-center text-slate-400 mt-2">
                    {items.length} / 200 items
                </div>
            </div>
        </div>
    );
}
