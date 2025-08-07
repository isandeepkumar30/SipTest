import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome';
import { observer } from 'mobx-react';
import { styles } from './viewNotesStyle';
import { addNotesStore } from '../../../Store/AddNotesStore/addNotesStore';
import { ViewNotesProps } from '../../../utils/DataTypeInterface/students_Data_Type';
import { homePageStore } from './../../../Store/HomePageStore/storeHomePage';
import LinearGradient from 'react-native-linear-gradient';
import
{
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ToastAndroid,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  Button,
} from 'react-native';
import { useColorScheme } from 'react-native';

export const ViewNotes: React.FC<ViewNotesProps> = observer( ( { id } ) =>
{
  const [isDeleting, setIsDeleting] = useState( false );
  const [isLoading, setIsLoading] = useState( false );
  const [refreshing, setRefreshing] = useState( false );
  const [showInputBox, setShowInputBox] = useState( false );
  const [userInput, setUserInput] = useState( '' );
  const [noteIdToDelete, setNoteIdToDelete] = useState<number | null>( null );

  const colorScheme = useColorScheme();


  const performDeleteOperation = async ( noteId: any ) =>
  {
    setIsDeleting( true );
    try
    {
      const apiUrlFromStorage = await AsyncStorage.getItem( 'selectedItemInfo' );
      if ( apiUrlFromStorage )
      {
        const apiUrl = JSON.parse( apiUrlFromStorage ).apiUrl;
        const token = await AsyncStorage.getItem( 'token' );
        const requestBody = {
          noteKey: noteId,
          noteReason: userInput,
        };
        const response = await fetch( apiUrl + `delete-student-note`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${ token }`,
          },
          body: JSON.stringify( requestBody ),
        } );

        if ( response.ok )
        {
          setShowInputBox( false );
          ToastAndroid.show( `'Note deleted successfully'`, ToastAndroid.LONG );
          console.log( 'Note deleted successfully' );
        } else
        {
          const errorResponse = await response.json();
          console.error( `Error: ${ response.status } - ${ response.statusText }`, errorResponse );
          ToastAndroid.show( `Error deleting note: ${ errorResponse.message || 'Unknown error' }`, ToastAndroid.LONG );
        }
      }
    } catch ( error )
    {
      console.error( 'An error occurred while deleting the note:', error );
      ToastAndroid.show( 'An error occurred while deleting the note', ToastAndroid.LONG );
    } finally
    {
      setIsDeleting( false );
    }
  };

  const onRefresh = React.useCallback( () =>
  {
    setRefreshing( true );
    fetchViewNotesData().then( () =>
    {
      setRefreshing( false );
    } );
  }, [] );


  const handleDeletePress = ( noteId: number ) =>
  {
    setShowInputBox( true );
    setNoteIdToDelete( noteId );
  };



  const handleSaveInput = () =>
  {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () =>
          {
            if ( noteIdToDelete !== null )
            {
              await performDeleteOperation( noteIdToDelete );
              addNotesStore.deleteNote( noteIdToDelete );
              setShowInputBox( false );
              setUserInput( '' );
              setNoteIdToDelete( null );
              fetchViewNotesData();
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const fetchViewNotesData = async () =>
  {
    setIsLoading( true );
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
        const response = await fetch( apiUrl + 'view-student-notes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${ token }`,
          },
          body: JSON.stringify( requestBody ),
        } );
        const responseBody = await response.json();

        if ( response.ok )
        {
          const notes = responseBody.data || [];
          // Alert.alert( notes, 'Notes fetched successfully' );
          addNotesStore.setAddNotesData( notes );
        } else
        {
          const errorMessage = `Error: ${ response.status } - ${ response.statusText }`;
          ToastAndroid.show( errorMessage, ToastAndroid.LONG );
        }
      }
    } catch ( error )
    {
      ToastAndroid.show(
        'An error occurred while fetching student data',
        ToastAndroid.LONG,
      );
    } finally
    {
      setIsLoading( false );
    }
  };


  useEffect( () =>
  {
    fetchViewNotesData();
  }, [id] );

  const countWords = ( text: string ) =>
  {
    return text ? text.trim().split( /\s+/ ).length : 0;
  };



  const toggleAccordion = ( index: number ) =>
  {
    addNotesStore.toggleAccordion( index );
  };

  return (
    <SafeAreaView>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#B6488D']}
            tintColor="#B6488D"
            title="Pull to refresh"
            titleColor="#B6488D"
          />
        }>
        {isDeleting || isLoading ? (
          <ActivityIndicator size="large" color="#B6488D" />
        ) : (
          <View style={styles.container}>
            {addNotesStore.addNotesData.map( ( item: any, index: any ) => (
              <View key={item.note_id || index} style={[styles.eventRow]}>
                {item.is_new_registration_flag === 1 ? (
                  <TouchableOpacity
                    onPress={() => handleDeletePress( item.note_id )}
                    style={[
                      styles.iconStyle,
                      {
                        backgroundColor: '#00FFFF',
                        borderTopLeftRadius: 25,
                        borderBottomLeftRadius: 25,
                      },
                    ]}>
                    <Icon
                      onPress={() => handleDeletePress( item.note_id )}
                      name="trash"
                      size={20}
                      style={{ color: 'black' }}
                    />
                  </TouchableOpacity>
                ) : item.raised_flag === 'parent' ? (
                  <LinearGradient
                    colors={['rgba(199,34,43,1)', 'rgba(105,125,18,1)', 'rgba(145,201,44,1)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.eventLeft}>
                    <TouchableOpacity
                      disabled={false}
                      onPress={() => handleDeletePress( item.note_id )}
                      style={[styles.iconStyle]}>
                      <Icon
                        name="trash"
                        size={20}
                        style={{
                          color: '#fff',
                        }}
                      />
                    </TouchableOpacity>
                  </LinearGradient>
                ) : item.raised_flag === null ? (
                  <View
                    style={[
                      styles.eventLeft,
                      {
                        backgroundColor:
                          item.raised_flag === 'yellow'
                            ? 'yellow'
                            : item.raised_flag === 'golden'
                              ? 'gold'
                              : item.is_new_registration_flag === 1
                                ? '#00FFFF'
                                : '#cfcfcf',
                      },
                    ]}>
                    <TouchableOpacity
                      disabled={false}
                      onPress={() => handleDeletePress( item.note_id )}
                      style={[styles.iconStyle]}>
                      <Icon
                        name="trash"
                        size={20}
                        style={{
                          color:
                            item.raised_flag === 'yellow' ? 'black' : '#fff',
                          fontSize: 0,
                        }}
                      />
                    </TouchableOpacity>
                  </View>
                ) : item.raised_flag === 'golden' ||
                  item.is_new_registration_flag === 1 ? (
                  <TouchableOpacity
                    onPress={() => handleDeletePress( item.note_id )}
                    style={[
                      styles.eventLeft,
                      {
                        backgroundColor: 'gold',
                      },
                    ]}>
                    <TouchableOpacity style={styles.iconStyle}>
                      <Icon
                        onPress={() => handleDeletePress( item.note_id )}
                        name="trash"
                        size={20}
                        style={{
                          color:
                            item.raised_flag === 'yellow' ? '#363636' : '#fff',
                        }}
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => handleDeletePress( item.note_id )}
                    style={[
                      styles.eventLeft,
                      {
                        backgroundColor: item.raised_flag,
                      },
                    ]}>
                    <TouchableOpacity style={styles.iconStyle}>
                      <Icon
                        onPress={() => handleDeletePress( item.note_id )}
                        name="trash"
                        size={20}
                        style={{
                          color:
                            item.raised_flag === 'yellow' ? 'black' : '#fff',
                        }}
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                )}
                <View
                  style={[
                    styles.eventRight,
                    item.only_admin === 1
                      ? { paddingTop: 4, paddingBottom: 10 }
                      : { paddingTop: 30 },
                  ]}>
                  {item.only_admin === 1 ? (
                    <View style={[styles.adminOnlyView]}>
                      <Text style={[styles.adminOnlyText]}>Admin Only</Text>
                    </View>
                  ) : null}
                  <Text style={[styles.eventLeftHeading]}>
                    {item.notes_added_by}{' '}
                    <Text
                      style={[
                        styles.eventSubDetail,
                        { paddingLeft: 0, fontSize: 14, fontWeight: 'normal' },
                      ]}>
                      {'('}
                      {item.flag_added_date}
                      {')'}
                    </Text>
                  </Text>
                  {addNotesStore.expandedIndex === index ? (
                    <Text style={styles.eventSubDetail}>{item.notes}</Text>
                  ) : (
                    <Text
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      style={styles.eventSubDetail}>
                      {item.notes}
                    </Text>
                  )}
                  {countWords( item.notes ) > 7 && (
                    <TouchableOpacity
                      onPress={() => toggleAccordion( index )}
                      style={styles.viewMoreButton}>
                      <Text style={styles.viewMoreButtonText}>
                        {addNotesStore.expandedIndex === index
                          ? 'View Less..'
                          : 'View More..'}
                      </Text>
                    </TouchableOpacity>
                  )}
                  <View>
                    {item.future_flag_to_be_raised !== null ? (
                      <View style={[styles.RaiseFlagView]}>
                        <Text style={[styles.RaiseFlagText]}>
                          Raise Flag ({item.future_flag_to_be_raised}) -
                          {item.future_flag_to_be_set_from}
                        </Text>
                      </View>
                    ) : null}
                    {item.future_flag_to_be_unset_from !== null ? (
                      <View style={[styles.UnSetRaiseFlagView]}>
                        <Text style={[styles.RaiseFlagText]}>
                          Unset Flag - {item.future_flag_to_be_unset_from}
                        </Text>
                      </View>
                    ) : null}

                    {item.flag_deleted === 1 ? (
                      <View>
                        <View>
                          <Text style={[styles.deleteFlagText]}>
                            {item.deleted_color} Flag removed by {item.deleted_by}
                            on {item.flag_deleted_time}
                          </Text>
                        </View>
                        <View>
                          <Text style={[styles.DeleteReasonFlagText]}>
                            Reason:- {item.deletion_reason}
                          </Text>
                        </View>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>
            ) )}
          </View>
        )}
        <Modal visible={showInputBox} transparent={true} animationType="slide" style={{
          backgroundColor: '#000000b3'
        }}>
          <View style={{ ...styles.modalContainer, backgroundColor: '#000000bf' }}>

            <View style={[styles.modalContent, { backgroundColor: colorScheme === 'dark' ? '#fff' : '#fff' }]}>
              <Text style={{ color: colorScheme === 'dark' ? '#000' : '#B6488D' }}>Write a reason for deletion: (OPTIONAL)</Text>
              <TextInput
                style={[styles.inputBox, { backgroundColor: colorScheme === 'dark' ? '#f9f9f9' : '#f9f9f9' }]}
                value={userInput}
                onChangeText={setUserInput}
                placeholder="Enter reason here"
                placeholderTextColor={colorScheme === 'dark' ? '#bbb' : '#777'}
              />
              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button} onPress={() => setShowInputBox( false )}>
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.buttonSave} onPress={handleSaveInput}>
                  <Text style={styles.buttonText}>Save</Text>
                </TouchableOpacity>
              </View>

            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView >
  );
} );
