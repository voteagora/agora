import React, { useState, useContext, ReactNode } from "react";

const RetroPGFModalContext = React.createContext({
  isModalOpen: false,
  openModal: () => {},
  closeModal: () => {},
});

export function useRetroPGFModal() {
  return useContext(RetroPGFModalContext);
}

export function RetroPGFModalProvider({ children }: { children: ReactNode }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <RetroPGFModalContext.Provider
      value={{ isModalOpen, openModal, closeModal }}
    >
      {children}
    </RetroPGFModalContext.Provider>
  );
}
