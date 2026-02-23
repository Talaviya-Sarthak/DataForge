const apiBase = import.meta.env.VITE_NODE_API_URL || 'http://localhost:5000';

export interface CleaningRequest {
    action: string;
    strategy: string;
    columns: string[];
    dataset_id?: number;
}

export const applyCleaningAction = async (request: CleaningRequest) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Authentication required');

    const res = await fetch(`${apiBase}/api/datasets/clean`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(request),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Cleaning failed' }));
        throw new Error(err.message || err.error || 'Cleaning failed');
    }

    return res.json();
};
