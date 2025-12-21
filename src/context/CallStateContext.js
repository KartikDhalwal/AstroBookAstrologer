import React, { createContext, useState, useContext } from "react";

const CallStateContext = createContext();

export const CallStateProvider = ({ children }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [callUI, setCallUI] = useState(null); 
  const [isCallActive, setIsCallActive] = useState(false);
  const [remoteUid, setRemoteUid] = useState(null);
  const [tokenInfo, setTokenInfo] = useState(null);
  return (
    <CallStateContext.Provider
      value={{
        isMinimized,
        setIsMinimized,

        callUI,
        setCallUI,

        isCallActive,
        setIsCallActive,
        remoteUid, setRemoteUid,    // Shared
        tokenInfo, setTokenInfo,    // Shared
      }}
    >
      {children}
    </CallStateContext.Provider>
  );
};

export const useCallState = () => useContext(CallStateContext);
