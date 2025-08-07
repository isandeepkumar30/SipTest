import { makeObservable, observable, action } from 'mobx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ToastAndroid } from 'react-native';

class HomePageStore
{
  studentData: any[] = [];
  searchQuery: string = '';
  isLoading: boolean = false;
  profilePic: string = '';
  refreshing: boolean = false;

  constructor()
  {
    makeObservable( this, {
      studentData: observable,
      searchQuery: observable,
      isLoading: observable,
      profilePic: observable,
      refreshing: observable,
      setRefreshing: action.bound,
      setProfilePic: action.bound,
      setSearchQuery: action.bound,
      setStudentData: action.bound,
      setIsLoading: action.bound,
    } );
  }
  setRefreshing ( refreshing: boolean )
  {
    this.refreshing = this.refreshing;
  }

  setIsLoading ( isLoading: boolean )
  {
    this.isLoading = isLoading;
  }
  setStudentData ( studentData: any[] )
  {
    this.studentData = studentData;
  }
  setSearchQuery ( searchQuery: string )
  {
    this.searchQuery = searchQuery;
  }
  setProfilePic ( profilePic: string )
  {
    this.profilePic = profilePic;
  }
}

export const homePageStore = new HomePageStore();



export const fetchHomePageData = async () =>
{
  homePageStore.setIsLoading( true );
  try
  {
    const apiUrlFromStorage = await AsyncStorage.getItem( 'selectedItemInfo' );
    if ( apiUrlFromStorage )
    {
      const apiUrl = JSON.parse( apiUrlFromStorage ).apiUrl;
      const requestBody = {
        student_name: homePageStore.searchQuery,
      };
      const token = await AsyncStorage.getItem( 'token' );

      const response = await fetch( apiUrl + 'get-student-search-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ token }`,
        },
        body: JSON.stringify( requestBody ),
      } );

      if ( response.ok )
      {
        const responseData = await response.json();
        const students = responseData.data || [];

        const profilePic =
          students.length > 0 ? students[0].profile_pic : null;
        homePageStore.setProfilePic( profilePic );
        homePageStore.setStudentData( students );
      } else
      {
        console.error( `Error: ${ response.status } - ${ response.statusText }` );
        ToastAndroid.show(
          `Error: ${ response.status } - ${ response.statusText }`,
          ToastAndroid.LONG
        );
      }
    }
  } catch ( error )
  {
    ToastAndroid.show(
      'An error occurred while fetching data.',
      ToastAndroid.LONG
    );
  } finally
  {
    homePageStore.setIsLoading( false );
  }
};
