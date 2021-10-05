import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import Jose from 'node-jose';
import zlib from 'react-zlib-js';

function shcTob64(shc: string): string {
  /* args:
     shc - e.g. 'shc:/1234<and-so-on>'

     returns:
     b64 url encoded jws string
     format; header.payload.signature
  */
  shc = shc.slice(5);
  let b64digits = [];
  for (let i = 0; i < shc.length; i += 2) {
    b64digits.push(parseInt(shc[i]) * 10 + parseInt(shc[i + 1]) + 45);
  }
  return b64digits.map((c) => String.fromCharCode(c)).join('');
}

function decompressPayload(payload: string): string {
  /* args:
     payload - base64 url encoded, compressed with DEFLATE

     returns:
     success - decompressed payload
     failure - raises
  */
  return zlib.inflateRawSync(Buffer.from(payload, 'base64'));
}

export default function App() {
  const JWKS_SK_URL = 'https://skphr.prd.telushealthspace.com/.well-known/jwks.json';
  let JWKS_SK = {  // hardcoded in case we're offline
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
  Jose.JWK.asKeyStore(JWKS_SK).
    then(function(result) {
      // {result} is a jose.JWK.KeyStore
      keystore = result;
    });

  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(null);

  useEffect(() => {
    (async () => {  // Request camera permission
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
    (async () => {  // Update JWKS
      try {
	const response = await fetch(JWKS_SK_URL);
	if (!response.ok) {
	  throw 'Invalid HTTP response';
	}
	const jwks = await response.json();
	JWKS_SK = jwks;
      } catch (err) {
	console.log(`Failed to update JWKS: ${err}`);
      }
    })();
  }, []);  // Only run effect once on mount.

  const handleBarCodeScanned = ({ type, data }) => {
    (async () => {
      setScanned(true);
      let isSuccess = true;
      let message = undefined;

      try {
	const result = await Jose.JWS.createVerify(keystore).verify(shcTob64(data));
	const payload = decompressPayload(result.payload);
	message = `Bar code with type ${type} validated successfully with data:\n${payload}`;
      } catch (err) {
	isSuccess = false;
	message = `Bar code with type ${type} failed to validate with error:\n${err}`;
      }

      Alert.alert(
	isSuccess ? 'Scan succeeded' : 'Scan failed',
	message,
	[
	  { text: 'OK', onPress: () => setScanned(false) },
	]
      );
    })();
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
