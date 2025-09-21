"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

type RoleModalContextType = {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
};

const RoleModalContext = createContext<RoleModalContextType | undefined>(undefined);

export const RoleModalProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return (
    <RoleModalContext.Provider value={{ isOpen, openModal, closeModal }}>
      {children}
    </RoleModalContext.Provider>
  );
};

export const useRoleModal = () => {
  const context = useContext(RoleModalContext);
  if (!context) {
    throw new Error("useRoleModal must be used within a RoleModalProvider");
  }
  return context;
}