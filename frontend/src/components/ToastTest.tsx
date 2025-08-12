import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function ToastTest() {
  const testToasts = () => {
    toast.success('Success toast!')
    toast.error('Error toast!')
    toast.info('Info toast!')
    toast.warning('Warning toast!')
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Toast Test</h1>
      <Button onClick={testToasts}>
        Test All Toasts
      </Button>
    </div>
  )
} 