import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-[95vw] max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-lg rounded-2xl">
          <div className="flex flex-col space-y-1.5 text-center sm:text-left mb-6">
            <Dialog.Title className="text-xl font-bold text-gray-900">
              {title}
            </Dialog.Title>
          </div>
          {children}
          <Dialog.Close className="absolute right-4 top-4 rounded-full p-2 hover:bg-gray-100 transition-colors focus:outline-none">
            <X className="h-5 w-5 text-gray-500" />
            <span className="sr-only">Close</span>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
