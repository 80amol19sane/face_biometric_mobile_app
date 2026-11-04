import { File, Paths } from 'expo-file-system';
import { DeviceKey } from '../../modules/device-key';
import { emptyState, type QueueState, type QueueStorage } from './queue';

const FILE_NAME = 'scan-queue.bin';

/**
 * The queue on disk, encrypted with the Keystore AES key. The file is useless without this phone's
 * key. If the key is gone (app data cleared) the file cannot be read, and the queue starts empty.
 */
export const encryptedStorage: QueueStorage = {
  async load(): Promise<QueueState> {
    const file = new File(Paths.document, FILE_NAME);
    if (!file.exists) return emptyState();
    try {
      return JSON.parse(await DeviceKey.decrypt(await file.text())) as QueueState;
    } catch {
      return emptyState();
    }
  },

  async save(state: QueueState): Promise<void> {
    const file = new File(Paths.document, FILE_NAME);
    if (!file.exists) file.create();
    file.write(await DeviceKey.encrypt(JSON.stringify(state)));
  },
};

/** Remove the queue and its key, when the kiosk is forgotten. */
export function wipeQueue(): void {
  const file = new File(Paths.document, FILE_NAME);
  if (file.exists) file.delete();
  DeviceKey.deleteSecret();
}
