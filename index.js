/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

import { CallStateProvider } from './src/context/CallStateContext';

const Root = () => (
  <CallStateProvider>
    <App />
  </CallStateProvider>
);

AppRegistry.registerComponent(appName, () => Root);
