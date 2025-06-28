// Tambahkan ini ke file Modal.tsx
'use client';

import React, { ReactNode, useRef } from 'react';
import { useOverlay, usePreventScroll, useModal } from '@react-aria/overlays';
import { OverlayContainer } from '@react-aria/overlays';
import { useDialog } from '@react-aria/dialog';
import { FocusScope } from '@react-aria/focus';
import { motion } from 'framer-motion';

interface ModalProps {
  children: ReactNode;
  onClose: () => void;
}

export const Modal = ({ children, onClose }: ModalProps): React.JSX.Element => {
  const ref = useRef(null);
  const { overlayProps, underlayProps } = useOverlay({
    isOpen: true,
    onClose,
    isDismissable: true,
  }, ref);

  usePreventScroll();
  const { modalProps } = useModal();
  const { dialogProps } = useDialog({}, ref);

  return (
    <OverlayContainer>
      <div {...underlayProps} className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
        <FocusScope contain restoreFocus autoFocus>
          <motion.div
            ref={ref}
            {...overlayProps}
            {...dialogProps}
            {...modalProps}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white p-6 rounded-xl w-[90%] max-w-sm shadow-xl"
          >
            {children}
          </motion.div>
        </FocusScope>
      </div>
    </OverlayContainer>
  );
};