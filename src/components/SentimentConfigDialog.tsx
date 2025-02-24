import * as Dialog from '@radix-ui/react-dialog';
import { Settings } from 'lucide-react';
import { SentimentConfigForm } from './SentimentConfigForm';
import { ProviderHealthIndicator } from './ProviderHealthIndicator';

export function SentimentConfigDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
          <Settings className="h-4 w-4" />
          <span>Sentiment Settings</span>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-2xl w-[90vw] max-h-[85vh] overflow-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl">
            <Dialog.Title className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Sentiment Analysis Settings
              </h2>
            </Dialog.Title>
            <div className="grid grid-cols-1 md:grid-cols-[2fr,1fr] gap-6 p-6">
              <SentimentConfigForm />
              <div className="border-l border-gray-200 dark:border-gray-700 pl-6">
                <ProviderHealthIndicator />
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}