import React, { useEffect } from 'react';
import { observer } from 'mobx-react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { upcomingEventStore } from '../../../Store/UpcomingEventStore/upComingEventStore';
import { styles } from './upcomingEventStyle';
import { UpdateUpcomingAttendance } from '../../UpdateAttendanceScreen/updateUpcomingAttendance';
import { UpcomingEventProps } from '../../../utils/DataTypeInterface/students_Data_Type';

import
{
  View,
  Text,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  ToastAndroid,
  RefreshControl,
} from 'react-native';

import { addNotesStore } from '../../../Store/AddNotesStore/addNotesStore';

export const UpcomingEvents: React.FC<UpcomingEventProps> = observer( ( { id } ) =>
{

  const [addRefreshing, setAddRefreshing] = React.useState( false );
  const fetchingUpcomingEventsData = async () =>
  {
    upcomingEventStore.setIsLoading( true );
    try
    {
      const apiUrlFromStorage = await AsyncStorage.getItem( 'selectedItemInfo' );
      if ( apiUrlFromStorage )
      {
        const apiUrl = JSON.parse( apiUrlFromStorage ).apiUrl;
        const requestBody = {
          studentKey: id,
        };
        const token = await AsyncStorage.getItem( 'token' );

        const response = await fetch( apiUrl + 'view-student-upcoming-events', {
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
          const upcomingEventData = responseData.data || [];

          upcomingEventStore.setUpcomingEventsDetails( upcomingEventData );
        } else
        {
          const errorMessage = `Error: ${ response.status } - ${ response.statusText }`;
          ToastAndroid.show( errorMessage, ToastAndroid.LONG );
        }
      }
    } catch ( error )
    {
      ToastAndroid.show(
        'An error occurred while fetching data.',
        ToastAndroid.LONG,
      );
    } finally
    {
      upcomingEventStore.setIsLoading( false );
    }
  };

  const onRefresh = React.useCallback( () =>
  {
    setAddRefreshing( true );
    fetchingUpcomingEventsData();

    setTimeout( () =>
    {
      setAddRefreshing( false );
    }, 2000 );
  }, [] );

  useEffect( () =>
  {
    fetchingUpcomingEventsData();
  }, [] );

  const arrayLength = upcomingEventStore.upcomingEventDetails.length;

  return (
    <SafeAreaView style={styles.upcomingsafeAreaView}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl
            refreshing={addRefreshing}
            onRefresh={onRefresh}
            colors={['#B6488D']}
            tintColor="#B6488D"
            title="Pull to refresh"
            titleColor="#B6488D"
          />
        }
        style={{ backgroundColor: '#ECEFF8' }}>
        {upcomingEventStore.isLoading ? (
          <ActivityIndicator size="large" color="#B6488D" />
        ) : (
          <View>
            <View style={styles.pageHeadingRow}>
              <Text style={styles.pageHeading}>
                Total Events
                <Text style={styles.eventCounting}> ({arrayLength})</Text>
              </Text>
            </View>
            <View>
              {upcomingEventStore.upcomingEventDetails.map(
                ( item: any, index: any ) => (
                  <View key={item.id || index}>
                    <View style={[styles.eventRow]}>
                      <Text style={styles.eventLeftHeading}>
                        {item.event_type} - [ {item.event_name} -
                        {item.event_tutor_name} ]
                      </Text>
                      <Text style={styles.eventSubDetail}>
                        {item.event_date}, {item.start_time} to {item.end_time}
                      </Text>

                      <View style={{ paddingHorizontal: 0, marginTop: 15 }}>
                        <Text
                          style={{
                            color: '#0073DA',
                            fontSize: 18,
                            marginBottom: 10,
                          }}>
                          Update Attendance
                        </Text>

                        <View
                          style={{
                            backgroundColor: '#fff',
                            borderTopLeftRadius: 20,
                            borderTopRightRadius: 20,
                            borderBottomRightRadius: 20,
                            borderBottomLeftRadius: 20,
                          }}>
                          <UpdateUpcomingAttendance
                            id={id}
                            eventId={item.event_id}
                            attendanceApiStatus={item.attendance_status}
                          />
                        </View>
                      </View>
                    </View>
                  </View>
                ),
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
} );
