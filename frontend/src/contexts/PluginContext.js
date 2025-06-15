import { createContext } from 'preact';
import { useContext } from 'preact/hooks';

export const PluginContext = createContext(null);

export const usePluginContext = () => {
    return useContext(PluginContext);
};
