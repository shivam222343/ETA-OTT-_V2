import { create } from 'zustand';
import apiClient from '../api/axios.config';

export const useInstitutionStore = create((set) => ({
    institutions: [],
    currentInstitution: null,
    loading: false,
    error: null,

    fetchInstitutions: async () => {
        set({ loading: true, error: null });
        try {
            const response = await apiClient.get('/institutions/user/my-institutions');
            set({ institutions: response.data.data.institutions, loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    createInstitution: async (data) => {
        set({ loading: true, error: null });
        try {
            const response = await apiClient.post('/institutions', data);
            set((state) => ({
                institutions: [...state.institutions, response.data.data.institution],
                loading: false
            }));
            return response.data.data.institution;
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    joinInstitution: async (accessKey) => {
        set({ loading: true, error: null });
        try {
            const response = await apiClient.post('/institutions/join', { accessKey });
            set((state) => ({
                institutions: [...state.institutions, response.data.data.institution],
                loading: false
            }));
            return response.data.data.institution;
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    setCurrentInstitution: (institution) => {
        set({ currentInstitution: institution });
    }
}));
