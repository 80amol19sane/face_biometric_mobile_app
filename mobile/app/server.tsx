import { router } from 'expo-router';
import { useState } from 'react';
import { ApiError, callMethod, getServerUrl, normaliseServerUrl, saveServerUrl } from '../src/api/http';
import { Field } from '../src/components/Field';
import { Body, Button, Screen, Title } from '../src/components/ui';

export default function ServerScreen() {
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const connect = async () => {
    setBusy(true);
    setError(null);
    const previous = await getServerUrl();
    try {
      await saveServerUrl(normaliseServerUrl(address));
      await callMethod('ping', {}, 'GET');
      router.replace('/');
    } catch (e) {
      if (previous) await saveServerUrl(previous);
      setError(e instanceof ApiError ? e.message : 'Enter a valid https:// address, for example hrms.company.com');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Title>Connect to your company</Title>
      <Body>Enter the address of your HRMS site. Your HR team can tell you what it is.</Body>
      <Field
        label="Server address"
        placeholder="hrms.company.com"
        keyboardType="url"
        value={address}
        onChangeText={setAddress}
        returnKeyType="go"
        onSubmitEditing={connect}
      />
      {error && <Body tone="danger">{error}</Body>}
      <Button label="Connect" onPress={connect} busy={busy} disabled={!address.trim()} />
    </Screen>
  );
}
