import Modal, { ModalActions } from './Modal';

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, loading }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-gray-600">{message}</p>
      <ModalActions
        onCancel={onClose}
        onConfirm={onConfirm}
        confirmLabel="Excluir"
        loading={loading}
      />
    </Modal>
  );
}
