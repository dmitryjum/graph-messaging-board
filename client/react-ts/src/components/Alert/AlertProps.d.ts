export interface AlertProps {
  skin? : 'error' | 'success' | 'info',
  onClose?: () => void,
  message: string
}