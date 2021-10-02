import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';

export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);  // Only run effect once on mount.

  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true);
    Alert.alert(
      'Successful scan',
      `Bar code with type ${type} and data ${data} has been scanned!`,
      [
	{ text: 'OK', onPress: () => setScanned(false) },
      ]
    );
  };

  if (hasPermission === null) {
    return (<Text>Requesting for camera permission</Text>);
  }
  if (hasPermission === false) {
    return (<Text>No access to camera</Text>);
  }

  return (
    <View style={styles.container}>
      <BarCodeScanner
	onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
	style={StyleSheet.absoluteFillObject}
      />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
