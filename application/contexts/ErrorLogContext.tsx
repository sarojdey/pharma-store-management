import React, { createContext, useContext, useState, ReactNode } from "react";

export interface ErrorLog {
  id: string;
  message: string;
  timestamp: Date;
}

interface ErrorLogContextType {
  errorLogs: ErrorLog[];
  logError: (message: string) => void;
  clearLogs: () => void;
}

const ErrorLogContext = createContext<ErrorLogContextType | undefined>(
  undefined
);

interface ErrorLogProviderProps {
  children: ReactNode;
}

export const ErrorLogProvider: React.FC<ErrorLogProviderProps> = ({
  children,
}) => {
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);

  const logError = (message: string) => {
    const newError: ErrorLog = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      message: message.trim(),
      timestamp: new Date(),
    };

    setErrorLogs((prev) => [newError, ...prev]); // Add to beginning (newest first)
  };

  const clearLogs = () => {
    setErrorLogs([]);
  };

  return (
    <ErrorLogContext.Provider value={{ errorLogs, logError, clearLogs }}>
      {children}
    </ErrorLogContext.Provider>
  );
};

export const useErrorLog = (): ErrorLogContextType => {
  const context = useContext(ErrorLogContext);
  if (!context) {
    throw new Error("useErrorLog must be used within an ErrorLogProvider");
  }
  return context;
};
