import { Alert, Linking, PermissionsAndroid, Platform, ToastAndroid } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import * as ImagePicker from 'react-native-image-picker';
import moment from 'moment';

export const showToastMessage = ({ message = '' }) => {
  try {
    if (Platform.OS === 'android') {
      ToastAndroid.showWithGravityAndOffset(message, 200, 20, 25, 10);
    } else {
    }
  } catch (e) {
    console.log(e);
  }
};

export const getFcmToken = async () => {
  try {
    const hasPermission = await messaging().hasPermission();
    if (hasPermission) {
      const token = await messaging().getToken();
      return token;
    }
    return null;
  } catch (e) {
    console.log(e);
    return null;
  }
};

export const imagePicker = async ({ type }) => {
  try {
    const options = {
      mediaType: 'photo',
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: false,
      selectionLimit: 5
    };

    const cameraData = async () => {
      try {
        const response = await ImagePicker.launchCamera({...options, quality: 0.2});
        if (response.didCancel) {
          console.log('user cancel');
          return null;
        } else if (response.errorCode) {
          console.log(response.errorCode);
          return null;
        } else if (response.errorMessage) {
          console.log(response.errorMessage);
          return null;
        } else {
          return response.assets;
        }
      } catch (e) {
        console.log(e)
        return null
      }

    }

    if (type == 'capture') {
      const result = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA)
      if (result) {
        return cameraData()
      } else {
        const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA)
        if (result === PermissionsAndroid.RESULTS.GRANTED) {
          return cameraData()
        }
      }

    } else {
      const response = await ImagePicker.launchImageLibrary(options);
      if (response.didCancel) {
        console.log('user cancel');
        return null;
      } else if (response.errorCode) {
        console.log(response.errorCode);
        return null;
      } else if (response.errorMessage) {
        console.log(response.errorMessage);
        return null;
      } else {
        return response.assets;
      }
    }
  } catch (e) {
    console.log(e);
    return null;
  }
};

const inidanNumber = Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  currencyDisplay: 'symbol',
  minimumFractionDigits: 2,
});

export const showNumber = value => {
  return inidanNumber.format(value);
};

export const getForamtedDate = (date) => {
  try {
    // Get current date
    const currentDate = new Date();
    const tempDate = new Date(date)
    // Set current date to midnight
    currentDate.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0)

    // Get the difference in milliseconds between the current date and the argument date
    const timeDiff = currentDate.getTime() - date.getTime();

    // Calculate the number of milliseconds in a day
    const oneDay = 1000 * 60 * 60 * 24;

    // If the argument date is today, return "Today"
    if (timeDiff >= 0 && timeDiff < oneDay) {
      return `Today ${moment(tempDate).format('hh:mm A')}`;
    }
    // If the argument date is yesterday, return "Yesterday"
    else if (timeDiff >= oneDay && timeDiff < 2 * oneDay) {
      return `Yesterday ${moment(tempDate).format('hh:mm A')}`;
    }

    else return moment(tempDate).format('DD MMM YYYY hh:mm A');

  } catch (e) {
    console.log(e)
    return null
  }
}

export const openGoogleMapsWithCarDirections = (startLatitude, startLongitude, destinationLatitude, destinationLongitude) => {
  const url = Platform.select({
    ios: `http://maps.apple.com/?daddr=${destinationLatitude},${destinationLongitude}&dir=d`, // Use Apple Maps for iOS
    android: `https://www.google.com/maps?dir=d&saddr=${startLatitude},${startLongitude}&daddr=${destinationLatitude},${destinationLongitude}`, // Use Google Maps for Android
  });

  Linking.canOpenURL(url)
    .then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        showToastMessage({message: 'Please install google maps'})
        console.warn('Google Maps app not found or URL scheme not supported');
      }
    });
};

export const secondsToHMS = (duration) => {
  const seconds = parseFloat(duration).toFixed(0)
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  const formattedHours = String(hours).padStart(2, '0');
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(remainingSeconds).padStart(2, '0');

  return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}

export const mergeDateAndTime = (dateObj, timeObj) => {
  // Extract date components
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth();
  const day = dateObj.getDate();

  // Extract time components
  const hours = timeObj.getHours();
  const minutes = timeObj.getMinutes();
  const seconds = timeObj.getSeconds();

  // Create new Date object with combined date and time
  const mergedDateTime = new Date(year, month, day, hours, minutes, seconds);

  return mergedDateTime;
}


