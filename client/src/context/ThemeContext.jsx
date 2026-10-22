import React, { createContext, useContext, useEffect, useState } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [dark, setDark] = useState(() => {
        const saved = localStorage.getItem('eventora_theme');
        return saved ? saved === 'dark' : true; // default dark
    });

    useEffect(() => {
        const root = document.documentElement;
        if (dark) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('eventora_theme', dark ? 'dark' : 'light');
    }, [dark]);

    const toggle = () => setDark(d => !d);

    return (
        <ThemeContext.Provider value={{ dark, toggle }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
