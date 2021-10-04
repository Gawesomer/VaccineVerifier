import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';

function shcTob64(shc: string): string {
  /* args:
     shc - e.g. 'shc:/1234<and-so-on>'

     returns:
     b64 url encoded jws string
  */
  shc = shc.slice(5);
  let b64digits = [];
  for (let i = 0; i < shc.length; i+=2) {
    b64digits.push(parseInt(shc[i])*10 + parseInt(shc[i+1]) + 45);
  }
  return b64digits.map((c) => String.fromCharCode(c)).join('');
}

function isValidJWS(keystore: KeyStore, jws: string): boolean {
  let result = false;
  jose.JWS.createVerify(keystore).verify(jws).then(function(result) {result=true;}).catch((error) => {result = false;});
  return result;
}

export default function App() {
  const JWKS_SK = {  // https://skphr.prd.telushealthspace.com/.well-known/jwks.json
    keys: [
      {
	kty: 'EC',
	use: 'sig',
	crv: 'P-256',
	kid: 'xOqUO82bEz8APn_5wohZZvSK4Ui6pqWdSAv5BEhkes0',
	x: 'Hk4ktlNfoIIo7jp5I8cefp54Ils3TsKvKXw_E9CGIPE',
	y: '7hVieFGuHJeaNRCxVgKeVpoxDJevytgoCxqVZ6cfcdk',
	alg: 'ES256'
      }
    ]
  };

  let keystore = undefined;
  jose.JWK.asKeyStore(jwks).
    then(function(result) {
      // {result} is a jose.JWK.KeyStore
      keystore = result;
    });

  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);  // Only run effect once on mount.

  const handleBarCodeScanned = ({ type, data }) => {
    const isSuccess = isValidJWS(keystore, shcTob64(data));
    setScanned(true);
    Alert.alert(
      isSuccess ? 'Scan succeeded' : 'Scan failed',
      `Bar code with type ${type} and data ${data} has been scanned!`,
      [
	{ text: 'OK', onPress: () => setScanned(false) },
      ]
    );
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
	<Text>Requesting for camera permission</Text>
      </View>
    );
  }
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
	<Text>No access to camera</Text>
      </View>
    );
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
