import { makeObservable, observable, action, runInAction } from 'mobx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { data } from '../../utils/APIsMenu/ApidropDown';
import { Alert, ToastAndroid } from 'react-native';
import messaging from '@react-native-firebase/messaging';

class AuthStore {
  email: string = '';
  device_type: string = '';
  device_token: string = '';
  password: string = '';
  isLoggedIn: boolean = false;
  errorMessage: string = '';
  isPasswordVisible: boolean = false;
  isLoading: boolean = false;
  selectedItem: string | null = null;
  locationData = new Map<string, any>();
  modalVisible: boolean = false;
  selectedLocationObject: any;
  responseData: any[] = [];
  token: string = '';

  constructor() {
    makeObservable(this, {
      email: observable,
      password: observable,
      isLoggedIn: observable,
      errorMessage: observable,
      isPasswordVisible: observable,
      modalVisible: observable,
      isLoading: observable,
      selectedItem: observable,
      locationData: observable,
      device_token: observable,
      device_type: observable,
      responseData: observable,

      setModalVisible: action.bound,
      setDevice_token: action.bound,
      setDevice_type: action.bound,
      setEmail: action.bound,
      setPassword: action.bound,
      togglePasswordVisibility: action.bound,
      setSelectedItem: action.bound,
      setIsLoading: action.bound,
      setLocationData: action.bound,
      login: action.bound,
      setResponseData: action.bound,
      send2FAData: action.bound,
    });

    this.loadSelectedItem();
  }

  setModalVisible(modalVisible: boolean) {
    this.modalVisible = modalVisible;
  }

  setEmail(email: string) {
    this.email = email;
  }

  setDevice_token(device_token: string) {
    this.device_token = device_token;
  }

  setDevice_type(device_type: string) {
    this.device_type = device_type;
  }

  setPassword(password: string) {
    this.password = password;
  }

  togglePasswordVisibility() {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  setResponseData(responseData: any[]) {
    this.responseData = responseData;
  }

  setSelectedItem(item: string | null) {
    this.selectedItem = item;
    if (item) {
      const selectedLocationObject = data.find(
        location => location.value === item,
      );
      if (selectedLocationObject) {
        const apiData = {
          label: selectedLocationObject.label,
          apiUrl: selectedLocationObject.apiUrl,
          value: selectedLocationObject.value,
        };
        AsyncStorage.setItem('selectedItem', JSON.stringify(apiData));
      }
    } else {
      AsyncStorage.removeItem('selectedItem');
    }
  }

  setIsLoading(value: boolean) {
    this.isLoading = value;
  }

  setLocationData(locationLabel: string, data: any) {
    runInAction(() => {
      this.locationData.set(locationLabel, data);
    });
  }

  async loadSelectedItem() {
    try {
      const storedApiData = await AsyncStorage.getItem('selectedItem');
      if (storedApiData !== null) {
        const apiData = JSON.parse(storedApiData);
        runInAction(() => {
          this.selectedItem = apiData.label;
        });
      }
    } catch (error) {
      console.error('Error loading selected item:', error);
    }
  }

  async login() {
    try {
      const selectedLocationObject = data.find(
        item => item.value === this.selectedItem,
      );

      if (selectedLocationObject) {
        const apiUrl = selectedLocationObject.apiUrl + 'app-login';
        const FCMToken = await messaging().getToken();

        // Replace with actual token retrieval logic
        const deviceType = 'android';

        await AsyncStorage.setItem('email', this.email);
        await AsyncStorage.setItem('password', this.password);
        await AsyncStorage.setItem('FCMToken', FCMToken);
        await AsyncStorage.setItem('deviceType', deviceType);

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: this.email,
            password: this.password,
            device_type: deviceType,
            device_token: FCMToken,
          }),
        });

        if (response.status === 200) {
          const responseData = await response.json();
          if (responseData.status === 'Success') {
            runInAction(() => {
              this.isLoggedIn = true;
              this.errorMessage = '';
              this.responseData = responseData;
              if (responseData.secret) {
                AsyncStorage.setItem('google2fa_secret', responseData.secret);
              }
            });
          } else {
            runInAction(() => {
              this.isLoggedIn = false;
              this.errorMessage = responseData.message || 'An error occurred';
            });
          }
        } else {
          runInAction(() => {
            this.isLoggedIn = false;
            this.errorMessage = 'An error occurred';
          });
          const errorMessage = await response.text();
          ToastAndroid.showWithGravityAndOffset(
            errorMessage || 'Error during login',
            ToastAndroid.LONG,
            ToastAndroid.TOP,
            25,
            50,
          );
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      runInAction(() => {
        this.isLoggedIn = false;
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  async send2FAData(one_time_password: string, auth_mode: string) {
    try {
      const selectedLocationObject = data.find(
        item => item.value === this.selectedItem,
      );

      if (selectedLocationObject) {
        const apiUrl = selectedLocationObject.apiUrl + 'app-login/authenticate';
        const FCMToken = await AsyncStorage.getItem('FCMToken');
        // const FCMToken = 'DemoToken';
        const deviceType = await AsyncStorage.getItem('deviceType');
        const google2fa_secret =
          auth_mode === 'register'
            ? await AsyncStorage.getItem('google2fa_secret')
            : '';

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: this.email,
            password: this.password,
            device_type: deviceType,
            device_token: FCMToken,
            one_time_password,
            auth_mode,
            google2fa_secret,
          }),
        });

        const responseData = await response.json();

        if (response.status === 200 && responseData.status === 'Success') {
          runInAction(() => {
            this.responseData = responseData; // Ensure this contains the token
            this.isLoggedIn = true;
          });
          return responseData; // Make sure to return this
        } else {
          runInAction(() => {
            this.errorMessage =
              responseData.message || 'An error occurred while authenticating.';
          });
          throw new Error(this.errorMessage);
        }
      }
    } catch (error) {
      console.error('2FA authentication error:', error);
      throw error;
    }
  }
}

export const authStore = new AuthStore();
