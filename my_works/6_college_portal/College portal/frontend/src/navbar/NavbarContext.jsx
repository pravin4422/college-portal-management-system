import React, { createContext, useContext, useState } from 'react';

const NavbarContext = createContext();

export function NavbarProvider({ children }) {
  const [navActions, setNavActions] = useState(null);
  return (
    <NavbarContext.Provider value={{ navActions, setNavActions }}>
      {children}
    </NavbarContext.Provider>
  );
}

export function useNavbar() {
  return useContext(NavbarContext);
}
